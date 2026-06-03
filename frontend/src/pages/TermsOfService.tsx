import { Link } from "react-router";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Back to sign up
        </Link>
        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-gray-600">This page summarizes the terms that apply to petty accounts and services.</p>
          </div>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Account usage</h2>
            <p>Users are responsible for keeping account credentials secure and for actions taken under their account.</p>
          </section>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Orders and bookings</h2>
            <p>Orders, bookings, and service requests are subject to availability, pricing changes, and cancellation rules displayed in the app.</p>
          </section>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p>For questions about these terms, contact support@petcare.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
