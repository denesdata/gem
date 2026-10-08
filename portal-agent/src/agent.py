"""
LangChain SQL agent backed by GEM SQLite (~/gem/db/gem.sqlite).
Converts natural language → SQLite SQL → HTML answer.
"""

from langchain_openai import ChatOpenAI
import os
import re
import sqlite3
from typing import Dict, Any, List
import json

MODEL = "qwen/qwen3.7-flash"

_LANG_PREDICATE = re.compile(
    r"\b(?:lang\s*=\s*'[^']*'|\"lang\"\s*=\s*'[^']*')",
    re.IGNORECASE,
)
_FROM_UPCOMING = re.compile(r"\bfrom\s+upcoming\b", re.IGNORECASE)
_FORBIDDEN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|PRAGMA|REPLACE|CREATE|VACUUM)\b",
    re.IGNORECASE,
)


def _drop_upcoming_lang_filter(query: str) -> str:
    """upcoming has no language column. A lang predicate empties every funding query."""
    if not _FROM_UPCOMING.search(query):
        return query
    cleaned = _LANG_PREDICATE.sub("", query)
    previous = None
    while previous != cleaned:
        previous = cleaned
        cleaned = re.sub(r"\(\s*\)", "", cleaned)
        cleaned = re.sub(r"\b(AND|OR)\s+(AND|OR)\b", r"\1", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bWHERE\s+(AND|OR)\b", "WHERE", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(
            r"\s+\b(AND|OR)\s*(GROUP BY|ORDER BY|LIMIT|$)",
            r" \2",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\bWHERE\s*(GROUP BY|ORDER BY|LIMIT|$)",
            r"\1",
            cleaned,
            flags=re.IGNORECASE,
        )
    return re.sub(r"\s+", " ", cleaned).strip()


