// src/worker.ts
import { notifyClients } from "./wsServer";
import { OrderMessage } from "./models/order";
import { getChannel } from "./amqp";
import {
  addKitchenOrder,
  markOrderReady,
  removeOrderFromKitchen
} from "./controllers/kitchen.controller";

// tiempos base por producto "normalizado"
const tiempos: Record<string, number> = {
  hamburguesa: 10,
  "papas fritas": 4,
  "perro caliente": 6,
  refresco: 2,
};

// normalizar nombre del producto
function normalizarProducto(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("hamburguesa")) return "hamburguesa";
  if (n.includes("papa")) return "papas fritas";
  if (n.includes("perro")) return "perro caliente";
  if (n.includes("refresc") || n.includes("limonada")) return "refresco";
  return n;
}

export async function startWorker() {
  try {
    const channel = await getChannel();
    const queue = "orders.new";

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    console.log("📥 Worker de cocina escuchando pedidos...");

    channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const pedido: OrderMessage = JSON.parse(msg.content.toString());
          console.log("🍽️ Pedido recibido en cocina:", pedido);

          // agregar pedido a la lista de cocina
          addKitchenOrder({ ...pedido, status: "preparing" });

          // notificar al frontend que hay un pedido nuevo
          notifyClients({ type: "ORDER_NEW", order: pedido });

          // calcular el tiempo total de preparación
          let totalSegundos = 0;
          for (const item of pedido.items) {
            const normalized = normalizarProducto(item.productName);
            const tiempo = tiempos[normalized] || 0;
            totalSegundos += tiempo * item.quantity;
          }

          console.log(`⏱️ Tiempo estimado: ${totalSegundos}s`);
          console.log("👨‍🍳 Preparando pedido...");

          await new Promise((r) => setTimeout(r, totalSegundos * 1000));

          // marcar pedido como listo
          markOrderReady(pedido.id);

          console.log(`✅ Pedido listo → id: ${pedido.id} | mesa: ${pedido.table}`);

          // notificar al frontend que terminó
          notifyClients({
            type: "ORDER_READY",
            id: pedido.id,
            table: pedido.table,
            finishedAt: new Date().toISOString(),
          });

             // 🔥 eliminar de la cocina
          removeOrderFromKitchen(pedido.id);

          channel.ack(msg);

          // verificar si quedan pedidos en la cola
          const q = await channel.checkQueue(queue);
          if (q.messageCount === 0) {
            notifyClients({
              type: "QUEUE_EMPTY",
              message: "🕒 Esperando nuevos pedidos..."
            });
            console.log("🕒 Esperando nuevos pedidos...");
          }

        } catch (err) {
          console.error("⚠️ Error procesando mensaje:", err);
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error("❌ Error en el worker:", err);
  }
}
