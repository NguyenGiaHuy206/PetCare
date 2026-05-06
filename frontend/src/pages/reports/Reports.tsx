import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingBag, Users, Calendar, Download, TrendingDown, TrendingUp } from "lucide-react";
import { orderAPI, type OrderResponse } from "../../services/orders";
import { bookingAPI, type BookingResponse } from "../../services/bookings";
import { productAPI, type ProductResponse } from "../../services/products";
import { categoryAPI } from "../../services/categories";
import { getApiErrorMessage } from "../../utils/errors";
import { useAuth } from "../../contexts/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductResponse>>({});
  const [shopCategoriesById, setShopCategoriesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderList, bookingList, categories] = await Promise.all([
          orderAPI.getAllAdmin(0, 100),
          bookingAPI.getAllAdmin(0, 100),
          categoryAPI.getAll("shop"),
        ]);
        setOrders(orderList);
        setBookings(bookingList);
        setShopCategoriesById(
          categories.reduce((acc, category) => {
            acc[category.id] = category.name;
            return acc;
          }, {} as Record<string, string>)
        );

        const uniqueProductIds = [...new Set(orderList.flatMap((order) => order.items.map((item) => item.product_id)))];
        const productEntries = await Promise.all(
          uniqueProductIds.map(async (productId) => {
            try {
              return [productId, await productAPI.getById(productId)] as const;
            } catch {
              return null;
            }
          })
        );

        const productMap = productEntries.reduce((acc, entry) => {
          if (!entry) {
            return acc;
          }
          const [productId, product] = entry;
          acc[productId] = product;
          return acc;
        }, {} as Record<string, ProductResponse>);
        setProductsById(productMap);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load reports"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading reports...</div>;
  if (user?.role !== "admin") return <div className="text-gray-700 py-10">Admin access required.</div>;
  if (error) return <div className="text-red-600 py-10">{error}</div>;

  const rangeLabels: Record<string, string> = {
    "30": "Last 30 Days",
    "90": "Last 90 Days",
    year: "This Year",
    custom: "Custom Range",
  };

  const getRangeBounds = () => {
    const now = new Date();
    if (range === "30") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { start, end: now };
    }
    if (range === "90") {
      const start = new Date(now);
      start.setDate(start.getDate() - 89);
      return { start, end: now };
    }
    if (range === "year") {
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    }
    if (range === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
        return { start, end };
      }
    }
    return null;
  };

  const rangeBounds = getRangeBounds();
  const rangeLabel =
    range === "custom" && customStart && customEnd
      ? `${customStart} to ${customEnd}`
      : rangeLabels[range] ?? "Custom Range";
  const isWithinRange = (value: string) => {
    if (!rangeBounds) {
      return true;
    }
    const date = new Date(value);
    return date >= rangeBounds.start && date <= rangeBounds.end;
  };

  const filteredOrders = orders.filter((order) => isWithinRange(order.created_at));
  const filteredBookings = bookings.filter((booking) => isWithinRange(booking.created_at));
  const totalRevenue = filteredOrders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const totalBookings = filteredBookings.length;
  const activeCustomers = new Set([
    ...filteredOrders.map((order) => order.user_id),
    ...filteredBookings.map((booking) => booking.user_id),
  ]).size;

  const getPreviousRange = () => {
    if (!rangeBounds) {
      return null;
    }
    const durationMs = rangeBounds.end.getTime() - rangeBounds.start.getTime() + 1;
    const prevEnd = new Date(rangeBounds.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs + 1);
    return { start: prevStart, end: prevEnd };
  };

  const previousRange = getPreviousRange();
  const isWithinPreviousRange = (value: string) => {
    if (!previousRange) {
      return false;
    }
    const date = new Date(value);
    return date >= previousRange.start && date <= previousRange.end;
  };

  const previousOrders = orders.filter((order) => isWithinPreviousRange(order.created_at));
  const previousBookings = bookings.filter((booking) => isWithinPreviousRange(booking.created_at));
  const previousRevenue = previousOrders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.total, 0);
  const previousOrdersTotal = previousOrders.length;
  const previousBookingsTotal = previousBookings.length;
  const previousActiveCustomers = new Set([
    ...previousOrders.map((order) => order.user_id),
    ...previousBookings.map((booking) => booking.user_id),
  ]).size;

  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) {
      return {
        label: current === 0 ? "0%" : "New",
        direction: current === 0 ? "flat" : "up",
      } as const;
    }
    const percent = ((current - previous) / previous) * 100;
    const rounded = Math.round(percent * 10) / 10;
    return {
      label: `${rounded > 0 ? "+" : ""}${rounded}%`,
      direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
    } as const;
  };

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const revenueData = monthKeys.map((monthKey) => {
    const revenue = filteredOrders
      .filter((order) => order.created_at.slice(0, 7) === monthKey)
      .reduce((sum, order) => sum + order.total, 0);
    const monthIndex = Number(monthKey.slice(5)) - 1;
    return {
      month: `${monthLabels[monthIndex]} ${monthKey.slice(0, 4)}`,
      revenue,
    };
  });

  const serviceData = Object.entries(
    filteredBookings.reduce((acc, booking) => {
      acc[booking.service] = (acc[booking.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }));

  const bookingsData = monthKeys.map((monthKey) => {
    const bookingsCount = filteredBookings.filter((booking) => booking.created_at.slice(0, 7) === monthKey).length;
    const monthIndex = Number(monthKey.slice(5)) - 1;
    return {
      week: `${monthLabels[monthIndex]} ${monthKey.slice(0, 4)}`,
      bookings: bookingsCount,
    };
  });

  const topProducts = Object.values(
    filteredOrders.flatMap((order) =>
      order.items.map((item) => {
        const product = productsById[item.product_id];
        return {
          productId: item.product_id,
          product: product?.name ?? `Product ${item.product_id.slice(0, 8)}`,
          category: product ? (shopCategoriesById[product.category_id ?? ""] ?? "Uncategorized") : "Uncategorized",
          units: item.quantity,
          revenue: item.price_at_purchase * item.quantity,
        };
      })
    ).reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = { ...item };
        return acc;
      }
      acc[item.productId].units += item.units;
      acc[item.productId].revenue += item.revenue;
      return acc;
    }, {} as Record<string, { productId: string; product: string; category: string; units: number; revenue: number }>)
  )
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const stats = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      trend: formatTrend(totalRevenue, previousRevenue),
      icon: DollarSign,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      trend: formatTrend(totalOrders, previousOrdersTotal),
      icon: ShoppingBag,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Active Customers",
      value: activeCustomers.toString(),
      trend: formatTrend(activeCustomers, previousActiveCustomers),
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Bookings",
      value: totalBookings.toString(),
      trend: formatTrend(totalBookings, previousBookingsTotal),
      icon: Calendar,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const handleExport = () => {
    const payload = {
      range: rangeLabel,
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_bookings: totalBookings,
        active_customers: activeCustomers,
      },
      orders: filteredOrders,
      bookings: filteredBookings,
      top_products: topProducts,
      service_summary: serviceData,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `petcare-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {range === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={range === "custom" && (!customStart || !customEnd)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span
                className={`text-xs font-medium flex items-center gap-1 ${
                  stat.trend.direction === "down"
                    ? "text-red-600"
                    : stat.trend.direction === "up"
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
                {stat.trend.direction === "down" ? (
                  <TrendingDown className="w-4 h-4" />
                ) : stat.trend.direction === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : null}
                {stat.trend.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-2">{rangeLabel}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Booked Services</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Bookings Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={bookingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Units Sold</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{item.product}</td>
                  <td className="py-3 px-4 text-gray-600">{item.category}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.units}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">${item.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-gray-500" colSpan={4}>
                    No order data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
