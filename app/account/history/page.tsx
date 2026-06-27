"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, RefreshCw, AlertTriangle, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";

const TABS = ["Upcoming", "Active", "Completed", "Cancelled"] as const;
type TabType = (typeof TABS)[number];

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-[#DBEAFE] text-[#1E40AF]",
  active: "bg-[#D1FAE5] text-[#065F46]",
  completed: "bg-[#D1FAE5] text-[#065F46]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
};

const BOOKINGS = [
  {
    id: "VK20260015",
    car: "Hyundai Creta",
    emoji: "🚘",
    type: "SUV",
    start: "Jun 20, 2026 10:00 AM",
    end: "Jun 22, 2026 10:00 AM",
    duration: "2 days",
    status: "upcoming" as const,
    totalAmount: 12450,
    paidAmount: 1000,
    balance: 11450,
    city: "Delhi",
  },
  {
    id: "VK20260012",
    car: "Kia Seltos",
    emoji: "🏎️",
    type: "SUV",
    start: "Jun 10, 2026 9:00 AM",
    end: "Jun 11, 2026 9:00 AM",
    duration: "1 day",
    status: "active" as const,
    totalAmount: 4200,
    paidAmount: 1000,
    balance: 3200,
    city: "Noida",
  },
  {
    id: "VK20260009",
    car: "Maruti Swift",
    emoji: "🚙",
    type: "Hatchback",
    start: "May 28, 2026 10:00 AM",
    end: "May 30, 2026 10:00 AM",
    duration: "2 days",
    status: "completed" as const,
    totalAmount: 4990,
    paidAmount: 4990,
    balance: 0,
    city: "Delhi",
  },
  {
    id: "VK20260004",
    car: "Honda City",
    emoji: "🚖",
    type: "Sedan",
    start: "May 5, 2026 8:00 AM",
    end: "May 5, 2026 8:00 PM",
    duration: "12 hrs",
    status: "cancelled" as const,
    totalAmount: 2100,
    paidAmount: 0,
    balance: 0,
    city: "Gurgaon",
  },
];

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Upcoming");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = BOOKINGS.filter((b) => {
    const tabToStatus: Record<TabType, string> = {
      Upcoming: "upcoming",
      Active: "active",
      Completed: "completed",
      Cancelled: "cancelled",
    };
    return b.status === tabToStatus[activeTab];
  });

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F8F9FC] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-black font-syne text-3xl text-[#0F0F1A]">Booking History</h1>
            <p className="text-[#9090A8] text-sm mt-1">Track all your past and upcoming trips</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-[#E4E5EF] mb-6 shadow-sm">
            {TABS.map((tab) => {
              const count = BOOKINGS.filter((b) => {
                const m: Record<TabType, string> = { Upcoming: "upcoming", Active: "active", Completed: "completed", Cancelled: "cancelled" };
                return b.status === m[tab];
              }).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === tab
                      ? "bg-[#E8540A] text-white shadow-sm"
                      : "text-[#9090A8] hover:text-[#4A4A6A]"
                  )}
                >
                  {tab}
                  {count > 0 && (
                    <span className={cn(
                      "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                      activeTab === tab ? "bg-white/30" : "bg-[#E4E5EF]"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E4E5EF] p-12 text-center">
                <div className="text-5xl mb-3">📋</div>
                <p className="font-semibold text-[#0F0F1A] mb-1">No {activeTab} Bookings</p>
                <p className="text-[#9090A8] text-sm">
                  {activeTab === "Upcoming" ? "Book a car to see your upcoming trips here." : `Your ${activeTab.toLowerCase()} bookings will appear here.`}
                </p>
                {activeTab === "Upcoming" && (
                  <Link href="/book" className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm mt-4">
                    Book a Car
                  </Link>
                )}
              </div>
            ) : (
              filtered.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-[#E4E5EF] shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all"
                >
                  <div className="flex">
                    {/* Orange accent bar */}
                    <div className="w-1 bg-[#E8540A] shrink-0" />

                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Car Image + Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#1C1C2E] to-[#242438] rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-3xl">{booking.emoji}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-[#0F0F1A] font-syne">{booking.car}</h3>
                              <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full capitalize", STATUS_STYLES[booking.status])}>
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-[#9090A8] text-xs">
                              #{booking.id} &bull; {booking.type} &bull; {booking.city}
                            </p>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="text-right shrink-0">
                          <p className="text-[#0F0F1A] font-bold text-base">Rs. {booking.totalAmount.toLocaleString("en-IN")}</p>
                          <p className="text-[#10B981] text-xs font-semibold">Paid: Rs. {booking.paidAmount.toLocaleString("en-IN")}</p>
                          {booking.balance > 0 && (
                            <p className="text-[#E8540A] text-xs font-semibold">Due: Rs. {booking.balance.toLocaleString("en-IN")}</p>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-3 my-3 py-3 border-y border-[#E4E5EF]">
                        <div className="text-xs text-[#4A4A6A]">
                          <span className="font-semibold text-[#0F0F1A]">{booking.start}</span>
                          <span className="mx-2 text-[#9090A8]">→</span>
                          <span className="font-semibold text-[#0F0F1A]">{booking.end}</span>
                        </div>
                        <span className="bg-[#FFF3ED] text-[#E8540A] text-xs font-bold px-2.5 py-1 rounded-full ml-auto shrink-0">
                          {booking.duration}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-[#E8540A]/50 hover:text-[#E8540A] transition-all">
                          <FileText size={12} />
                          Bill
                        </button>
                        {booking.status !== "cancelled" && booking.status !== "completed" && (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-[#6366F1]/50 hover:text-[#6366F1] transition-all">
                            <RefreshCw size={12} />
                            Extend
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-[#4A4A6A] text-xs font-semibold hover:border-red-300 hover:text-red-500 transition-all">
                            <AlertTriangle size={12} />
                            Report Issue
                          </button>
                        )}
                        {booking.status === "upcoming" && (
                          <button
                            onClick={() => setCancelId(booking.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold hover:bg-red-200 transition-all"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold font-syne text-[#0F0F1A] text-lg mb-2">Cancel Booking?</h3>
            <p className="text-[#4A4A6A] text-sm mb-5">
              Are you sure you want to cancel booking <strong>#{cancelId}</strong>? Refund will be processed as per our cancellation policy.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm"
              >
                Keep Booking
              </button>
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
