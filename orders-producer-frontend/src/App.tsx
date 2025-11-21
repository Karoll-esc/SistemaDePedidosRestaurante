import React, { useState, useMemo } from "react";
import ProductCard from "./components/ProductCard";
import OrderSidebar from "./components/OrderSidebar";

// 👉 URL de tu backend
const API_URL = "http://localhost:8000/api/v1/orders/";

const initialProducts = [
  // OJO: en JS 5.500 es 5.5, por eso los dejo como enteros en pesos
  { id: 1, name: "Hamburguesa",    price: 10500, desc: "Hamburguesa", image: "/images/hamburguesa.jpg" },
  { id: 2, name: "Papas fritas",   price: 12000, desc: "Papas",       image: "/images/papas.jpg" },
  { id: 3, name: "Perro caliente", price: 8000,  desc: "Perro",       image: "/images/perro.jpg" },
  { id: 4, name: "Refresco",       price: 7000,  desc: "Refresco",    image: "/images/refresco.jpg" }
];

export default function App() {
  const [products] = useState(initialProducts);
  const [order, setOrder] = useState({ items: [] });
  const [successMsg, setSuccessMsg] = useState(null);

  // Estado para simular pedidos entrantes en la cocina
  const [pedidos, setPedidos] = useState([
    {
      id: 37,
      mesa: 1,
      productos: [
        { nombre: "Cheeseburger", cantidad: 1 },
        { nombre: "Tonabac Pickles", cantidad: 1, emoji: "🔴🔴" },
        { nombre: "Large Fries", cantidad: 1 },
        { nombre: "Coke", cantidad: 1 }
      ],
      especificaciones: ["No Onion", "Extra Ketchup"],
      estado: "pendiente" // pendiente, en-preparacion, listo
    }
  ]);

  const addToOrder = (product) => {
    setOrder((prev) => {
      const existing = prev.items.find((it) => it.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.id === product.id ? { ...it, qty: it.qty + 1 } : it
          )
        };
      }
      return { ...prev, items: [...prev.items, { ...product, qty: 1 }] };
    });
  };

  const changeQty = (productId, delta) => {
    setOrder((prev) => {
      const items = prev.items
        .map((it) =>
          it.id === productId ? { ...it, qty: Math.max(0, it.qty + delta) } : it
        )
        .filter((it) => it.qty > 0);
      return { ...prev, items };
    });
  };

  // 👉 guardar nota/especificación para un item del pedido
  const addNoteToItem = (productId, note) => {
    setOrder((prev) => {
      const items = prev.items.map((it) =>
        it.id === productId ? { ...it, note: note || undefined } : it
      );
      return { ...prev, items };
    });
  };

  // Total calculado con useMemo (evita recalcular si no cambian los items)
  const total = useMemo(
    () => order.items.reduce((s, it) => s + it.price * it.qty, 0),
    [order.items]
  );

  // 🔥 ENVÍO REAL AL BACKEND
  const handleSend = async (table, clientName) => {
    if (order.items.length === 0) return;

    const customerName = clientName?.trim() || "Cliente sin nombre";

    const payload = {
      customerName,
      table,
      items: order.items.map((it) => ({
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
      // data tiene: customerName, table, items, id, createdAt

      // ✅ Mensaje usando el nombre del cliente, no el ID
      setSuccessMsg(
        `Pedido de ${data.customerName || customerName} enviado a la mesa ${data.table || table}.`
      );

      // Limpia el carrito
      setOrder({ items: [] });

      // Si quieres limpiar los inputs de mesa/cliente, hazlo en OrderSidebar
      // cuando onSend() devuelva OK o simplemente después de llamarlo.

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

  const cambiarEstado = (id, nuevoEstado) => {
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      )
    );
  };

  const obtenerColorEstado = (estado) => {
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
              // 👇 ahora le pasa (table, clientName) y eso llega a handleSend
              onSend={handleSend}
              // pasar el nuevo handler para especificaciones
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

      {/* Vista cocina */}
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
                  style={{ backgroundColor: obtenerColorEstado(pedido.estado) }}
                />
              </div>

              {/* Mesa */}
              <div className="mesa-info">
                <span className="mesa-badge">Mesa {pedido.mesa}</span>
                <span className="mesa-label">Mesa {pedido.mesa}</span>
              </div>

              {/* Contenido principal */}
              <div className="pedido-content">
                {/* Productos */}
                <div className="productos-section">
                  <h3 className="section-title">Productos</h3>
                  <div className="productos-list">
                    {pedido.productos.map((producto, idx) => (
                      <div key={idx} className="producto-item">
                        {producto.cantidad}x {producto.nombre}
                        {producto.emoji && (
                          <span className="producto-emoji">
                            {" "}
                            {producto.emoji}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Especificaciones */}
                <div className="especificaciones-section">
                  <h3 className="section-title">Especificaciones</h3>
                  <div className="especificaciones-list">
                    {pedido.especificaciones.map((esp, idx) => (
                      <div key={idx} className="especificacion-item">
                        - {esp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pedido-actions">
                {pedido.estado === "pendiente" && (
                  <button
                    className="btn-action btn-preparar"
                    onClick={() => cambiarEstado(pedido.id, "en-preparacion")}
                  >
                    Iniciar Preparación
                  </button>
                )}
                {pedido.estado === "en-preparacion" && (
                  <button
                    className="btn-action btn-listo"
                    onClick={() => cambiarEstado(pedido.id, "listo")}
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
    </>
  );
}