class DataAgent:
    def __init__(self):
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        llm_model = os.getenv("LLM_MODEL", MODEL)
        if "claude" in llm_model or "sonnet" in llm_model:
            llm_model = MODEL

        if not openrouter_key:
            raise ValueError("OPENROUTER_API_KEY not set in environment")

        self.llm = ChatOpenAI(
            model=llm_model,
            temperature=0,
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": os.getenv(
                    "OPENROUTER_REFERRER", "https://github.com/denesdata/gem"
                ),
                "X-Title": os.getenv("OPENROUTER_TITLE", "GEM Romania Intelligent Agent"),
            },
            extra_body={"reasoning": {"effort": "none"}},
        )

        self.db_path = os.getenv("SQLITE_PATH", "/data/db/gem.sqlite")
        if not os.path.exists(self.db_path):
            raise ValueError(f"SQLite database not found: {self.db_path}")
        # Prefer URI read-only so a :ro volume mount works without WAL sidecars.
        self.db_uri = f"file:{self.db_path}?mode=ro"

    def query(self, user_query: str) -> Dict[str, Any]:
        sql = _drop_upcoming_lang_filter(self._generate_sql(user_query))
        data = self._execute_query(sql)
        answer = self._generate_answer(user_query, data, sql)
        return {"answer": answer, "sql": sql, "data": data}

    def _generate_sql(self, user_query: str) -> str:
        prompt = f"""You are an expert at converting natural language into SQLite SELECT queries for the Global Entrepreneurship Monitor (GEM) Romania database.

User question: {user_query}

TABLES:
1) indicators — APS / NES survey metrics
   columns: dataset TEXT ('aps'|'nes'), year INT, country TEXT, type TEXT, value REAL,
            lang TEXT ('EN'|'RO'|'HU'), langtype TEXT, langcountry TEXT, iso3 TEXT, id TEXT
2) upcoming — funding calls (Romanian titles; NO lang column)
   columns: date TEXT, cat TEXT, close TEXT, desc TEXT, link TEXT
3) news — press / media
   columns: date TEXT, type TEXT, media TEXT, desc TEXT, lang TEXT, link TEXT
4) legal — county court backlog metrics
   columns: date TEXT, county TEXT, id INT, lang TEXT, langcounty TEXT, metric TEXT, value REAL
5) rostats — Romanian enterprise statistics (long form)
   columns: year INT, county TEXT, id REAL, lang TEXT, langcounty TEXT, metric TEXT, value REAL

INDICATOR type values (indicators.type):
APS (dataset='aps'): TEA, EBO, Intent, Opport, Suskil, Frfail, TEAgenderrate, TEAoppgenderrate
NES (dataset='nes'): EFC1a..EFC9, NECI, and related EFC codes

upcoming.cat values (a row may list several comma-separated):
  Agricultura_op_fin, Productie_op_fin, Start-up_op_fin, IT_op_fin,
  Arta_and_culture_op_fin, Alte_op_fin, Toate_op_fin, Servicii_op_fin, Turism_op_fin
For farm / orchard / vineyard / agriculture questions use:
  SELECT date, cat, close, desc, link FROM upcoming WHERE cat LIKE '%Agricultura_op_fin%'

RULES:
- READ-ONLY SELECT only. Never write DDL/DML.
- Prefer LIMIT 50 unless the user asks for more.
- For APS/NES filter dataset AND lang AND country/type as needed.
- Never filter upcoming by lang or country.
- String literals use single quotes.

Examples:
SELECT year, value FROM indicators WHERE dataset='aps' AND country='RO' AND type='TEA' AND lang='EN' ORDER BY year
SELECT date, cat, close, desc, link FROM upcoming WHERE cat LIKE '%Agricultura_op_fin%'
SELECT date, media, desc, link FROM news WHERE lang='RO' ORDER BY date DESC LIMIT 20

Return ONLY the SQL — no markdown, no explanation.
"""
        try:
            response = self.llm.invoke(prompt)
            query = response.content.strip()
            if query.startswith("```"):
                query = query.split("```")[1]
                if query.lower().startswith("sql"):
                    query = query[3:]
                query = query.strip()
            return query
        except Exception as e:
            print(f"Error generating SQL: {e}")
            return "SELECT date, cat, close, desc, link FROM upcoming LIMIT 25"

    def _execute_query(self, sql: str) -> List[dict]:
        cleaned = sql.strip().rstrip(";")
        if _FORBIDDEN.search(cleaned) or not cleaned.lower().startswith("select"):
            print(f"Rejected non-SELECT SQL: {sql}")
            return []
        try:
            conn = sqlite3.connect(self.db_uri, uri=True)
            conn.row_factory = sqlite3.Row
            try:
                cur = conn.execute(cleaned)
                return [dict(row) for row in cur.fetchall()]
            finally:
                conn.close()
        except Exception as e:
            print(f"Query execution error: {e}")
            import traceback

            traceback.print_exc()
            return []

    def _generate_answer(self, user_query: str, data: list, query: str) -> str:
        data_summary = f"Found {len(data)} data points"
        if data:
            values = [d.get("value") for d in data if d.get("value") is not None]
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

        Do NOT include <html>, <head>, or <body> tags - just the content.
        Funding calls (upcoming) use desc, link, and cat, not value. If those rows are present, list them.
        Translate Romanian titles into the user's language and keep every link.
        This dataset is GEM Romania, not Hungary: do not send the user to Hungarian agencies.
        If the sample data is empty, say the query returned no rows. Do not invent institutions.

        Return ONLY the HTML content, no markdown, no explanations outside HTML tags.
        """
        try:
            response = self.llm.invoke(prompt)
            answer_html = response.content.strip()
            if answer_html.startswith("```"):
                answer_html = answer_html.split("```")[1]
                if answer_html.startswith("html"):
                    answer_html = answer_html[4:]
                answer_html = answer_html.strip()
            if not answer_html.startswith("<"):
                answer_html = f"<p>{answer_html}</p>"
            return answer_html
        except Exception as e:
            print(f"Error generating answer: {e}")
            return f"<p>I found {len(data)} data points, but couldn't generate a detailed answer. Data: {data_summary}</p>"
