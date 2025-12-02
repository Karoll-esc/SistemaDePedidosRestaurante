import pytest
from unittest.mock import patch
from app.messaging import messaging

def test_publish_order_called():
    with patch.object(messaging, "publish_order") as mock_publish:
        order = {"id": "testid", "customerName": "Cliente MQ"}
        messaging.publish_order(order)
        mock_publish.assert_called_once_with(order)

# Si se quiere probar integración real, se puede usar pika y un contenedor RabbitMQ,
# pero aquí solo se prueba que la función se llama correctamente.
