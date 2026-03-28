"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmCancelContent() {
  const router = useRouter();
  const params = useSearchParams();

  const id = params.get("id") ?? "";
  const merchant = params.get("merchant") ?? "Unknown";
  const amount = params.get("amount") ?? "0";
  const plan = params.get("plan") ?? "";
  const seats = params.get("seats") ?? "";

  function handleConfirm() {
    const receiptParams = new URLSearchParams({ id, merchant, amount });
    router.push(`/demo/receipt?${receiptParams.toString()}`);
  }

  function handleBack() {
    router.push("/demo/subscriptions");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cancel subscription?
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            This action will take effect immediately.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-8 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold text-gray-900">{merchant}</span>
          </div>
          {plan && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold text-gray-900">{plan}</span>
            </div>
          )}
          {seats && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seats</span>
              <span className="font-semibold text-gray-900">{seats}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-500">Monthly charge stopped</span>
            <span className="font-bold text-red-600">${amount}/mo</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go back
          </button>
          <button
            data-action="confirm"
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel subscription
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmCancel() {
  return (
    <Suspense>
      <ConfirmCancelContent />
    </Suspense>
  );
}
