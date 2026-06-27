"use client";

import { useState } from "react";
import { Search, Shield, ShieldOff, Eye, Users, CheckCircle, Clock, XCircle } from "lucide-react";

const USERS = [
  { id: "1", name: "Prince Kumar", mobile: "+91 99999 26867", email: "prince@example.com", kyc: "verified", bookings: 12, joined: "Jan 15, 2026", blocked: false },
  { id: "2", name: "Rahul Sharma", mobile: "+91 98765 43210", email: "rahul@example.com", kyc: "pending", bookings: 3, joined: "Feb 20, 2026", blocked: false },
  { id: "3", name: "Priya Mehta", mobile: "+91 87654 32109", email: "priya@example.com", kyc: "not_submitted", bookings: 1, joined: "Mar 5, 2026", blocked: false },
  { id: "4", name: "Vikram Joshi", mobile: "+91 76543 21098", email: "vikram@example.com", kyc: "verified", bookings: 8, joined: "Dec 10, 2025", blocked: true },
  { id: "5", name: "Anju Singh", mobile: "+91 65432 10987", email: "anju@example.com", kyc: "rejected", bookings: 0, joined: "Apr 1, 2026", blocked: false },
  { id: "6", name: "Suresh Gupta", mobile: "+91 54321 09876", email: "suresh@example.com", kyc: "verified", bookings: 22, joined: "Oct 5, 2025", blocked: false },
];

const kycColors: Record<string, { bg: string; text: string; label: string }> = {
  verified: { bg: "#D1FAE5", text: "#065F46", label: "Verified" },
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  not_submitted: { bg: "#F1F2F7", text: "#4A4A6A", label: "Not Submitted" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState(USERS);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("All");

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search);
    const matchKyc = kycFilter === "All" || u.kyc === kycFilter.toLowerCase().replace(" ", "_");
    return matchSearch && matchKyc;
  });

  const toggleBlock = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, blocked: !u.blocked } : u));
  };

  const kycVerified = USERS.filter(u => u.kyc === "verified").length;
  const kycPending = USERS.filter(u => u.kyc === "pending").length;
  const kycRejected = USERS.filter(u => u.kyc === "rejected").length;
  const blocked = USERS.filter(u => u.blocked).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Users</h1>
        <p className="text-[#9090A8] text-sm">{USERS.length} registered users · {kycVerified} KYC verified</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: USERS.length, color: "#E8540A", bg: "#FFF3ED", icon: Users },
          { label: "KYC Verified", value: kycVerified, color: "#10B981", bg: "#D1FAE5", icon: CheckCircle },
          { label: "KYC Pending", value: kycPending, color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
          { label: "KYC Rejected", value: kycRejected, color: "#EF4444", bg: "#FEE2E2", icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A] font-syne leading-none">{value}</p>
              <p className="text-[#9090A8] text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or mobile..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "Verified", "Pending", "Rejected", "Not Submitted"].map(k => <option key={k}>{k}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["User", "Mobile", "KYC Status", "Bookings", "Joined", "Account", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const kyc = kycColors[user.kyc];
                return (
                  <tr key={user.id} className={`border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors ${i % 2 === 1 ? "bg-[#F8F9FC]/50" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm">
                          {user.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F0F1A] text-sm">{user.name}</p>
                          <p className="text-[#9090A8] text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#4A4A6A]">{user.mobile}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: kyc.bg, color: kyc.text }}>{kyc.label}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#0F0F1A] text-sm">{user.bookings}</td>
                    <td className="px-5 py-4 text-[#4A4A6A] text-sm">{user.joined}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.blocked ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065F46]"}`}>
                        {user.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => toggleBlock(user.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${user.blocked ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#10B981] hover:text-white" : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white"}`}
                        >
                          {user.blocked ? <Shield size={14} /> : <ShieldOff size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
