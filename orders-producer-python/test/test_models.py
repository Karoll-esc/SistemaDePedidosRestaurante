import pytest
from app.models.order import OrderIn, OrderItem
from pydantic import ValidationError

def test_order_item_quantity_negative():
    with pytest.raises(ValidationError):
        OrderItem(productName="Test", quantity=-1, unitPrice=1000)

def test_order_item_unit_price_negative():
    with pytest.raises(ValidationError):
        OrderItem(productName="Test", quantity=1, unitPrice=-1000)

def test_order_in_items_empty():
    with pytest.raises(ValidationError):
        OrderIn(customerName="Test", table="Mesa 1", items=[])

def test_order_in_valid():
    item = OrderItem(productName="Test", quantity=1, unitPrice=1000)
    order = OrderIn(customerName="Test", table="Mesa 1", items=[item])
    assert order.customerName == "Test"
    assert order.items[0].productName == "Test"
