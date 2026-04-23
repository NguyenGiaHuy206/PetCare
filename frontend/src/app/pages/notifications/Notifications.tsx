import { Bell, Calendar, ShoppingBag, PawPrint, Check, Trash2, Settings } from "lucide-react";
import { useState } from "react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "booking",
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Upcoming Appointment",
      message: "Your grooming appointment for Max is scheduled for tomorrow at 10:00 AM",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "order",
      icon: ShoppingBag,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Order Delivered",
      message: "Your order #ORD-2026-001 has been delivered successfully",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "reminder",
      icon: PawPrint,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Vaccination Reminder",
      message: "Luna's rabies vaccination is due next week. Schedule an appointment now.",
      time: "1 day ago",
      read: false,
    },
    {
      id: 4,
      type: "booking",
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Booking Confirmed",
      message: "Your veterinary appointment for Max on April 25 has been confirmed",
      time: "2 days ago",
      read: true,
    },
    {
      id: 5,
      type: "order",
      icon: ShoppingBag,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Order Shipped",
      message: "Your order #ORD-2026-002 is on the way. Track your package.",
      time: "3 days ago",
      read: true,
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifs =>
      notifs.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifs =>
      notifs.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifs => notifs.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
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
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">All</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Unread</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Bookings</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Orders</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Reminders</button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map(notification => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${
                !notification.read ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${notification.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${notification.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Booking Reminders</p>
              <p className="text-sm text-gray-600">Get notified about upcoming appointments</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Order Updates</p>
              <p className="text-sm text-gray-600">Track your order status and delivery</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Vaccination Reminders</p>
              <p className="text-sm text-gray-600">Never miss important pet health dates</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
          </label>
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Promotional Offers</p>
              <p className="text-sm text-gray-600">Receive updates about special deals</p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
          </label>
        </div>
      </div>
    </div>
  );
}
