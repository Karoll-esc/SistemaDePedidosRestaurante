import pytest
from app.models.order import OrderMessage
from app.repositories.order_repository import MongoOrderRepository
from pymongo import MongoClient
import os

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/")
DB_NAME = "test_orders_db"
COLLECTION_NAME = "orders"

@pytest.fixture(scope="module")
def mongo_collection():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    collection.delete_many({})  # Limpiar antes de test
    yield collection
    collection.delete_many({})  # Limpiar después de test
    client.close()


def test_mongo_add_and_get(mongo_collection):
    repo = MongoOrderRepository(mongo_collection)
    # Crear orden sin id, dejar que MongoDB lo genere
    order = OrderMessage(
        id="",
        customerName="Cliente Mongo",
        table="Mesa 5",
        items=[{"productName": "Producto Test", "quantity": 1, "unitPrice": 1000}],
        createdAt="2025-12-02T00:00:00",
        status="pendiente"
    )
    # Insertar y obtener el _id generado
    result = mongo_collection.insert_one(order.model_dump(exclude={"id"}))
    object_id = str(result.inserted_id)
    fetched = repo.get(object_id)
    assert fetched is not None
    assert fetched.customerName == "Cliente Mongo"

def test_mongo_update(mongo_collection):
    repo = MongoOrderRepository(mongo_collection)
    order = OrderMessage(
        id="",
        customerName="Cliente Mongo",
        table="Mesa 5",
        items=[{"productName": "Producto Test", "quantity": 1, "unitPrice": 1000}],
        createdAt="2025-12-02T00:00:00",
        status="pendiente"
    )
    result = mongo_collection.insert_one(order.model_dump(exclude={"id"}))
    object_id = str(result.inserted_id)
    # Actualizar
    order.customerName = "Editado"
    repo.update(object_id, order)
    updated = repo.get(object_id)
    assert updated.customerName == "Editado"

def test_mongo_list(mongo_collection):
    repo = MongoOrderRepository(mongo_collection)
    orders = repo.list()
    assert isinstance(orders, list)
