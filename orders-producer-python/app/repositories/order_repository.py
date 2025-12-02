# Implementación de repositorio usando MongoDB para persistencia de órdenes.
# MongoOrderRepository permite almacenar, obtener, actualizar y listar órdenes en una colección MongoDB.
# Se utiliza el modelo OrderMessage para la serialización/deserialización de los documentos.

from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.order import OrderMessage
from pymongo.collection import Collection
from bson.objectid import ObjectId

class OrderRepository(ABC):
    @abstractmethod
    def add(self, order: OrderMessage) -> None:
        pass

    @abstractmethod
    def get(self, order_id: str) -> Optional[OrderMessage]:
        pass

    @abstractmethod
    def update(self, order_id: str, order: OrderMessage) -> None:
        pass

    @abstractmethod
    def list(self) -> List[OrderMessage]:
        pass

class MongoOrderRepository(OrderRepository):
    def __init__(self, collection: Collection):
        self.collection = collection

    def add(self, order: OrderMessage) -> None:
        self.collection.insert_one(order.dict())

    def get(self, order_id: str) -> Optional[OrderMessage]:
        data = self.collection.find_one({"_id": ObjectId(order_id)})
        if data:
            # Convertir _id a id (string)
            data["id"] = str(data.pop("_id"))
            return OrderMessage(**data)
        return None

    def update(self, order_id: str, order: OrderMessage) -> None:
        result = self.collection.update_one({"_id": ObjectId(order_id)}, {"$set": order.dict()})
        if result.matched_count == 0:
            raise KeyError(f"Order {order_id} not found")

    def list(self) -> List[OrderMessage]:
        orders = []
        for doc in self.collection.find():
            doc["id"] = str(doc.pop("_id"))
            orders.append(OrderMessage(**doc))
        return orders

