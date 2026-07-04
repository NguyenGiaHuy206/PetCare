import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Mail, ArrowLeft, PawPrint } from "lucide-react";
import { authAPI } from "../../services/auth";
import { getApiErrorMessage } from "../../utils/errors";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.message);
      if (response.reset_token) {
        navigate(`/reset-password/${response.reset_token}`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate reset link."));
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
            <span className="text-2xl font-semibold text-gray-900">petty</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-gray-600">Enter your email and we'll send you a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg border">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">{message}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
