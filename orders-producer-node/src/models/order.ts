export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderMessage {
  id: string;
  customerName: string;
  table: string;       
  items: OrderItem[];
  createdAt: string; 
}
