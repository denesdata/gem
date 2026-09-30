"""
LangChain-based SQL Agent for InfluxDB
Converts natural language to SQL queries and answers questions
"""

from langchain_openai import ChatOpenAI
from influxdb import InfluxDBClient as InfluxDBClient1x
import os
import re
from typing import Dict, Any, Optional
import json

MODEL = "qwen/qwen3.8-flash"

_LANG_PREDICATE = re.compile(r'"lang"\s*=\s*\'[^\']*\'', re.IGNORECASE)
_FROM_UPCOMING = re.compile(r'\bfrom\s+"upcoming"', re.IGNORECASE)


def _drop_upcoming_lang_filter(query: str) -> str:
    """upcoming has no lang tag. A language predicate makes every funding query empty."""
    if not _FROM_UPCOMING.search(query):
        return query
    cleaned = _LANG_PREDICATE.sub("", query)
    previous = None
    while previous != cleaned:
        previous = cleaned
        cleaned = re.sub(r"\(\s*\)", "", cleaned)
        cleaned = re.sub(r"\b(AND|OR)\s+(AND|OR)\b", r"\1", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bWHERE\s+(AND|OR)\b", "WHERE", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+\b(AND|OR)\s*(GROUP BY|ORDER BY|LIMIT|$)", r" \2", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bWHERE\s*(GROUP BY|ORDER BY|LIMIT|$)", r"\1", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip()


class DataAgent:
    """
    AI Agent that converts natural language to SQL queries
    and provides intelligent answers about data
    """
    
    def __init__(self):
        # Initialize LLM via OpenRouter
        # OpenRouter supports multiple providers including Claude
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        llm_model = os.getenv("LLM_MODEL", MODEL)
        if "claude" in llm_model or "sonnet" in llm_model:
            llm_model = MODEL
        
        if not openrouter_key:
            raise ValueError("OPENROUTER_API_KEY not set in environment")
        
        # Use OpenRouter API (compatible with OpenAI format)
        # OpenRouter endpoint: https://openrouter.ai/api/v1
        self.llm = ChatOpenAI(
            model=llm_model,
            temperature=0,
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": os.getenv("OPENROUTER_REFERRER", "https://github.com/your-repo"),
                "X-Title": os.getenv("OPENROUTER_TITLE", "GEM Romania Intelligent Agent")
            }
        )
        
        # Connect to InfluxDB 1.8 (uses InfluxQL, not Flux)
        influx_host = os.getenv("INFLUXDB_HOST", "influxdb")
        influx_port = int(os.getenv("INFLUXDB_PORT", "8086"))
        influx_user = os.getenv("INFLUXDB_USER", "user")
        influx_password = os.getenv("INFLUXDB_PASSWORD", "")
        self.influx_database = os.getenv("INFLUXDB_DATABASE", "base")
        
        # Use InfluxDB 1.x client (InfluxQL)
        self.influx_client = InfluxDBClient1x(
            host=influx_host,
            port=influx_port,
            username=influx_user,
            password=influx_password,
            database=self.influx_database
        )
    
    
    def query(self, user_query: str) -> Dict[str, Any]:
        """
        Process natural language query and return answer + data
        
        Args:
            user_query: Natural language question about data
            
        Returns:
            Dict with answer, SQL/Flux query, and data
        """
        # Step 1: Generate InfluxQL query from natural language
        influxql_query = _drop_upcoming_lang_filter(self._generate_influxql_query(user_query))
        
        # Step 2: Execute query
        data = self._execute_query(influxql_query)
        
        # Step 3: Generate answer
        answer = self._generate_answer(user_query, data, influxql_query)
        
        return {
            "answer": answer,
            "sql": influxql_query,  # InfluxQL query
            "data": data
        }
    
    def _generate_influxql_query(self, user_query: str) -> str:
        """
        Use LLM to generate InfluxQL query from natural language
        """
        # First, try to get available measurements
        available_measurements = self._get_available_measurements()
        
        prompt = f"""You are an expert at converting natural language questions into InfluxDB InfluxQL queries for the Global Entrepreneurship Monitor (GEM) dataset.

User question: {user_query}

Available measurements in the database: {', '.join(available_measurements) if available_measurements else 'aps, nes, rostats, exec, exec3, news, upcoming'}

GEM DATA STRUCTURE:
This database contains Global Entrepreneurship Monitor (GEM) data for Romania and other countries.

KEY MEASUREMENTS:
- "aps" - Adult Population Survey (individual-level entrepreneurship data)
- "nes" - National Expert Survey (country-level framework conditions)
- "rostats" - Romanian enterprise statistics
- "exec" / "exec3" - Entrepreneurial activity execution data
- "news" / "upcoming" - News and funding opportunities

KEY TAGS:
- "lang" - Language code: "EN", "RO", "HU"
- "country" - Country code: "RO" (Romania), "HU" (Hungary), "PL" (Poland), "HR" (Croatia), etc.
- "type" - Indicator type (see below)

KEY INDICATORS (tag: "type"):
APS MEASUREMENT:
- "TEA" - Total Early-stage Entrepreneurial Activity rate (% of adult population)
- "EBO" - Established Business Ownership rate
- "Intent" - Entrepreneurial Intentions
- "Opport" - Opportunity Perception (seeing good opportunities)
- "Suskil" - Skills Perception (having skills to start business)
- "Frfail" - Fear of Failure

NES MEASUREMENT:
- "EFC1a", "EFC1b" - Financial resources availability
- "EFC2a", "EFC2b" - Government policies support
- "EFC3" - Government programs for SMEs
- "EFC4a", "EFC4b" - Entrepreneurial education
- "EFC5" - R&D transfer
- "EFC6" - Commercial/legal infrastructure
- "EFC7a", "EFC7b" - Market dynamics
- "EFC8" - Physical infrastructure
- "EFC9" - Cultural/social norms
- "NECI" - National Entrepreneurial Context Index

ROSTATS MEASUREMENT:
- "TEMPO_INT101O_3_2_2022_1" - Active enterprises by size classes
- "TEMPO_INT101O_13_2_2022_sect" - Active enterprises by sectors
- "TEMPO_RSI101A_3_2_2022_sal" - Employment in active enterprises
- "TEMPO_RSI101A_3_2_2022_ca" - Turnover of active enterprises
- "TEMPO_INT111C_3_2_2022_nou" - New enterprises statistics

EXEC/EXEC3 MEASUREMENTS:
- Executive summary data with TEA/EBO breakdowns
- Tag "second" can be "TEA" or "EBO" in exec3

OTHER MEASUREMENTS:
- "news" - News and media appearances (fields: type, desc, lang, link, media). "lang" applies here.
- "upcoming" - Funding calls. Fields are strings: "desc" (Romanian title), "link", "cat". The only tag is "close". There is NO "lang" tag and NO "value" field. Never filter "upcoming" by "lang", "country", or the user's language. The text stays Romanian even when the question is Hungarian or English.
  Category values for "cat":
  - 'Agricultura_op_fin' — agriculture, farms, orchards, vineyards, crops
  - 'Productie_op_fin' — manufacturing
  - 'Start-up_op_fin' — startups
  - 'IT_op_fin' — IT
  - 'Arta_and_culture_op_fin' — arts and culture
  - 'Alte_op_fin' — other
  - 'Toate_op_fin' — all sectors
  For a farm, orchard, vineyard, or other agricultural question use WHERE "cat"='Agricultura_op_fin'.
  Example: SELECT "desc", "link", "cat" FROM "upcoming" WHERE "cat"='Agricultura_op_fin'

Database details:
- Database: "{self.influx_database}" (InfluxDB 1.8)
- All data is stored in database "{self.influx_database}"

IMPORTANT: This is InfluxDB 1.8 using InfluxQL (not Flux). Use standard SQL-like InfluxQL syntax.

CRITICAL QUOTE RULES:
- Use DOUBLE QUOTES for identifiers (measurement names, tag names, field names): "aps", "country", "value"
- Use SINGLE QUOTES for string values in WHERE clauses: 'RO', 'TEA', 'EN'
- Example: WHERE "country"='RO' AND "type"='TEA' (NOT "country"="RO")

Generate an InfluxQL query that answers the user's question. The query should:
1. SELECT from the measurement (e.g., SELECT LAST("value") FROM "aps" or SELECT MEAN("value") FROM "nes")
2. Use WHERE clause to filter by tags with CORRECT QUOTES:
   - "country"='RO' (Romania), 'HU' (Hungary), 'PL' (Poland), 'HR' (Croatia), etc.
   - "type"='TEA', 'EBO', 'Intent', 'Opport', 'Suskil', 'Frfail', 'NECI', 'EFC1a', etc.
   - "lang"='EN', 'RO', or 'HU' on aps, nes, rostats, news, exec, and exec3 ONLY. Never on "upcoming".
3. Filter by time range if mentioned:
   - "last year" or "2023" = WHERE time >= '2023-01-01T00:00:00Z' AND time < '2024-01-01T00:00:00Z'
   - "last 5 years" = WHERE time >= '2019-01-01T00:00:00Z'
   - "from 2015 to 2023" = WHERE time >= '2015-01-01T00:00:00Z' AND time < '2024-01-01T00:00:00Z'
   - Data spans 2007-2023, timestamps are at year-end (e.g., 2023-12-31)
4. Use GROUP BY time(1y) for yearly aggregation
5. Use GROUP BY tags if comparing multiple series (e.g., GROUP BY "country")
6. Use functions: LAST(), MEAN(), SUM(), etc.

Return ONLY the InfluxQL query code, no markdown, no explanations, just the query.

Example InfluxQL queries (note the quote usage):

For TEA rate in Romania:
SELECT LAST("value") FROM "aps" WHERE "country"='RO' AND "type"='TEA' AND "lang"='EN'

For comparing countries (latest year):
SELECT LAST("value") FROM "aps" WHERE ("country"='RO' OR "country"='HU' OR "country"='PL' OR "country"='HR') AND "type"='TEA' AND "lang"='EN' GROUP BY "country"

For TEA rate in Romania over time:
SELECT LAST("value") FROM "aps" WHERE "country"='RO' AND "type"='TEA' AND "lang"='EN' GROUP BY time(1y)

For NES/NECI data:
SELECT LAST("value") FROM "nes" WHERE "country"='RO' AND "type"='NECI' AND "lang"='EN'

For all EFC scores:
SELECT LAST("value") FROM "nes" WHERE "country"='RO' AND "type"=~/^EFC/ AND "lang"='EN' GROUP BY "type"
"""
        
        try:
            response = self.llm.invoke(prompt)
            query = response.content.strip()
            
            # Clean up markdown code blocks if present
            if query.startswith("```"):
                query = query.split("```")[1]
                if query.startswith("flux"):
                    query = query[4:]
                query = query.strip()
            
            return query
        except Exception as e:
            print(f"Error generating InfluxQL query: {e}")
            # Fallback to a simple query
            return f'SELECT * FROM "aps" WHERE time >= now() - 30d LIMIT 100'
    
    def _get_available_measurements(self) -> list:
        """
        Try to get available measurements from InfluxDB
        This is a best-effort attempt
        """
        # Known measurements from the GEM dataset
        known_measurements = ["aps", "nes", "rostats", "exec", "exec3", "news", "upcoming"]
        
        try:
            # Use InfluxQL SHOW MEASUREMENTS
            result = self.influx_client.query('SHOW MEASUREMENTS')
            measurements = []
            for series in result:
                for point in series:
                    measurements.append(point['name'])
            
            # Return found measurements or fallback to known ones
            return measurements[:20] if measurements else known_measurements
        except:
            # Fallback to known measurements if query fails
            return known_measurements
    
    def _execute_query(self, influxql_query: str) -> list:
        """
        Execute InfluxQL query and return results
        """
        try:
            # Execute InfluxQL query
            result = self.influx_client.query(influxql_query)
            
            # Convert to list of dicts
            data = []
            for series in result:
                # Get tags from series
                tags = series.tags if hasattr(series, 'tags') else {}
                
                # Get measurement name
                measurement = series.name if hasattr(series, 'name') else None
                
                # Process points
                for point in series:
                    # InfluxDB 1.x returns points as objects with attributes
                    record_dict = {
                        "time": None,
                        "value": None,
                        "measurement": measurement
                    }
                    
                    # Extract time
                    if hasattr(point, 'time'):
                        time_val = point.time
                        if hasattr(time_val, 'isoformat'):
                            record_dict["time"] = time_val.isoformat()
                        else:
                            record_dict["time"] = str(time_val)
                    elif isinstance(point, dict) and 'time' in point:
                        time_val = point['time']
                        if hasattr(time_val, 'isoformat'):
                            record_dict["time"] = time_val.isoformat()
                        else:
                            record_dict["time"] = str(time_val)
                    
                    # Extract value - try different field names
                    value = None
                    for field_name in ['value', 'last', 'mean', 'sum', 'count']:
                        if hasattr(point, field_name):
                            value = getattr(point, field_name)
                            break
                        elif isinstance(point, dict) and field_name in point:
                            value = point[field_name]
                            break
                    
                    record_dict["value"] = value
                    
                    # Add all tags
                    for key, value in tags.items():
                        record_dict[key] = value
                    
                    # Add other attributes from point
                    if hasattr(point, '__dict__'):
                        for key, val in point.__dict__.items():
                            if key not in ["time", "value", "last", "mean", "sum", "count", "_raw"]:
                                record_dict[key] = val
                    elif isinstance(point, dict):
                        for key, val in point.items():
                            if key not in ["time", "value", "last", "mean", "sum", "count"]:
                                record_dict[key] = val
                    
                    data.append(record_dict)
            
            return data
        except Exception as e:
            print(f"Query execution error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _generate_answer(self, user_query: str, data: list, query: str) -> str:
        """
        Generate natural language answer from query results
        """
        # Format data summary
        data_summary = f"Found {len(data)} data points"
        if data:
            values = [d.get("value") for d in data if d.get("value")]
            if values:
                data_summary += f". Values range from {min(values)} to {max(values)}"
        
        prompt = f"""
        Based on this data query result, answer the user's question in the same language as the question.
        Format your answer as clean, well-structured HTML that can be displayed in a web browser.
        
        User question: {user_query}
        Query executed: {query}
        Data summary: {data_summary}
        Sample data: {json.dumps(data[:25], indent=2, ensure_ascii=False)}
        
        Provide a clear, informative answer formatted as HTML. Use:
        - <h3> or <h4> for section headings
        - <p> for paragraphs
        - <ul> and <li> for lists
        - <a href="..."> for each funding or news link in the data
        - <strong> or <b> for emphasis
        - <em> for subtle emphasis
        - Proper HTML structure with semantic tags
        
        Do NOT include <html>, <head>, or <body> tags - just the content.
        Funding calls ("upcoming") use "desc", "link", and "cat", not "value". If those rows are present, list them. Translate the Romanian titles into the user's language and keep every link. This dataset is GEM Romania, not Hungary: do not send the user to Hungarian agencies.
        If the sample data is empty, say the query returned no rows. Do not invent institutions or claim the calls were never collected.
        
        Return ONLY the HTML content, no markdown, no explanations outside HTML tags.
        """
        
        try:
            response = self.llm.invoke(prompt)
            answer_html = response.content.strip()
            
            # Clean up markdown code blocks if present
            if answer_html.startswith("```"):
                answer_html = answer_html.split("```")[1]
                if answer_html.startswith("html"):
                    answer_html = answer_html[4:]
                answer_html = answer_html.strip()
            
            # Ensure it's valid HTML (basic check)
            if not answer_html.startswith("<"):
                # Wrap in paragraph if it's plain text
                answer_html = f"<p>{answer_html}</p>"
            
            return answer_html
        except Exception as e:
            print(f"Error generating answer: {e}")
            return f"<p>I found {len(data)} data points, but couldn't generate a detailed answer. Data: {data_summary}</p>"

