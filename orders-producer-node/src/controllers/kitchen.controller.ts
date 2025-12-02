// src/controllers/kitchen.controller.ts
import { Request, Response } from "express";

export interface KitchenOrder {
  id: string;
  customerName: string;
  table: string;
  items: any[];
  createdAt: string;
  status: "preparing" | "ready";
}

let pedidosEnCocina: KitchenOrder[] = [];

export function getKitchenOrders(req: Request, res: Response) {
  res.json(pedidosEnCocina);
}

// agregar pedido al array y notificar
export function addKitchenOrder(order: KitchenOrder) {
  order.status = "preparing";
  pedidosEnCocina.push(order);
}
  
// marcar pedido como listo
export function markOrderReady(id: string) {
  const pedido = pedidosEnCocina.find(o => o.id === id);
  if (pedido) pedido.status = "ready";
}

export function removeOrderFromKitchen(id: string) {
  pedidosEnCocina = pedidosEnCocina.filter((p) => p.id !== id);
}