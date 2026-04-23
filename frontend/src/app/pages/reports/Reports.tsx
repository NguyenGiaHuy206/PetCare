import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Download } from "lucide-react";

export default function Reports() {
  const revenueData = [
    { month: "Jan", revenue: 12500 },
    { month: "Feb", revenue: 15200 },
    { month: "Mar", revenue: 18800 },
    { month: "Apr", revenue: 16500 },
  ];

  const serviceData = [
    { name: "Grooming", value: 35 },
    { name: "Veterinary", value: 25 },
    { name: "Training", value: 20 },
    { name: "Daycare", value: 20 },
  ];

  const bookingsData = [
    { week: "Week 1", bookings: 45 },
    { week: "Week 2", bookings: 52 },
    { week: "Week 3", bookings: 48 },
    { week: "Week 4", bookings: 61 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const stats = [
    { label: "Total Revenue", value: "$63,000", change: "+12.5%", icon: DollarSign, color: "bg-blue-100 text-blue-600" },
    { label: "Total Orders", value: "1,247", change: "+8.2%", icon: ShoppingBag, color: "bg-green-100 text-green-600" },
    { label: "Active Customers", value: "842", change: "+15.3%", icon: Users, color: "bg-purple-100 text-purple-600" },
    { label: "Bookings", value: "206", change: "+5.7%", icon: Calendar, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
            <option>Custom Range</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
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
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Distribution</h2>
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
              {[
                { product: "Premium Dog Food", category: "Food", units: 342, revenue: 15719.58 },
                { product: "Interactive Cat Toy", category: "Toys", units: 289, revenue: 3754.11 },
                { product: "Comfortable Pet Bed", category: "Accessories", units: 201, revenue: 7032.99 },
                { product: "Leather Dog Collar", category: "Accessories", units: 178, revenue: 3378.22 },
                { product: "Pet Grooming Kit", category: "Grooming", units: 156, revenue: 3898.44 },
              ].map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{item.product}</td>
                  <td className="py-3 px-4 text-gray-600">{item.category}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.units}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">${item.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
