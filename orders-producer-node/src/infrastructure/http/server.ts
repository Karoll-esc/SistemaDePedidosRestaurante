import express from "express";
import cors from "cors";
import { getKitchenOrders, setOrderRepository } from "./controllers/kitchen.controller";
import { getProducts, getAllProducts, getProductById } from "./controllers/product.controller";
import { correlationIdMiddleware } from "./middlewares/correlation-id.middleware";
import { startWorker } from "../messaging/worker";
import MongoSingleton from "../database/mongo";
import { MongoOrderRepository } from "../database/repositories/mongo.order.repository";

const app = express();
app.use(cors());
app.use(express.json());

// attach or propagate correlation id for tracing
app.use(correlationIdMiddleware);

app.get("/kitchen/orders", getKitchenOrders);

// Product routes
app.get("/api/products", getProducts);
app.get("/api/products/all", getAllProducts);
app.get("/api/products/:id", getProductById);

const PORT = Number(process.env.PORT || 3002);

export async function startServer() {
  try {
    await MongoSingleton.connect();
    setOrderRepository(new MongoOrderRepository());
    console.log("✅ OrderRepository configurado con MongoDB");
  } catch (err) {
    console.error("❌ MongoDB initialization failed:", err);
    console.error("❌ El sistema requiere MongoDB para funcionar. Verifica la conexión.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🔥 Cocina escuchando en puerto ${PORT}`);
  });

  startWorker();
}

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("[HTTP ERROR]", err && err.stack ? err.stack : err);
  res.status(err?.status || 500).json({ error: "internal_server_error" });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
