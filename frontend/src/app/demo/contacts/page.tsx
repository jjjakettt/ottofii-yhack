"use client";

import { Phone, User } from "lucide-react";

const VENDOR_CONTACTS = [
  {
    vendor: "Heroku",
    plan: "Staging — $340/mo",
    contacts: [
      { name: "Dickson Alexander", phone: "+1 (603) 276-8643", role: "Escalation" },
      { name: "Jake Tran",         phone: "+1 (646) 220-8361", role: "Secondary" },
      { name: "Kasuti Makau",      phone: "+1 (603) 349-0400", role: "Primary" },
      { name: "Lynn Lin",          phone: "+1 (516) 234-8262", role: "Escalation" },
    ],
  },
];

export default function DemoContacts() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Demo Vendor Portal
          </p>
          <h1 className="text-xl font-bold text-gray-900">Cancellation Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Support contacts Jamie will call when browser automation is unavailable.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        {VENDOR_CONTACTS.map((vendor) => (
          <div key={vendor.vendor} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <span className="text-lg font-bold text-indigo-600">{vendor.vendor[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{vendor.vendor}</p>
                  <p className="text-sm text-gray-500">{vendor.plan}</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Phone fallback active
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {vendor.contacts.map((contact, i) => (
                <div key={contact.phone} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={
                            i === 0
                              ? "text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded"
                              : "text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                          }
                        >
                          {contact.role}
                        </span>
                        {i === 0 && (
                          <span className="text-xs text-gray-400">Called first</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-mono">{contact.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400">
          Jamie will call contacts in order. Retry logic (secondary → escalation) coming soon.
        </p>
      </main>
    </div>
  );
}
