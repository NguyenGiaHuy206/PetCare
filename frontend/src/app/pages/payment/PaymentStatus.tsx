import { Link, useParams, useSearchParams } from "react-router";
import { CheckCircle, XCircle, Clock, Home, Receipt } from "lucide-react";

export default function PaymentStatus() {
  const { status } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          title: 'Payment Successful!',
          message: 'Your order has been confirmed and will be processed shortly.',
          orderId: sessionId ? `Session ${sessionId.slice(0, 8)}` : null,
        };
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          title: 'Payment Pending',
          message: 'Your payment is being processed. You will receive a confirmation email once completed.',
          orderId: 'ORD-2026-006',
        };
      case 'failed':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          title: 'Payment Failed',
          message: 'There was an issue processing your payment. Please try again or use a different payment method.',
          orderId: null,
        };
      default:
        return {
          icon: XCircle,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          title: 'Unknown Status',
          message: 'Unable to determine payment status.',
          orderId: null,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${config.bgColor} rounded-full mb-6`}>
            <Icon className={`w-10 h-10 ${config.iconColor}`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{config.title}</h1>
          <p className="text-gray-600 mb-6">{config.message}</p>

          {config.orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-lg font-semibold text-gray-900">{config.orderId}</p>
            </div>
          )}

          <div className="space-y-3">
            {status === 'success' && config.orderId && (
              <Link
                to="/orders"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Receipt className="w-5 h-5" />
                View Orders
              </Link>
            )}

            {status === 'failed' && (
              <Link
                to="/checkout"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </Link>
            )}

            <Link
              to="/"
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>

          {status === 'success' && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
