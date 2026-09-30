"""
Chart Generator - Creates Vizzu/Visx charts from query results
"""

from typing import Dict, List, Any, Optional
import pandas as pd


class ChartGenerator:
    """
    Generates chart configurations for Vizzu and Visx
    based on query results and intent
    """
    
    def generate(
        self,
        data: List[Dict],
        query: str,
        chart_type: str = "auto"
    ) -> Dict[str, Any]:
        """
        Generate chart configuration based on data and query
        
        Args:
            data: Query results
            query: Original user query
            chart_type: 'vizzu', 'visx', or 'auto'
            
        Returns:
            Chart configuration dict
        """
        if not data:
            return {"type": "empty", "message": "No data to visualize"}
        
        # Detect chart type from query and data
        if chart_type == "auto":
            chart_type = self._detect_chart_type(query, data)
        
        # Generate appropriate chart
        # Vizzu temporarily disabled - using Chart.js compatible format
        if chart_type == "vizzu":
            return self._generate_chartjs_chart(data, query)
        elif chart_type == "visx":
            return self._generate_visx_chart(data, query)
        else:
            return self._generate_chartjs_chart(data, query)  # Default to Chart.js
    
    def _detect_chart_type(self, query: str, data: List[Dict]) -> str:
        """
        Detect best chart type from query intent
        """
        query_lower = query.lower()
        
        # Time series indicators
        if any(word in query_lower for word in ["over time", "trend", "last quarter", "last year", "historical"]):
            return "vizzu"  # Vizzu great for animated time series
        
        # Comparison indicators
        if any(word in query_lower for word in ["compare", "vs", "versus", "difference", "between"]):
            return "vizzu"  # Vizzu can morph between chart types
        
        # Distribution indicators
        if any(word in query_lower for word in ["distribution", "breakdown", "by category"]):
            return "visx"  # Visx great for complex distributions
        
        # Default to Vizzu for animations
        return "vizzu"
    
    def _generate_vizzu_chart(self, data: List[Dict], query: str) -> Dict[str, Any]:
        """
        Generate Vizzu chart configuration with multi-step animations
        Step 1: Static chart showing current data
        Step 2: Add aggregation or time filter
        """
        df = pd.DataFrame(data)
        
        # Determine dimensions and measures
        time_col = None
        value_col = None
        category_col = None
        country_col = None
        
        # Find columns
        for col in df.columns:
            col_lower = col.lower()
            if col_lower in ["time", "timestamp", "date", "_time"]:
                time_col = col
            elif col_lower in ["value", "_value", "amount", "count", "last", "mean"]:
                value_col = col
            elif col_lower in ["country", "category", "type", "measurement"]:
                if not category_col:
                    category_col = col
                if col_lower == "country":
                    country_col = col
        
        # Default to first and last columns if not found
        if not value_col and len(df.columns) > 0:
            value_col = df.columns[-1]
        if not category_col and len(df.columns) > 1:
            category_col = df.columns[0] if df.columns[0] != value_col else df.columns[1]
        
        # Prepare data for Vizzu (flatten nested structures)
        vizzu_data = []
        for row in data:
            flat_row = {}
            for key, val in row.items():
                if isinstance(val, dict):
                    flat_row.update(val)
                else:
                    flat_row[key] = val
            vizzu_data.append(flat_row)
        
        # Step 1: Static chart configuration
        step1_config = {
            "channels": {
                "y": {"set": [value_col] if value_col else []},
                "x": {"set": [category_col] if category_col else []},
            },
            "geometry": "rectangle",  # Bar chart
            "title": "Current Data Overview"
        }
        
        # Step 2: Add aggregation or time filter
        step2_config = {
            "channels": {
                "y": {"set": [value_col] if value_col else []},
                "x": {"set": [category_col] if category_col else []},
            },
            "geometry": "rectangle",
            "title": "Aggregated View"
        }
        
        # If we have time data, add time-based aggregation
        if time_col and len(vizzu_data) > 5:
            # Group by time periods
            step2_config["channels"]["x"]["set"] = [time_col]
            step2_config["geometry"] = "area"
            step2_config["title"] = "Time Series View"
        elif category_col and country_col:
            # If comparing countries, add grouping
            step2_config["channels"]["color"] = {"set": [country_col]}
            step2_config["title"] = "Grouped by Country"
        elif category_col:
            # Add color grouping
            step2_config["channels"]["color"] = {"set": [category_col]}
            step2_config["title"] = "Grouped View"
        
        config = {
            "type": "vizzu",
            "data": vizzu_data,
            "config": step1_config,
            "style": {
                "plot": {
                    "marker": {
                        "colorPalette": "#b74c95FF #47c1e8FF #ef7d4eFF #ffd93fFF #6cbb47FF #ff6b6bFF #4ecdc4FF #ffe66dFF"
                    }
                }
            },
            "animations": [
                {
                    "target": step2_config,
                    "duration": 1.2,
                    "delay": 0.5
                }
            ]
        }
        
        return config
    
    def _generate_chartjs_chart(self, data: List[Dict], query: str) -> Dict[str, Any]:
        """
        Generate Chart.js compatible chart configuration
        """
        df = pd.DataFrame(data)
        
        # Determine dimensions and measures
        time_col = None
        value_col = None
        category_col = None
        country_col = None
        
        # Find columns
        for col in df.columns:
            col_lower = col.lower()
            if col_lower in ["time", "timestamp", "date", "_time"]:
                time_col = col
            elif col_lower in ["value", "_value", "amount", "count", "last", "mean"]:
                value_col = col
            elif col_lower in ["country", "category", "type", "measurement"]:
                if not category_col:
                    category_col = col
                if col_lower == "country":
                    country_col = col
        
        # Default to first and last columns if not found
        if not value_col and len(df.columns) > 0:
            value_col = df.columns[-1]
        if not category_col and len(df.columns) > 1:
            category_col = df.columns[0] if df.columns[0] != value_col else df.columns[1]
        
        # Determine chart type
        has_time = time_col is not None and len(data) > 5
        chart_type = "line" if has_time else "bar"
        
        config = {
            "type": "chartjs",
            "data": data,
            "chartType": chart_type,
            "title": "GEM Romania Data Visualization"
        }
        
        return config
    
    def _generate_visx_chart(self, data: List[Dict], query: str) -> Dict[str, Any]:
        """
        Generate Visx chart configuration
        Visx is great for complex, beautiful visualizations
        """
        df = pd.DataFrame(data)
        
        config = {
            "type": "visx",
            "data": data,
            "chart": "XYChart",  # Default
            "series": [],
            "axes": [
                {"orientation": "bottom"},
                {"orientation": "left"}
            ]
        }
        
        # Determine chart type
        if len(df.columns) >= 2:
            x_col = df.columns[0]
            y_col = df.columns[-1]
            
            # Time series
            if "time" in x_col.lower() or "date" in x_col.lower():
                config["chart"] = "XYChart"
                config["series"] = [
                    {
                        "type": "AreaSeries",
                        "dataKey": y_col,
                        "fill": "#b74c95"
                    },
                    {
                        "type": "LineSeries",
                        "dataKey": y_col,
                        "stroke": "#47c1e8"
                    }
                ]
            else:
                # Bar chart
                config["chart"] = "BarChart"
                config["series"] = [
                    {
                        "type": "BarSeries",
                        "dataKey": y_col,
                        "fill": "#b74c95"
                    }
                ]
        
        return config

