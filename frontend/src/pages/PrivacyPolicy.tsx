import { Link } from "react-router";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Back to sign up
        </Link>
        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-gray-600">This page explains what account and activity data petty stores and why.</p>
          </div>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Data we store</h2>
            <p>We store profile details, orders, bookings, pets, and account actions needed to provide the service.</p>
          </section>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">How we use data</h2>
            <p>We use account data to authenticate users, show purchased items and bookings, and send service notifications when enabled.</p>
          </section>
          <section className="space-y-2 text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p>For privacy requests, email support@petcare.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
