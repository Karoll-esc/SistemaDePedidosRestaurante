import React, { useState, useMemo, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import OrderSidebar from "./components/OrderSidebar";

// 👉 Backend Python que RECIBE el pedido (producer)
const API_URL = "http://localhost:8000/api/v1/orders";

// 👉 Microservicio de cocina (Node + RabbitMQ)
const KITCHEN_HTTP_URL = "http://localhost:3002/kitchen/orders";
const KITCHEN_WS_URL = "ws://localhost:4000";

// Formatear COP
const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(value);

const initialProducts = [
  { id: 1, name: "Hamburguesa",    price: 10500, desc: "Hamburguesa", image: "/images/hamburguesa.jpg" },
  { id: 2, name: "Papas fritas",   price: 12000, desc: "Papas",       image: "/images/papas.jpg" },
  { id: 3, name: "Perro caliente", price: 8000,  desc: "Perro",       image: "/images/perro.jpg" },
  { id: 4, name: "Refresco",       price: 7000,  desc: "Refresco",    image: "/images/refresco.jpg" }
];

export default function App() {
  const [products] = useState(initialProducts);
  const [order, setOrder] = useState({ items: [] });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 👉 pedidos que se muestran en la vista de cocina
  const [pedidos, setPedidos] = useState<any[]>([]);

  const addToOrder = (product: any) => {
    setOrder((prev) => {
      const existing = prev.items.find((it: any) => it.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((it: any) =>
            it.id === product.id ? { ...it, qty: it.qty + 1 } : it
          )
        };
      }
      return { ...prev, items: [...prev.items, { ...product, qty: 1 }] };
    });
  };

  const changeQty = (productId: number, delta: number) => {
    setOrder((prev) => {
      const items = prev.items
        .map((it: any) =>
          it.id === productId ? { ...it, qty: Math.max(0, it.qty + delta) } : it
        )
        .filter((it: any) => it.qty > 0);
      return { ...prev, items };
    });
  };

  // 👉 guardar nota/especificación para un item del pedido
  const addNoteToItem = (productId: number, note: string) => {
    setOrder((prev) => {
      const items = prev.items.map((it: any) =>
        it.id === productId ? { ...it, note: note || undefined } : it
      );
      return { ...prev, items };
    });
  };

  // Total calculado con useMemo
  const total = useMemo(
    () => order.items.reduce((s: number, it: any) => s + it.price * it.qty, 0),
    [order.items]
  );

  // 🔥 ENVÍO REAL AL BACKEND PYTHON (producer)
  const handleSend = async (table: string, clientName: string) => {
    if (order.items.length === 0) return;

    const customerName = clientName?.trim() || "Cliente sin nombre";

    const payload = {
      customerName,
      table,
      items: order.items.map((it: any) => ({
        productName: it.name,
        quantity: it.qty,
        unitPrice: it.price,
        note: it.note || null
      }))
    };

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error("Error al enviar pedido: " + resp.status);
      }

      const data = await resp.json();

      setSuccessMsg(
        `Pedido de ${data.customerName || customerName} enviado a la mesa ${
          data.table || table
        }.`
      );

      // Limpia el carrito
      setOrder({ items: [] });

      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      console.error("Error enviando pedido", err);
      setSuccessMsg("⚠️ No se pudo enviar el pedido. Revisa el backend.");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    }
  };

  // 🧼 programar eliminación de un pedido 10s después de "listo"
  const scheduleRemoval = (orderId: string) => {
    setTimeout(() => {
      setPedidos((current) => current.filter((p) => p.id !== orderId));
    }, 10000); // 10 segundos
  };

  // Cambiar estado SOLO en la UI de cocina
  const cambiarEstado = (id: string, nuevoEstado: string) => {
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      )
    );

    if (nuevoEstado === "listo") {
      scheduleRemoval(id);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "#ff4444";
      case "en-preparacion":
        return "#ffaa00";
      case "listo":
        return "#44cc44";
      default:
        return "#ccc";
    }
  };

  // 🧠 Helper: mapea el JSON del MS de cocina a la estructura de la tarjeta
  const mapOrderToPedido = (order: any) => {
    const productos = (order.items || []).map((item: any) => ({
      nombre: item.productName,
      cantidad: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: (item.quantity || 0) * (item.unitPrice || 0),
      note: item.note || null
    }));

    const totalPedido = productos.reduce(
      (acc: number, p: any) => acc + p.subtotal,
      0
    );

    return {
      id: order.id,
      mesa: order.table, // ej: "Mesa 10"
      cliente: order.customerName,
      productos,
      especificaciones: productos
        .filter((p: any) => p.note)
        .map((p: any) => `${p.nombre}: ${p.note}`),
      total: totalPedido,
      estado: "pendiente"
    };
  };

  // 🔄 Conexión con el MS de cocina (HTTP + WebSocket)
  useEffect(() => {
    // 1) Carga inicial por HTTP
    const fetchPedidos = async () => {
      try {
        const resp = await fetch(KITCHEN_HTTP_URL);
        if (!resp.ok) {
          throw new Error("Error al obtener pedidos de cocina: " + resp.status);
        }
        const data = await resp.json();
        const lista = Array.isArray(data) ? data : [data];
        setPedidos(lista.map(mapOrderToPedido));
      } catch (err) {
        console.error("Error cargando pedidos de cocina", err);
      }
    };

    fetchPedidos();

    // 2) Suscripción en tiempo real por WebSocket
    let ws: WebSocket | undefined;
    try {
      ws = new WebSocket(KITCHEN_WS_URL);

      ws.onopen = () => {
        console.log("✅ Conectado al WebSocket de cocina");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Mensaje WS cocina:", msg);

          if (msg.type === "ORDER_NEW" && msg.order) {
            const pedido = mapOrderToPedido(msg.order);
            setPedidos((prev) => {
              const exists = prev.some((p) => p.id === pedido.id);
              if (exists) {
                return prev.map((p) => (p.id === pedido.id ? pedido : p));
              }
              return [...prev, pedido];
            });
          }

          if (msg.type === "ORDER_READY" && msg.id) {
            setPedidos((prev) =>
              prev.map((p) =>
                p.id === msg.id ? { ...p, estado: "listo" } : p
              )
            );
            scheduleRemoval(msg.id);
          }

          if (msg.type === "QUEUE_EMPTY") {
            // Si tu MS manda esto cuando ya no hay nada en cola
            // dejamos que los pedidos se vayan borrando por scheduleRemoval
            console.log("Cola de cocina vacía (QUEUE_EMPTY)");
          }
        } catch (err) {
          console.error("Error procesando mensaje WS cocina", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Error en WebSocket de cocina", err);
      };
    } catch (err) {
      console.error("No se pudo conectar al WebSocket de cocina", err);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <>
      {/* Vista tablet / mesero */}
      <div className="page">
        <div className="tablet">
          <header className="tablet-header">
            <div className="brand">
              <div className="logo">🍔</div>
              <div>
                <div className="title">RÁPIDO</div>
                <div className="subtitle">Y SABROSO</div>
              </div>
            </div>
            <div className="menu">MENÚ</div>
          </header>

          <div className="tablet-body">
            <OrderSidebar
              order={order}
              onChangeQty={changeQty}
              total={total}
              onSend={handleSend}
              onAddNote={addNoteToItem}
            />

            <main className="product-area">
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={() => addToOrder(p)}
                  />
                ))}
              </div>
            </main>
          </div>

          {/* toast de éxito */}
          {successMsg && <div className="toast">{successMsg}</div>}
        </div>
      </div>

      {/* Vista cocina: solo se muestra si hay pedidos */}
      {pedidos.length > 0 && (
        <div className="kitchen-container">
          {/* Header */}
          <header className="kitchen-header">
            <div className="logo-section">
              <div className="logo-icon">🌭</div>
              <div className="logo-text">
                <div className="logo-title">RÁPIDO</div>
                <div className="logo-subtitle">Y SABROSO</div>
              </div>
            </div>
            <div className="header-actions">
              <button className="icon-btn">📋</button>
              <button className="icon-btn">➕</button>
            </div>
          </header>

          {/* Grid de pedidos */}
          <div className="pedidos-grid">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="pedido-card">
                {/* Encabezado del pedido */}
                <div className="pedido-header">
                  <h2 className="pedido-numero">Pedido #{pedido.id}</h2>
                  <div
                    className="estado-indicator"
                    style={{
                      backgroundColor: obtenerColorEstado(pedido.estado)
                    }}
                  />
                </div>

                {/* Mesa + cliente */}
                <div className="mesa-info">
                  <span className="mesa-badge">{pedido.mesa}</span>
                  <span className="mesa-label">
                    {pedido.mesa}
                    {pedido.cliente ? ` • ${pedido.cliente}` : ""}
                  </span>
                </div>

                {/* Contenido principal */}
                <div className="pedido-content">
                  {/* Productos */}
                  <div className="productos-section">
                    <h3 className="section-title">Productos</h3>
                    <div className="productos-list">
                      {pedido.productos.map((producto: any, idx: number) => (
                        <div key={idx} className="producto-item">
                          <span>
                            {producto.cantidad}x {producto.nombre}
                          </span>
                          <span className="producto-precio">
                            {formatCOP(producto.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Especificaciones */}
                  <div className="especificaciones-section">
                    <h3 className="section-title">Especificaciones</h3>
                    <div className="especificaciones-list">
                      {pedido.especificaciones &&
                      pedido.especificaciones.length > 0 ? (
                        pedido.especificaciones.map(
                          (esp: string, idx: number) => (
                            <div key={idx} className="especificacion-item">
                              - {esp}
                            </div>
                          )
                        )
                      ) : (
                        <div className="especificacion-item">
                          - Sin especificaciones -
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total + Botones de acción */}
                <div className="pedido-total">
                  Total: {formatCOP(pedido.total)}
                </div>

                <div className="pedido-actions">
                  {pedido.estado === "pendiente" && (
                    <button
                      className="btn-action btn-preparar"
                      onClick={() =>
                        cambiarEstado(pedido.id as string, "en-preparacion")
                      }
                    >
                      Iniciar Preparación
                    </button>
                  )}
                  {pedido.estado === "en-preparacion" && (
                    <button
                      className="btn-action btn-listo"
                      onClick={() =>
                        cambiarEstado(pedido.id as string, "listo")
                      }
                    >
                      Marcar como Listo
                    </button>
                  )}
                  {pedido.estado === "listo" && (
                    <div className="estado-listo">
                      ✓ Pedido Listo para Entregar
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
