# Refactorización Microservicio de Pedidos (Python)

## Cambios realizados

- Refactorización completa del microservicio aplicando principios SOLID y Clean Code.
- Implementación del patrón Repository para desacoplar la lógica de negocio de la persistencia de datos.
- Separación clara entre controladores, servicios, modelos y repositorios.
- Nuevos endpoints RESTful para obtener y editar órdenes por ID.
- Restricción de edición de órdenes únicamente si su estado no es "preparando".
- Modelos Pydantic actualizados con validación de estado (`status`).
- Pruebas unitarias que cubren reglas de negocio principales.
- Documentación y ejemplos de payloads actualizados.

## Cambios principales

- Aplicación de principios SOLID y Clean Code en servicios y controladores.
- Implementación del patrón Repository para desacoplar la lógica de negocio de la persistencia.
- Soporte para edición de órdenes solo si su estado no es "preparando".
- Nuevos endpoints:
  - `PUT /api/v1/orders/{order_id}`: Editar orden (solo si no está en preparación).
  - `GET /api/v1/orders/{order_id}`: Obtener orden por ID.
- Modelos Pydantic actualizados con campo `status`.
- Pruebas unitarias para creación y edición de órdenes, incluyendo reglas de negocio.

## Estructura

- `repositories/order_repository.py`: Interfaz abstracta y repositorio MongoDB (MongoOrderRepository). El repositorio en memoria solo existe como mock en los tests.
- `services/order_service.py`: Lógica de negocio desacoplada.
- `controllers/order_controller.py`: Endpoints RESTful.
- `models/order.py`: Modelos con validación y estado.
- `tests/test_order_service.py`: Pruebas unitarias de la lógica de negocio.

## Requisitos previos

- Python 3.8+
- Instalar dependencias:
  ```bash
  pip install -r requirements.txt
  ```
- Instalar pytest si no está instalado:
  ```bash
  pip install pytest
  ```

## Ejecución de pruebas

```bash
pytest test/test_order_service.py
# o
py -m pytest test/test_order_service.py
# o
py -m pytest
# o para correr todos los tests (incluyendo integración y API):
pytest
```

## Ejemplo de payload para endpoints

### Crear/Editar Orden (`POST`/`PUT /api/v1/orders/{order_id}`)

```json
{
  "customerName": "Juan Pérez",
  "table": "Mesa 1",
  "items": [
    {"productName": "Hamburguesa", "quantity": 2, "unitPrice": 10000},
    {"productName": "Refresco", "quantity": 1, "unitPrice": 3000}
  ]
}
```

## Notas sobre la implementación

- El controlador (`order_controller.py`) ahora utiliza únicamente `MongoOrderRepository` para persistencia real en MongoDB.
- El repositorio en memoria (`InMemoryOrderRepository`) solo existe como clase auxiliar dentro de los tests unitarios, no en el código de producción.
- Si necesitas cambiar la base de datos, ajusta la instancia de `MongoOrderRepository` en el controlador.

