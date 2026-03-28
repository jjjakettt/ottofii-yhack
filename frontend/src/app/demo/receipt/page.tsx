"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function generateConfirmationId(merchant: string, id: string): string {
  const prefix = merchant.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const suffix = id.slice(-4).toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`;
}

function ReceiptContent() {
  const params = useSearchParams();
  const merchant = params.get("merchant") ?? "Unknown";
  const amount = params.get("amount") ?? "0";
  const id = params.get("id") ?? "demo";

  const [confirmationId] = useState(() =>
    generateConfirmationId(merchant, id)
  );
  const [timestamp] = useState(() => new Date().toISOString());

  // Expose confirmation ID to Playwright via data attribute — do not remove
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Subscription cancelled
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your cancellation has been confirmed.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-8 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold text-gray-900">{merchant}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Savings</span>
            <span className="font-bold text-emerald-600">${amount}/mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cancelled at</span>
            <span className="font-medium text-gray-900">
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Confirmation ID</span>
              {/* data-field="confirmation_id" — Playwright reads this */}
              <span
                data-field="confirmation_id"
                className="font-mono font-bold text-gray-900 text-xs tracking-wide"
              >
                {confirmationId}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400">
          A confirmation email has been sent to demo@acmecorp.com
        </p>
      </div>
    </div>
  );
}

export default function Receipt() {
  return (
    <Suspense>
      <ReceiptContent />
    </Suspense>
  );
}
