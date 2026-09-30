"""
AI Agent Service for Data Portal
Handles natural language queries, generates SQL, and creates charts
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

try:
    from agent import DataAgent
    from chart_generator import ChartGenerator
except ImportError:
    # Handle import errors gracefully
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from src.agent import DataAgent
    from src.chart_generator import ChartGenerator

load_dotenv()

app = FastAPI(title="GEM Romania Intelligent Agent", version="0.1.0")

# CORS for portal integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent and chart generator (lazy loading)
agent = None
chart_gen = None

def get_agent():
    global agent
    if agent is None:
        try:
            agent = DataAgent()
        except Exception as e:
            print(f"Warning: Could not initialize agent: {e}")
            agent = None
    return agent

def get_chart_gen():
    global chart_gen
    if chart_gen is None:
        chart_gen = ChartGenerator()
    return chart_gen


class QueryRequest(BaseModel):
    query: str
    generate_chart: bool = True
    chart_type: Optional[str] = None  # 'vizzu', 'visx', 'auto'


class QueryResponse(BaseModel):
    answer: str
    chart: Optional[dict] = None
    sql: Optional[str] = None
    data: Optional[list] = None
    error: Optional[str] = None


@app.post("/api/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    """
    Process natural language query and return answer + chart
    """
    try:
        agent_instance = get_agent()
        if agent_instance is None:
            raise HTTPException(
                status_code=503,
                detail="Agent not initialized. Check API keys and InfluxDB connection."
            )
        
        # Get answer and SQL from agent
        result = agent_instance.query(request.query)
        
        response_data = {
            "answer": result["answer"],
            "sql": result.get("sql"),
            "data": result.get("data"),
        }
        
        # Generate chart if requested
        if request.generate_chart and result.get("data"):
            chart_gen_instance = get_chart_gen()
            chart = chart_gen_instance.generate(
                data=result["data"],
                query=request.query,
                chart_type=request.chart_type or "auto"
            )
            response_data["chart"] = chart
        
        return QueryResponse(**response_data)
    
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}"
        print(f"Error: {error_detail}")
        print(traceback.format_exc())
        return QueryResponse(
            answer="",
            error=error_detail
        )


@app.get("/health")
async def health():
    """Health check endpoint"""
    agent_instance = get_agent()
    status = {
        "status": "healthy",
        "agent_initialized": agent_instance is not None
    }
    
    if agent_instance is None:
        status["warning"] = "Agent not initialized - check API keys and InfluxDB"
    
    return status


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "service": "GEM Romania Intelligent Agent",
        "version": "0.1.0",
        "endpoints": {
            "query": "POST /api/query",
            "health": "GET /health"
        },
        "example": {
            "query": "What was the GDP in the last quarter?",
            "generate_chart": True
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
