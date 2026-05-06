import { Link, useNavigate, useParams } from "react-router";
import { useState } from "react";
import { Lock, PawPrint } from "lucide-react";
import { authAPI } from "../../services/auth";
import { getApiErrorMessage } from "../../utils/errors";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authAPI.resetPassword(token, newPassword, confirmPassword);
      setMessage(response.message);
      navigate("/login");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <PawPrint className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-semibold text-gray-900">PetCare Shop</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Set new password</h2>
          <p className="mt-2 text-gray-600">Choose a strong password for your account</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg border">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">{message}</div>}
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
