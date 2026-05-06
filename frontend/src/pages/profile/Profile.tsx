import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Loader2, Mail, MapPin, Phone, Save, Shield, Trash2, User, X } from "lucide-react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../services/users";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<UserData>("/users/me");
        const data = res.data;
        setUser(data);
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const res = await apiClient.put<UserData>("/users/me", {
        full_name: fullName,
        email,
        phone,
        address,
      });
      setUser(res.data);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangePasswordError(null);
      setChangePasswordLoading(true);

      if (!currentPassword || !newPassword || !confirmPassword) {
        setChangePasswordError("All fields are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        setChangePasswordError("New passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        setChangePasswordError("Password must be at least 6 characters");
        return;
      }

      await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccessMsg("Password changed successfully!");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setChangePasswordError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteConfirmation !== "DELETE") {
        setDeleteError('Please type "DELETE" to confirm');
        return;
      }

      setDeleteError(null);
      setDeleteLoading(true);
      await userAPI.deleteAccount();
      logout();
      navigate("/login");
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  const permissionsByRole: Record<string, string[]> = {
    customer: ["View Pets", "Book Services", "Make Purchases"],
    admin: ["View Pets", "Book Services", "Make Purchases", "Manage Users", "Manage Products"],
    vet: ["View Pets", "Book Services", "Write Care Logs"],
  };

  const permissions = permissionsByRole[user?.role ?? "customer"] ?? [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMsg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMsg}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-center">
            <div className="mb-4 inline-flex h-32 w-32 items-center justify-center rounded-full bg-blue-100">
              <User className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">{user?.full_name}</h3>
            <p className="mb-4 text-sm text-gray-600">Member since {joinedDate}</p>
            <button className="w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200">Upload Photo</button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Account Details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Role & Permissions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-sm text-gray-600">Current Role</p>
            <p className="font-semibold capitalize text-gray-900">{user?.role}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-sm text-gray-600">Permissions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <span key={perm} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Security</h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-gray-50"
          >
            <span className="text-gray-700">Change Password</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex w-full items-center justify-between rounded-lg border border-red-200 px-4 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <span>Delete Account</span>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>

      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Lock className="h-5 w-5" />
                Change Password
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setChangePasswordError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {changePasswordError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{changePasswordError}</div>}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setChangePasswordError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changePasswordLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changePasswordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                  setDeleteError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. Your account and all associated data will be permanently deleted.
              </p>
            </div>

            {deleteError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation("");
                    setDeleteError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmation !== "DELETE"}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteLoading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}