import { useState } from 'react';
import { KitchenHeader } from '../components/KitchenHeader';
import { KitchenTabs, type TabType } from '../components/KitchenTabs';
import { KitchenOrderCard, type OrderStatus } from '../components/KitchenOrderCard';
// import { useKitchenWebSocket } from '../hooks/useKitchenWebSocket';

// TODO: Replace this mock data with real data from backend
// Use the useKitchenWebSocket hook or create a new hook to fetch orders
const mockOrders = [
  {
    id: '#044',
    customerName: 'Robert Fox',
    phone: '+1 9876543210',
    time: '11:30 AM',
    table: 'Table 03',
    products: [
      { name: 'Cheese Burger', quantity: 1, price: 12000 },
      { name: 'Lemonade', quantity: 1, price: 4000 },
    ],
    total: 16000,
    status: 'New Order' as OrderStatus,
  },
  {
    id: '#043',
    customerName: 'Jenny Wilson',
    phone: '+1 9876543210',
    time: '11:25 AM',
    table: 'Table 05',
    products: [
      { name: 'Cheese Burger', quantity: 1, price: 12000 },
      { name: 'Salad with Sesame', quantity: 1, price: 16000 },
    ],
    total: 48200,
    status: 'Cooking' as OrderStatus,
  },
  {
    id: '#042',
    customerName: 'Cameron William',
    phone: '+1 9876543210',
    time: '11:10 AM',
    table: 'Takeaway',
    products: [
      { name: 'Supreme Grill', quantity: 1, price: 14000 },
      { name: 'Sparkling Water', quantity: 1, price: 4000 },
    ],
    total: 14000,
    status: 'Ready' as OrderStatus,
  },
  {
    id: '#041',
    customerName: 'Olivia Hart',
    phone: '+1 9876543210',
    time: '11:09 AM',
    table: 'Table 06',
    products: [
      { name: 'Salad with Sesame', quantity: 2, price: 16000 },
      { name: 'Noodles with Chicken', quantity: 1, price: 12000 },
    ],
    total: 32000,
    status: 'Cooking' as OrderStatus,
  },
  {
    id: '#040',
    customerName: 'Ethan Reyes',
    phone: '+1 9876543210',
    time: '11:04 AM',
    table: 'Table 01',
    products: [
      { name: 'Fried Rice', quantity: 1, price: 10000 },
      { name: 'French Fries', quantity: 1, price: 6000 },
    ],
    total: 21000,
    status: 'Ready' as OrderStatus,
  },
  {
    id: '#039',
    customerName: 'Mia Sullivan',
    phone: '+1 9876543210',
    time: '11:52 AM',
    table: 'Takeaway',
    products: [
      { name: 'Chicken Fried Rice', quantity: 1, price: 12000 },
      { name: 'Mineral Water', quantity: 1, price: 2000 },
    ],
    total: 14000,
    status: 'Completed' as OrderStatus,
  },
  {
    id: '#038',
    customerName: 'Liam Parker',
    phone: '+1 9876543210',
    time: '10:50 AM',
    table: 'Table 07',
    products: [
      { name: 'Chicken Fried Rice', quantity: 1, price: 10000 },
      { name: 'Lemonade', quantity: 1, price: 4000 },
    ],
    total: 45000,
    status: 'Ready' as OrderStatus,
  },
  {
    id: '#037',
    customerName: 'Emily Johnson',
    phone: '+1 9876543210',
    time: '10:45 AM',
    table: 'Table 04',
    products: [
      { name: 'Noodles with Chicken', quantity: 1, price: 13000 },
      { name: 'Sparkling Water', quantity: 1, price: 4000 },
    ],
    total: 17000,
    status: 'Completed' as OrderStatus,
  },
];

export function KitchenPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  // TODO: Replace with real orders from backend
  const [orders] = useState(mockOrders);

  // Calculate counts for each tab
  const tabCounts: Record<TabType, number> = {
    All: orders.length,
    New: orders.filter(o => o.status === 'New Order').length,
    Cooking: orders.filter(o => o.status === 'Cooking').length,
    Ready: orders.filter(o => o.status === 'Ready').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'All' 
    ? orders 
    : orders.filter(order => order.status === activeTab || (activeTab === 'New' && order.status === 'New Order'));

  // TODO: Connect these handlers to backend API/WebSocket
  const handleStartCooking = (orderId: string) => {
    console.log('Start cooking order:', orderId);
    // TODO: Call backend API to update order status to 'Cooking'
    // Example: await updateOrderStatus(orderId, 'Cooking');
  };

  const handleMarkAsReady = (orderId: string) => {
    console.log('Mark as ready order:', orderId);
    // TODO: Call backend API to update order status to 'Ready'
    // Example: await updateOrderStatus(orderId, 'Ready');
  };

  const handleComplete = (orderId: string) => {
    console.log('Complete order:', orderId);
    // TODO: Call backend API to update order status to 'Completed'
    // Example: await updateOrderStatus(orderId, 'Completed');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <KitchenHeader />
      
      <div className="mb-6">
        <h2 className="max-w-[1600px] mx-auto px-6 pt-6 pb-3 text-lg font-semibold text-gray-900">
          Order List
        </h2>
        <KitchenTabs 
          activeTab={activeTab} 
          counts={tabCounts} 
          onTabChange={setActiveTab} 
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onStartCooking={handleStartCooking}
              onMarkAsReady={handleMarkAsReady}
              onComplete={handleComplete}
            />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No orders found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
