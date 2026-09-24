import os
import requests
import pyTigerGraph as tg


TIGERGRAPH_HOST = os.getenv("TIGERGRAPH_HOST", "").rstrip("/")
TIGERGRAPH_SECRET = os.getenv("TIGERGRAPH_SECRET", "")
TIGERGRAPH_GRAPH = os.getenv(
    "TIGERGRAPH_GRAPH",
    "HHGOA_FraudInvestigation_V2",
)


def tigergraph_available():
    return bool(
        TIGERGRAPH_HOST
        and TIGERGRAPH_SECRET
        and TIGERGRAPH_GRAPH
    )


def _connection():
    return tg.TigerGraphConnection(
        host=TIGERGRAPH_HOST,
        graphname=TIGERGRAPH_GRAPH,
        gsqlSecret=TIGERGRAPH_SECRET,
    )


def _get_token(conn):
    result = conn.getToken(
        TIGERGRAPH_SECRET,
        lifetime=1000000,
    )
    return result[0]


def _get_vertex(token, vertex_type, vertex_id):
    url = (
        f"{TIGERGRAPH_HOST}"
        f"/restpp/graph/{TIGERGRAPH_GRAPH}"
        f"/vertices/{vertex_type}/{vertex_id}"
    )

    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("results"):
        return None

    return data["results"][0]


def get_case_graph(transaction_id: str):
    """
    Retrieve the investigation graph directly from TigerGraph.

    Current verified path:
        Transaction -> SENT_BY -> Account -> OWNS -> Customer

    Direct REST/edge retrieval is used instead of the installed
    GetInvestigationGraph query because that query currently exceeds
    the TigerGraph 60-second query timeout.
    """

    if not tigergraph_available():
        return {
            "status": "OFFLINE",
            "message": "TigerGraph credentials are not configured",
            "nodes": [],
            "edges": [],
        }

    try:
        conn = _connection()
        token = _get_token(conn)

        nodes = []
        edges = []

        # Transaction vertex
        transaction = _get_vertex(
            token,
            "Transaction",
            str(transaction_id),
        )

        if not transaction:
            return {
                "status": "ERROR",
                "message": f"Transaction {transaction_id} was not found",
                "nodes": [],
                "edges": [],
            }

        nodes.append(transaction)

        # Transaction -> Account
        account_edges = conn.getEdges(
            sourceVertexType="Transaction",
            sourceVertexId=str(transaction_id),
            edgeType="SENT_BY",
        )

        for edge in account_edges:
            account_id = edge["to_id"]

            account = _get_vertex(
                token,
                "Account",
                account_id,
            )

            if account:
                nodes.append(account)

            edges.append(edge)

            # Account -> Customer
            customer_edges = conn.getEdges(
                sourceVertexType="Account",
                sourceVertexId=account_id,
                edgeType="OWNS",
            )

            for customer_edge in customer_edges:
                customer_id = customer_edge["to_id"]

                customer = _get_vertex(
                    token,
                    "Customer",
                    customer_id,
                )

                if customer:
                    nodes.append(customer)

                edges.append(customer_edge)

        # Remove duplicate vertices
        unique_nodes = []
        seen_nodes = set()

        for node in nodes:
            key = (
                node.get("v_type"),
                node.get("v_id"),
            )

            if key not in seen_nodes:
                seen_nodes.add(key)
                unique_nodes.append(node)

        return {
            "status": "ONLINE",
            "nodes": unique_nodes,
            "edges": edges,
        }

    except Exception as exc:
        return {
            "status": "ERROR",
            "message": str(exc),
            "nodes": [],
            "edges": [],
        }
