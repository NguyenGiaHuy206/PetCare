import { Bell, Calendar, Check, FileText, Package, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationAPI, type NotificationResponse } from "../../services/notifications";
import { useToast } from "../../components/ToastProvider";
import { getApiErrorMessage } from "../../utils/errors";

const notificationStyle = (type: string) => {
  switch (type) {
    case "booking":
      return { icon: Calendar, iconColor: "text-blue-600", bgColor: "bg-blue-100" };
    case "order":
      return { icon: Package, iconColor: "text-green-600", bgColor: "bg-green-100" };
    case "carelog":
      return { icon: FileText, iconColor: "text-purple-600", bgColor: "bg-purple-100" };
    default:
      return { icon: Bell, iconColor: "text-gray-600", bgColor: "bg-gray-100" };
  }
};

const notifyCountChanged = () => {
  window.dispatchEvent(new Event("notifications-updated"));
};

export default function Notifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationAPI.getAll();
        setNotifications(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load notifications."));
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const updated = await notificationAPI.markRead(id);
      setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
      notifyCountChanged();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to mark notification as read."));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      notifyCountChanged();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to mark notifications as read."));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      notifyCountChanged();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to delete notification."));
    }
  };

  const filterToType: Record<string, string> = {
    Bookings: "booking",
    Orders: "order",
    Carelogs: "carelog",
    Reminders: "reminder",
  };
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !notification.is_read;
    return notification.type === filterToType[filter];
  });
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  if (loading) {
    return <div className="py-12 text-center text-gray-600">Loading notifications...</div>;
  }

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
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-2 flex-wrap">
          {["All", "Unread", "Bookings", "Orders", "Carelogs", "Reminders"].map((tab) => (
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

      <div className="space-y-2">
        {filteredNotifications.map((notification) => {
          const style = notificationStyle(notification.type);
          const Icon = style.icon;
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${
                !notification.is_read ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${style.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-medium ${!notification.is_read ? "text-gray-900" : "text-gray-700"}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!notification.is_read && (
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
          <p className="text-gray-600">You're all caught up.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { label: "Booking Reminders", desc: "Get notified about upcoming appointments" },
            { label: "Order Updates", desc: "Track your order status and delivery" },
            { label: "Care Log Updates", desc: "Receive updates when staff add care logs" },
          ].map((pref) => (
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
