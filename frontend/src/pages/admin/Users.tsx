import { useEffect, useState } from "react";
import { Loader2, Users, Trash2 } from "lucide-react";
import { adminAPI } from "../../services/admin";
import type { UserResponse } from "../../services/types";
import { useAuth } from "../../contexts/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import { useToast } from "../../components/ToastProvider";

export default function AdminUsers() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const superAdminEmail = (import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? "admin@petcare.com").toLowerCase();
  const isSuperAdmin = user?.email?.toLowerCase() === superAdminEmail;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getUsers();
        setUsers(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load users."));
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleDemote = async (userId: string) => {
    if (!window.confirm("Demote this admin to user?")) {
      return;
    }
    try {
      setUpdatingUserId(userId);
      const updated = await adminAPI.updateUserRole(userId, "user");
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to demote user."));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDelete = async (target: UserResponse) => {
    if (target.id === user?.id) {
      setError("You cannot delete yourself.");
      return;
    }
    if (target.email.toLowerCase() === superAdminEmail) {
      setError("Cannot delete super admin.");
      return;
    }
    if (!window.confirm(`Delete account ${target.email}? This cannot be undone.`)) {
      return;
    }
    try {
      setUpdatingUserId(target.id);
      await adminAPI.deleteUser(target.id);
      setUsers((current) => current.filter((item) => item.id !== target.id));
      toast.success("User deleted.");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to delete user.");
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="rounded-lg bg-white border p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Admin access required</h1>
        <p className="mt-2 text-gray-600">Only admins can view users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <p className="text-gray-600 mt-1">View all registered accounts and roles.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Registered Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Role</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id} className="border-b last:border-b-0">
                  <td className="px-6 py-4 text-sm text-gray-900">{account.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{account.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        account.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {account.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      {account.role === "admin" && isSuperAdmin && account.email.toLowerCase() !== superAdminEmail ? (
                        <button
                          type="button"
                          onClick={() => handleDemote(account.id)}
                          disabled={updatingUserId === account.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Demote
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 self-center capitalize">{account.role}</span>
                      )}
                      {account.email.toLowerCase() !== superAdminEmail && account.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(account)}
                          disabled={updatingUserId === account.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
