// src/infrastructure/http/controllers/kitchen.controller.ts
import { Request, Response, NextFunction } from "express";
import { OrderRepository } from "../../../domain/interfaces/order.interface";
import { KitchenOrder } from "../../../domain/models/order";

// Repository debe ser inyectado desde index.ts (siempre MongoOrderRepository)
let repo: OrderRepository | null = null;

export function setOrderRepository(r: OrderRepository) {
  repo = r;
}

export async function getKitchenOrders(req: Request, res: Response, next: NextFunction) {
  try {
    if (!repo) {
      return res.status(500).json({ error: "Repository no inicializado" });
    }
    const payload = await repo.getAll();
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

// helpers used by worker or other internal modules — async and non-blocking
export async function addKitchenOrder(order: KitchenOrder): Promise<void> {
  if (!repo) {
    throw new Error("Repository no inicializado");
  }
  order.status = "preparing";
  await repo.create(order);
}

export async function markOrderReady(id: string): Promise<boolean> {
  if (!repo) {
    throw new Error("Repository no inicializado");
  }
  return repo.updateStatus(id, "ready");
}

export async function removeOrderFromKitchen(id: string): Promise<void> {
  if (!repo) {
    throw new Error("Repository no inicializado");
  }
  await repo.remove(id);
}