import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Shield, Save, Loader2 } from "lucide-react";
import apiClient from "../../utils/api";

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
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<UserData>("/users/me");
        const data = res.data;
        setUser(data);
        // Populate form fields with real data
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch (err) {
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
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-4">
              <User className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{user?.full_name}</h3>
            <p className="text-sm text-gray-600 mb-4">Member since {joinedDate}</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full">
              Upload Photo
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Permissions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Role & Permissions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Role</p>
            <p className="font-semibold text-gray-900 capitalize">{user?.role}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Permissions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {permissions.map((perm) => (
                <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
            <span className="text-gray-700">Change Password</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
            <span className="text-gray-700">Two-Factor Authentication</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex justify-between items-center">
            <span>Delete Account</span>
            <span className="text-red-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}