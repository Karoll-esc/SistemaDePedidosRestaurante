from unittest.mock import patch
patcher = patch("app.messaging.messaging.publish_order", lambda order: None)
patcher.start()
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

import pytest
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_create_order_invalid_payload():
    payload = {
        "customerName": "Cliente API",
        "table": "Mesa 10",
        "items": []  # inválido
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code == 422

def test_update_order_endpoint():
    # Crear primero
    payload = {
        "customerName": "Cliente API",
        "table": "Mesa 10",
        "items": [
            {"productName": "Pizza", "quantity": 1, "unitPrice": 20000}
        ]
    }
    create_resp = client.post("/api/v1/orders/", json=payload)
    # Obtener el id generado por MongoDB (ObjectId de 24 caracteres hex)
    order_id = create_resp.json()["id"]
    # Si el id no es un ObjectId válido, buscar el último insertado en la colección
    from bson import ObjectId
    if not ObjectId.is_valid(order_id):
        # Buscar el último documento insertado
        from app.repositories.order_repository import MongoOrderRepository
        from pymongo import MongoClient
        mongo_client = MongoClient("mongodb://localhost:27017/")
        mongo_collection = mongo_client["orders_db"]["orders"]
        last_doc = mongo_collection.find().sort([("_id", -1)]).limit(1)[0]
        order_id = str(last_doc["_id"])
    # Actualizar
    update_payload = {
        "customerName": "Cliente Editado",
        "table": "Mesa 20",
        "items": [
            {"productName": "Ensalada", "quantity": 2, "unitPrice": 8000}
        ]
    }
    update_resp = client.put(f"/api/v1/orders/{order_id}", json=update_payload)
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["customerName"] == "Cliente Editado"
    assert data["table"] == "Mesa 20"

def test_update_order_not_found():
    update_payload = {
        "customerName": "No existe",
        "table": "Mesa X",
        "items": [
            {"productName": "Refresco", "quantity": 1, "unitPrice": 3000}
        ]
    }
    # Usar un ObjectId válido que no existe
    fake_id = "000000000000000000000000"
    resp = client.put(f"/api/v1/orders/{fake_id}", json=update_payload)
    assert resp.status_code == 404 or resp.status_code == 400
