"use client";

import { useRouter } from "next/navigation";

// Matches the merchants in seed_data.py (excluding protected Slack)
const SUBSCRIPTIONS = [
  {
    id: "stream_001",
    merchant: "Notion",
    plan: "Team Plan",
    seats: 16,
    amount: 320,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_002",
    merchant: "Figma",
    plan: "Professional",
    seats: 10,
    amount: 180,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_003",
    merchant: "Zoom",
    plan: "Business",
    seats: 20,
    amount: 240,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_004",
    merchant: "Adobe Creative Cloud",
    plan: "All Apps",
    seats: 8,
    amount: 600,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_007",
    merchant: "Asana",
    plan: "Business",
    seats: 14,
    amount: 280,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_008",
    merchant: "Dropbox",
    plan: "Business Plus",
    seats: 10,
    amount: 150,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_009",
    merchant: "Webflow",
    plan: "CMS Plan",
    seats: 1,
    amount: 75,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_012",
    merchant: "Loom",
    plan: "Business",
    seats: 12,
    amount: 120,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_005",
    merchant: "AWS",
    plan: "Dev Environment",
    seats: null,
    amount: 890,
    cadence: "monthly",
    status: "Active",
  },
  {
    id: "stream_011",
    merchant: "Heroku",
    plan: "Staging",
    seats: null,
    amount: 340,
    cadence: "monthly",
    status: "Active",
  },
];

export default function DemoSubscriptions() {
  const router = useRouter();

  function handleCancel(sub: (typeof SUBSCRIPTIONS)[0]) {
    const params = new URLSearchParams({
      id: sub.id,
      merchant: sub.merchant,
      amount: sub.amount.toString(),
      plan: sub.plan,
      seats: sub.seats?.toString() ?? "",
    });
    router.push(`/demo/confirm-cancel?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Demo Vendor Portal
            </p>
            <h1 className="text-xl font-bold text-gray-900">
              Subscription Management
            </h1>
          </div>
          <span className="text-sm text-gray-500">demo@acmecorp.com</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-6">
          {SUBSCRIPTIONS.length} active subscriptions
        </p>

        <div className="space-y-3">
          {SUBSCRIPTIONS.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-600">
                    {sub.merchant[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{sub.merchant}</p>
                  <p className="text-sm text-gray-500">
                    {sub.plan}{sub.seats != null ? ` · ${sub.seats} seats` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${sub.amount}/mo
                  </p>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    {sub.status}
                  </span>
                </div>
                <button
                  data-subscription-id={sub.id}
                  data-merchant={sub.merchant.toLowerCase()}
                  data-action="cancel"
                  onClick={() => handleCancel(sub)}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
