import { Link, useParams } from "react-router";
import { ArrowLeft, Package, CheckCircle, Loader2, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { orderAPI, OrderResponse } from "../../services/orders";
import { formatVnd } from "../../utils/format";
import { getImageSrc } from "../../utils/images";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await orderAPI.getById(id);
        setOrder(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load order"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid": return "bg-green-100 text-green-700";
      case "cod_pending": return "bg-orange-100 text-orange-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const paymentLabel = (currentOrder: OrderResponse) => {
    if (currentOrder.payment_status === "cod_pending") {
      return "pending COD";
    }
    if (currentOrder.payment_status === "pending" && currentOrder.payment_method === "vnpay") {
      return "pending pre-paid";
    }
    return currentOrder.payment_status.replace("_", " ");
  };

  const serviceStatusLabel = (status: string) => {
    if (status === "delivered") {
      return "completed";
    }
    if (status === "shipped") {
      return "in progress";
    }
    return status;
  };

  const fulfillmentStatusLabel = (status: string) => {
    if (status === "pending") {
      return "preparing";
    }
    return status;
  };

  const canPayOnline = (currentOrder: OrderResponse) =>
    user?.role !== "admin" &&
    currentOrder.payment_method === "vnpay" &&
    currentOrder.payment_status !== "paid" &&
    currentOrder.status !== "cancelled";

  const handlePayNow = async () => {
    if (!order) return;
    try {
      setPaying(true);
      setError("");
      const response = await orderAPI.pay(order.id);
      window.location.href = response.checkout_url;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to start VNPAY payment."));
      setPaying(false);
    }
  };

  const handleOrderStatusChange = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      setError("");
      const updated = await orderAPI.updateStatusAdmin(order.id, newStatus);
      setOrder(updated);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update order status."));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Build a simple timeline from the order status
  const buildTimeline = (status: string, createdAt: string) => {
    const steps = ["pending", "shipped", "delivered"];
    const currentIdx = steps.indexOf(status.toLowerCase());
    return [
      { status: "Order Placed", date: new Date(createdAt).toLocaleString(), completed: true },
      { status: "Preparing", date: "", completed: currentIdx >= 0 },
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

  if (!order) {
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

  const isServiceOrder = order.items.every((item) => item.product_kind === "service");
  const timeline = buildTimeline(order.status, order.created_at);
  const paymentStatusLabel = paymentLabel(order);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 font-mono">#{String(order.id).slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
            {isServiceOrder ? serviceStatusLabel(order.status) : fulfillmentStatusLabel(order.status)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPaymentColor(order.payment_status)}`}>
            {paymentStatusLabel}
          </span>
          {canPayOnline(order) && (
            <button
              type="button"
              onClick={handlePayNow}
              disabled={paying}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pay now
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline + Items */}
        <div className="lg:col-span-2 space-y-6">
          {isServiceOrder ? (
            <div className="bg-white rounded-lg border border-l-4 border-l-purple-500 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Service Appointment</h2>
              <p className="text-sm text-gray-600">This order tracks an appointment, separate from product delivery.</p>
              {user?.role === "admin" && (
                <div className="mt-4 max-w-xs">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Service status</label>
                  <select
                    value={order.status}
                    onChange={(event) => handleOrderStatusChange(event.target.value)}
                    disabled={updatingStatus}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="pending">pending</option>
                    <option value="shipped">in progress</option>
                    <option value="delivered">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Fulfillment Status</h2>
                {user?.role === "admin" && (
                  <select
                    value={order.status}
                    onChange={(event) => handleOrderStatusChange(event.target.value)}
                    disabled={updatingStatus}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="pending">preparing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                )}
              </div>
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
          )}

          {/* Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  {item.product_image_url ? (
                    <img
                      src={getImageSrc(item.product_image_url)}
                      alt={item.product_name ?? "Order item"}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {item.product_name ?? "Product"}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.product_kind === "service" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                      }`}>
                        {item.product_kind === "service" ? "Service" : "Product"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">Item ID: {item.product_id}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatVnd(item.price_at_purchase)}</p>
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
                <span>{formatVnd(order.total)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatVnd(order.total)}</span>
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

        </div>
      </div>
    </div>
  );
}
