from dotenv import load_dotenv

load_dotenv()


from app.api.cases import router as cases_router
from app.api.investigation import router as investigation_router
from app.api.transactions import router as transactions_router
from app.api.websocket import router as websocket_router
from app.services.dashboard_service import get_dashboard_stats
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FraudGraph AI API",
    description="Agentic Fraud Investigation & Next-Best Action Backend",
    version="1.0.0",
)

# Allow the FraudGraph AI frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3006",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
         "http://localhost:3005",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cases_router)
app.include_router(investigation_router)
app.include_router(transactions_router)
app.include_router(websocket_router)

@app.get("/")
def root():
    return {
        "message": "FraudGraph AI API is running"
    }


@app.get("/health")
def health():
    return {
        "overall": "DEGRADED",
        "backend": {
            "status": "ONLINE",
            "lastChecked": "now",
            "message": "FastAPI backend is running"
        },
        "tigergraph": {
            "status": "OFFLINE",
            "lastChecked": "now",
            "message": "TigerGraph not connected yet"
        },
        "agent": {
            "status": "OFFLINE",
            "lastChecked": "now",
            "message": "Agent service not connected yet"
        },
        "graphrag": {
            "status": "OFFLINE",
            "lastChecked": "now",
            "message": "GraphRAG not connected yet"
        },
        "websocket": {
            "status": "OFFLINE",
            "lastChecked": "now",
            "message": "WebSocket not implemented yet"
        }
    }


@app.get("/api/v1/dashboard")
def dashboard():
    return get_dashboard_stats()
