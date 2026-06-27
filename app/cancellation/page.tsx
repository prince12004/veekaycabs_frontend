"use client";
import PageLayout from "@/components/layout/PageLayout";
import { RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";

const refundTiers = [
  { time: "24+ hours before pickup", refund: "100%", color: "#10B981", bg: "#D1FAE5", icon: "✅" },
  { time: "12–24 hours before pickup", refund: "75%", color: "#F59E0B", bg: "#FEF3C7", icon: "⚠️" },
  { time: "6–12 hours before pickup", refund: "50%", color: "#F59E0B", bg: "#FEF3C7", icon: "⚠️" },
  { time: "Less than 6 hours before pickup", refund: "No Refund", color: "#EF4444", bg: "#FEE2E2", icon: "❌" },
  { time: "No-show (didn't arrive)", refund: "No Refund", color: "#EF4444", bg: "#FEE2E2", icon: "❌" },
];

export default function CancellationPage() {
  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <RefreshCw size={14} />
            Policy
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white font-syne mb-4">Cancellation & Refund</h1>
          <p className="text-white/60 text-lg">Last updated: June 1, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* Refund Table */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <div className="bg-[#E8540A] px-8 py-5">
            <h2 className="text-xl font-bold text-white font-syne">Token Amount Refund Policy</h2>
            <p className="text-white/80 text-sm mt-1">Based on time before scheduled pickup</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-[#9090A8]">Cancellation Time</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-[#9090A8]">Refund</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-[#9090A8]">Status</th>
                </tr>
              </thead>
              <tbody>
                {refundTiers.map((tier, i) => (
                  <tr key={i} className="border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors">
                    <td className="px-8 py-5 text-[#0F0F1A] font-medium">{tier.time}</td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-xl" style={{ color: tier.color }}>{tier.refund}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xl">{tier.icon}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Deposit */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h2 className="text-xl font-bold text-[#0F0F1A] mb-6 font-syne flex items-center gap-3">
            <span className="w-2 h-6 bg-[#E8540A] rounded-full" />
            Security Deposit (Rs. 10,000)
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#D1FAE5] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-[#065F46]" />
                <span className="font-bold text-[#065F46]">Full Refund (within 7 days)</span>
              </div>
              <ul className="text-[#065F46] text-sm space-y-1">
                <li>• No damage to vehicle</li>
                <li>• No traffic violations</li>
                <li>• Vehicle returned on time</li>
                <li>• Full fuel tank on return</li>
                <li>• No outstanding dues</li>
              </ul>
            </div>
            <div className="bg-[#FEE2E2] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-[#991B1B]" />
                <span className="font-bold text-[#991B1B]">Deductions Applied For</span>
              </div>
              <ul className="text-[#991B1B] text-sm space-y-1">
                <li>• Vehicle damage repair costs</li>
                <li>• Missing fuel charges</li>
                <li>• Extra KM charges</li>
                <li>• Traffic challans</li>
                <li>• Late return charges</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Cancel */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h2 className="text-xl font-bold text-[#0F0F1A] mb-6 font-syne flex items-center gap-3">
            <span className="w-2 h-6 bg-[#E8540A] rounded-full" />
            How to Cancel
          </h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Log into your account", desc: "Go to veekaycabs.com and login with your mobile number" },
              { step: "2", title: "Go to My Bookings", desc: "Find your upcoming booking in the Booking History section" },
              { step: "3", title: "Click Cancel Booking", desc: "Select a cancellation reason and confirm" },
              { step: "4", title: "Refund Processing", desc: "Refund is processed to the original payment method within 5–7 business days" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E8540A] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-[#0F0F1A]">{item.title}</p>
                  <p className="text-[#4A4A6A] text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-[#DBEAFE] border border-blue-200 rounded-2xl p-6 flex gap-4">
          <Info size={20} className="text-[#1E40AF] shrink-0 mt-0.5" />
          <p className="text-[#1E40AF] text-sm">
            Cancellations by Veekay Cabs (due to vehicle unavailability or force majeure) will result in a 100% refund of all amounts paid, including the token amount and security deposit, processed within 3 business days.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
