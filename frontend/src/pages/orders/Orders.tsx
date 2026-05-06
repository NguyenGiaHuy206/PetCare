import { Link } from "react-router";
import { Package, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { orderAPI, OrderResponse } from "../../services/orders";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");

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
      case "delivered": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredOrders = orders.filter(o =>
    statusFilter === "All Orders" || o.status.toLowerCase() === statusFilter.toLowerCase()
  );

  const groupedOrders = filteredOrders.reduce((acc, order) => {
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
          <option>delivered</option>
          <option>shipped</option>
          <option>processing</option>
          <option>cancelled</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {user?.role === "admin" ? (
          Object.entries(groupedOrders).map(([userId, userOrders]) => (
            <section key={userId} className="space-y-3 rounded-lg border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-800">{getUserLabel(userId)}</h3>
              {userOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border hover:shadow-md transition">
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
                            <Package className="w-4 h-4" />
                            <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
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
              ))}
            </section>
          ))
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg border hover:shadow-md transition">
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
                        <Package className="w-4 h-4" />
                        <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
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
          ))
        )}
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