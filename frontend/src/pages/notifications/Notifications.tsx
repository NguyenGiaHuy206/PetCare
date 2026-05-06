import { Bell, Check, Trash2, Settings } from "lucide-react";
import { useState } from "react";

type NotificationItem = {
  id: number;
  type: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function Notifications() {
  // No backend /notifications endpoint exists yet.
  // Starts empty — no fake hardcoded data.
  // When backend is ready, replace useState([]) with a useEffect + API fetch.
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("All");

  const markAsRead = (id: number) => {
    setNotifications(n => n.map(item => item.id === id ? { ...item, read: true } : item));
  };

  const markAllAsRead = () => {
    setNotifications(n => n.map(item => ({ ...item, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(n => n.filter(item => item.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter.toLowerCase();
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-2 flex-wrap">
          {["All", "Unread", "Bookings", "Orders", "Reminders"].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg ${
                filter === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.map(notification => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${
                !notification.read ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${notification.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${notification.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notification.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { label: "Booking Reminders", desc: "Get notified about upcoming appointments" },
            { label: "Order Updates", desc: "Track your order status and delivery" },
            { label: "Vaccination Reminders", desc: "Never miss important pet health dates" },
            { label: "Promotional Offers", desc: "Receive updates about special deals" },
          ].map(pref => (
            <label key={pref.label} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">{pref.label}</p>
                <p className="text-sm text-gray-600">{pref.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}