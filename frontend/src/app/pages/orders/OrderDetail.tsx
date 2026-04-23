import { Link, useParams } from "react-router";
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { orderAPI, OrderResponse } from "../../utils/api";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await orderAPI.getById(id);
        setOrder(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Build a simple timeline from the order status
  const buildTimeline = (status: string, createdAt: string) => {
    const steps = ["processing", "shipped", "delivered"];
    const currentIdx = steps.indexOf(status.toLowerCase());
    return [
      { status: "Order Placed", date: new Date(createdAt).toLocaleString(), completed: true },
      { status: "Processing", date: "", completed: currentIdx >= 0 },
      { status: "Shipped", date: "", completed: currentIdx >= 1 },
      { status: "Delivered", date: "", completed: currentIdx >= 2 },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link to="/orders" className="inline-flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const timeline = buildTimeline(order.status, order.created_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 font-mono">#{String(order.id).slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline + Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.completed ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {event.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${event.completed ? "bg-green-200" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium ${event.completed ? "text-gray-900" : "text-gray-400"}`}>
                      {event.status}
                    </p>
                    {event.date && <p className="text-sm text-gray-600">{event.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 font-mono text-sm">
                      Product #{String(item.product_id).slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${item.price_at_purchase.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items ({order.items.length})</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600 mb-1">Order placed</p>
            <p className="font-medium text-gray-900">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>

          {order.stripe_session_id && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              </div>
              <p className="text-sm text-gray-600 break-all font-mono">{order.stripe_session_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}