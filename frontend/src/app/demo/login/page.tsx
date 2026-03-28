"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function DemoLogin() {
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Any credentials work — this is a demo portal
    router.push("/demo/subscriptions");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Demo Vendor Portal
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your subscriptions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue="demo@acmecorp.com"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              defaultValue="demo1234"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Any credentials work — this is a demo environment
        </p>
      </div>
    </div>
  );
}
