// app/dashboard/buy/order/[id]/page.tsx

import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  MessageSquare, 
  Book, 
  Store, 
  Star, 
  Flag 
} from 'lucide-react';

export const metadata = {
  title: 'Order Details | Dashboard',
  description: 'View details of your magical item purchase',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Get the session server-side
  const {id} =  await params

  // In a real implementation, we'd fetch the order details from the database
  // For now, we'll use hardcoded data for the specific order ID
  const orderId =  id;
  
  // Mock order data
  const order = {
    id: orderId,
    date: '2025-03-10T10:30:00Z',
    item: {
      name: 'Crystal Ball of Clarity',
      description: 'A finely crafted crystal ball with exceptional clarity, perfect for divination and scrying.',
      image: '/api/placeholder/200/200',
      price: 119.99,
      category: 'Divination Tools',
    },
    store: {
      name: 'Enchanted Emporium',
      slug: 'enchanted-emporium',
      seller: 'Merlin Wizard',
    },
    status: 'Delivered',
    statusHistory: [
      { status: 'Order Placed', date: '2025-03-10T10:30:00Z' },
      { status: 'Payment Confirmed', date: '2025-03-10T10:35:00Z' },
      { status: 'Processing', date: '2025-03-10T14:22:00Z' },
      { status: 'Shipped', date: '2025-03-11T09:15:00Z' },
      { status: 'Delivered', date: '2025-03-13T15:42:00Z' },
    ],
    shipping: {
      method: 'Phoenix Express',
      cost: 10.00,
      address: '123 Wizard Lane, Mystic City, MC 12345',
      trackingNumber: 'PX-78901234',
    },
    payment: {
      method: 'Magic Credit Card',
      subtotal: 119.99,
      tax: 7.20,
      total: 137.19,
    },
    messages: [
      {
        sender: 'You',
        message: 'Hi, I was wondering if the Crystal Ball comes with a stand?',
        date: '2025-03-10T11:45:00Z',
      },
      {
        sender: 'Merlin Wizard',
        message: 'Yes, it includes a beautiful carved oak stand. It will be packed securely with the crystal ball.',
        date: '2025-03-10T12:30:00Z',
      },
    ],
  };

  return (
    <DashboardPageWrapper pageName={`Order ${orderId}`}>
      <div className="space-y-6">
        {/* Navigation and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/dashboard/buy"
            className="inline-flex items-center text-purple-700 hover:text-purple-900"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Purchase History
          </Link>
          
          <div className="flex space-x-2">
            <button type="button" className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700">
              <Download size={16} className="mr-1" />
              Download Receipt
            </button>
            <button type="button" className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              <Printer size={16} className="mr-1" />
              Print Order
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-purple-900 mb-1">Order Summary</h2>
              <p className="text-gray-600">Placed on {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <span 
              className={`inline-flex px-3 py-1 text-sm rounded-full ${
                order.status === 'Delivered' 
                  ? 'bg-green-100 text-green-800' 
                  : order.status === 'Shipped' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Shipping Method</p>
              <p className="font-medium">{order.shipping.method}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{order.payment.method}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-start">
              <div className="h-24 w-24 flex-shrink-0 rounded bg-purple-100 mr-6">
                <Image
                  src={order.item.image}
                  alt={order.item.name}
                  width={96}
                  height={96}
                  className="rounded"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{order.item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{order.item.description}</p>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">Category: {order.item.category}</span>
                </div>
                <div className="mt-2">
                  <span className="font-medium">${order.item.price.toFixed(2)}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Sold by: <Link href={`/store/${order.store.slug}`} className="text-purple-700 hover:text-purple-900">
                      {order.store.name}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Shipping Address</p>
                <p className="font-medium mt-1">{order.shipping.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shipping Method</p>
                <p className="font-medium mt-1">{order.shipping.method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-medium mt-1">{order.shipping.trackingNumber}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-medium">${order.payment.subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Shipping</p>
                <p className="font-medium">${order.shipping.cost.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Tax</p>
                <p className="font-medium">${order.payment.tax.toFixed(2)}</p>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <p className="font-medium text-gray-900">Total</p>
                <p className="font-bold text-purple-900">${order.payment.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Status History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Status History</h3>
            <div className="space-y-4">
              {order.statusHistory.map((status, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={index} className="flex">
                  <div className="mr-4 relative">
                    <div className={`h-5 w-5 rounded-full ${index === order.statusHistory.length - 1 ? 'bg-green-500' : 'bg-purple-500'}`} />
                    {index < order.statusHistory.length - 1 && (
                      <div className="absolute top-5 left-2 w-1 bg-gray-300 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{status.status}</p>
                    <p className="text-sm text-gray-500">{new Date(status.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Messages</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {order.messages.length > 0 ? (
                order.messages.map((msg, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={index} className={`p-3 rounded-lg ${msg.sender === 'You' ? 'bg-purple-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">{msg.sender}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.date).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No messages for this order</p>
              )}
            </div>
            <div className="mt-4 flex">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-l-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Order Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Order Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <button type="button" className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
              <Book size={24} className="mb-2" />
              <span className="text-sm text-center">Add to Collection</span>
            </button>
            <button type="button" className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
              <Store size={24} className="mb-2" />
              <span className="text-sm text-center">Add to Store</span>
            </button>
            <button type="button" className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
              <MessageSquare size={24} className="mb-2" />
              <span className="text-sm text-center">Contact Seller</span>
            </button>
            <button type="button" className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
              <Star size={24} className="mb-2" />
              <span className="text-sm text-center">Add Review</span>
            </button>
            <button type="button" className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
              <Flag size={24} className="mb-2" />
              <span className="text-sm text-center">Report Issue</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}