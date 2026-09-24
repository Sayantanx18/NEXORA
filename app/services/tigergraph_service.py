import os
import requests


TIGERGRAPH_HOST = os.getenv("TIGERGRAPH_HOST", "").rstrip("/")
TIGERGRAPH_TOKEN = os.getenv("TIGERGRAPH_TOKEN", "")
TIGERGRAPH_GRAPH = os.getenv("TIGERGRAPH_GRAPH", "Transaction_Fraud")


def tigergraph_available():
    return bool(TIGERGRAPH_HOST and TIGERGRAPH_TOKEN)


def get_case_graph(case_id: str):
    if not tigergraph_available():
        return {
            "status": "OFFLINE",
            "message": "TigerGraph credentials are not configured",
            "nodes": [],
            "edges": [],
        }

    url = f"{TIGERGRAPH_HOST}/restpp/graph/{TIGERGRAPH_GRAPH}"

    headers = {
        "Authorization": f"Bearer {TIGERGRAPH_TOKEN}",
        "Content-Type": "application/json",
    }

    # Initial graph query.
    # We will replace this with the final GSQL query
    # after confirming the schema and loaded data.
    params = {
        "v_id": case_id,
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=15,
        )

        if response.status_code >= 400:
            return {
                "status": "ERROR",
                "message": response.text,
                "nodes": [],
                "edges": [],
            }

        return {
            "status": "ONLINE",
            "data": response.json(),
        }

    except requests.RequestException as exc:
        return {
            "status": "ERROR",
            "message": str(exc),
            "nodes": [],
            "edges": [],
        }
