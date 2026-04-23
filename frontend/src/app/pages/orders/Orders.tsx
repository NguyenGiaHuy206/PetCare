import { Link } from "react-router";
import { Package, Calendar, DollarSign, ChevronRight } from "lucide-react";

export default function Orders() {
  const orders = [
    {
      id: "ORD-2026-001",
      date: "2026-04-15",
      status: "Delivered",
      total: 106.97,
      items: 3,
      trackingNumber: "1Z999AA10123456784",
    },
    {
      id: "ORD-2026-002",
      date: "2026-04-10",
      status: "Shipped",
      total: 75.50,
      items: 2,
      trackingNumber: "1Z999AA10123456785",
    },
    {
      id: "ORD-2026-003",
      date: "2026-04-05",
      status: "Processing",
      total: 142.30,
      items: 5,
      trackingNumber: null,
    },
    {
      id: "ORD-2026-004",
      date: "2026-03-28",
      status: "Delivered",
      total: 89.99,
      items: 2,
      trackingNumber: "1Z999AA10123456786",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'Shipped':
        return 'bg-blue-100 text-blue-700';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Orders</option>
            <option>Delivered</option>
            <option>Shipped</option>
            <option>Processing</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg border hover:shadow-md transition">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{order.id}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(order.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{order.items} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="text-sm font-mono text-gray-900">{order.trackingNumber}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  to={`/orders/${order.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {order.status === 'Delivered' && (
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Reorder
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link to="/shop" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
