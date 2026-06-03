import { Link } from "react-router";

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="mt-2 text-gray-600">Find quick help for accounts, orders, bookings, and technical issues.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Need help now?</h2>
            <p className="mt-2 text-sm text-gray-600">Email support@petcare.com and include your account email plus a screenshot if possible.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Common topics</h2>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li>Account login and password reset</li>
              <li>Orders, checkout, and payment status</li>
              <li>Service booking changes</li>
              <li>Profile and pet information updates</li>
            </ul>
          </div>
        </div>

        <Link to="/" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Back to home
        </Link>
      </div>
    </div>
  );
}
