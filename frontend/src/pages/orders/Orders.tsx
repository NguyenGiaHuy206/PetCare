import { Link } from "react-router";
import { Package, Calendar, ChevronRight, Loader2, Clock, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { orderAPI, OrderResponse } from "../../services/orders";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";
import { formatVnd } from "../../utils/format";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (user?.role === "admin") {
          const orderData = await orderAPI.getAllAdmin();
          setOrders(orderData);
          try {
            const userData = await adminAPI.getUsers();
            const map = userData.reduce((acc, item) => {
              acc[item.id] = item;
              return acc;
            }, {} as Record<string, UserResponse>);
            setUsersById(map);
          } catch {
            setUsersById({});
          }
        } else {
          const data = await orderAPI.getAll();
          setOrders(data);
          setUsersById({});
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load orders"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

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

  const paymentLabel = (order: OrderResponse) => {
    if (order.payment_status === "cod_pending") {
      return "pending COD";
    }
    if (order.payment_status === "pending" && order.payment_method === "vnpay") {
      return "pending pre-paid";
    }
    return order.payment_status.replace("_", " ");
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

  const canPayOnline = (order: OrderResponse) =>
    user?.role !== "admin" &&
    order.payment_method === "vnpay" &&
    order.payment_status !== "paid" &&
    order.status !== "cancelled";

  const handlePayNow = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      setError("");
      const response = await orderAPI.pay(orderId);
      window.location.href = response.checkout_url;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to start VNPAY payment."));
      setPayingOrderId(null);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      const updated = await orderAPI.updateStatusAdmin(orderId, status);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update order status."));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(o =>
    statusFilter === "All Orders" || o.status.toLowerCase() === statusFilter.toLowerCase()
  );

  const productOrders = filteredOrders.filter((order) => order.items.some((item) => item.product_kind !== "service"));
  const serviceOrders = filteredOrders.filter((order) => order.items.some((item) => item.product_kind === "service"));

  const groupOrdersByUser = (list: OrderResponse[]) => list.reduce((acc, order) => {
    const key = order.user_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {} as Record<string, OrderResponse[]>);

  const getUserLabel = (userId: string) => {
    const found = usersById[userId];
    if (!found) {
      return `User ${userId.slice(0, 8)}`;
    }
    return `${found.full_name} (${found.email})`;
  };

  const itemSummary = (order: OrderResponse) => {
    const products = order.items.filter((item) => item.product_kind !== "service");
    const services = order.items.filter((item) => item.product_kind === "service");
    const formatItems = (items: typeof order.items) =>
      items.map((item) => item.product_name ?? `Item ${item.product_id.slice(0, 8)}`).join(", ");

    return (
      <div className="mb-4 space-y-1 text-sm text-gray-600">
        {products.length > 0 && <p><span className="font-medium text-gray-800">Products:</span> {formatItems(products)}</p>}
        {services.length > 0 && <p><span className="font-medium text-gray-800">Services:</span> {formatItems(services)}</p>}
      </div>
    );
  };

  const renderOrderCard = (order: OrderResponse, type: "service" | "product") => (
    <div key={order.id} className={`bg-white rounded-lg border hover:shadow-md transition ${type === "service" ? "border-l-4 border-l-purple-500" : ""}`}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 font-mono">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {type === "service" ? <Clock className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                <span>{type === "service" ? "Service appointment" : `${order.items.length} item${order.items.length !== 1 ? "s" : ""}`}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
              {type === "service" ? serviceStatusLabel(order.status) : fulfillmentStatusLabel(order.status)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPaymentColor(order.payment_status)}`}>
              {paymentLabel(order)}
            </span>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatVnd(order.total)}</p>
            </div>
          </div>
        </div>
        {type === "service" ? (
          <div className="mb-4 rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-800">
            This is a booked service order. Manage its appointment progress separately from product delivery.
          </div>
        ) : (
          itemSummary(order)
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {user?.role === "admin" && (
            <select
              value={order.status === "delivered" ? "delivered" : order.status}
              onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
              disabled={updatingOrderId === order.id}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="pending">{type === "service" ? "pending" : "preparing"}</option>
              <option value="shipped">{type === "service" ? "in progress" : "shipped"}</option>
              <option value="delivered">{type === "service" ? "completed" : "delivered"}</option>
              <option value="cancelled">cancelled</option>
            </select>
          )}
          {canPayOnline(order) && (
            <button
              type="button"
              onClick={() => handlePayNow(order.id)}
              disabled={payingOrderId === order.id}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pay now
            </button>
          )}
          <Link
            to={`/orders/${order.id}`}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  const renderOrderSection = (title: string, list: OrderResponse[]) => (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{list.length} order{list.length === 1 ? "" : "s"}</p>
      </div>
      {list.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">No {title.toLowerCase()} orders found.</div>
      ) : user?.role === "admin" ? (
        Object.entries(groupOrdersByUser(list)).map(([userId, userOrders]) => (
          <div key={userId} className="space-y-3 rounded-lg border border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-800">{getUserLabel(userId)}</h3>
            {userOrders.map((order) => renderOrderCard(order, title === "Services" ? "service" : "product"))}
          </div>
        ))
      ) : (
        list.map((order) => renderOrderCard(order, title === "Services" ? "service" : "product"))
      )}
    </section>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{user?.role === "admin" ? "Users' Orders" : "My Orders"}</h1>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option>All Orders</option>
          <option>pending</option>
          <option>delivered</option>
          <option>shipped</option>
          <option>processing</option>
          <option>cancelled</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-8">
        {renderOrderSection("Services", serviceOrders)}
        {renderOrderSection("Products", productOrders)}
      </div>

      {filteredOrders.length === 0 && !error && (
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
