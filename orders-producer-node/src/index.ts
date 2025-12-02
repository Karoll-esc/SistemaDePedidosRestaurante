import express from "express";
import cors from "cors";
import { getKitchenOrders } from "./controllers/kitchen.controller";
import { startWorker } from "./worker";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/kitchen/orders", getKitchenOrders);

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`🔥 Cocina escuchando en puerto ${PORT}`);
});

startWorker();
