import { Link, useParams } from "react-router";
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Calendar, Download } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();

  const order = {
    id: "ORD-2026-001",
    date: "2026-04-15",
    status: "Delivered",
    total: 106.97,
    subtotal: 93.97,
    tax: 7.52,
    shipping: 5.48,
    trackingNumber: "1Z999AA10123456784",
    deliveredDate: "2026-04-18",
    items: [
      {
        id: 1,
        name: "Premium Dog Food",
        price: 45.99,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200",
      },
      {
        id: 2,
        name: "Interactive Cat Toy",
        price: 12.99,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=200",
      },
      {
        id: 3,
        name: "Comfortable Pet Bed",
        price: 34.99,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1564510714747-69c3bc1fab41?w=200",
      },
    ],
    shippingAddress: {
      name: "John Doe",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      phone: "+1 (555) 123-4567",
    },
    timeline: [
      { status: "Order Placed", date: "2026-04-15 10:30 AM", completed: true },
      { status: "Processing", date: "2026-04-15 02:15 PM", completed: true },
      { status: "Shipped", date: "2026-04-16 09:00 AM", completed: true },
      { status: "Out for Delivery", date: "2026-04-18 08:30 AM", completed: true },
      { status: "Delivered", date: "2026-04-18 02:45 PM", completed: true },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600">{order.id}</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              {order.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {event.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    {idx < order.timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        event.completed ? 'bg-green-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium ${
                      event.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {event.status}
                    </p>
                    <p className="text-sm text-gray-600">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="pt-2">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Tracking</h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-mono text-sm text-gray-900 break-all">{order.trackingNumber}</p>
                <button className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Track Package
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
