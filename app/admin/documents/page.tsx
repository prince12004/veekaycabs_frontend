"use client";

import { useState } from "react";
import { Search, CheckCircle, X, Eye, ChevronDown, Shield, ExternalLink, Loader2, AlertTriangle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const KYC_USERS = [
  { id: "1", name: "Rahul Kumar", mobile: "98765 43210", email: "rahul@example.com", aadhaar: "verified", pan: "verified", dl: "pending", joined: "Jan 5, 2026", aadhaarNo: "XXXX XXXX 4321", panNo: "ABCDE1234F", dlNo: "DL-0120110012345" },
  { id: "2", name: "Priya Mehta", mobile: "91234 56789", email: "priya@example.com", aadhaar: "verified", pan: "pending", dl: "not_submitted", joined: "Feb 12, 2026", aadhaarNo: "XXXX XXXX 6789", panNo: "", dlNo: "" },
  { id: "3", name: "Vikram Joshi", mobile: "88776 65544", email: "vikram@example.com", aadhaar: "pending", pan: "pending", dl: "pending", joined: "Mar 1, 2026", aadhaarNo: "", panNo: "", dlNo: "" },
  { id: "4", name: "Anjali Singh", mobile: "97654 32100", email: "anjali@example.com", aadhaar: "verified", pan: "verified", dl: "verified", joined: "Mar 18, 2026", aadhaarNo: "XXXX XXXX 2100", panNo: "FGHIJ5678K", dlNo: "UP-14 20200012345" },
  { id: "5", name: "Amit Sharma", mobile: "99887 76655", email: "amit@example.com", aadhaar: "rejected", pan: "not_submitted", dl: "not_submitted", joined: "Apr 3, 2026", aadhaarNo: "XXXX XXXX 6655", panNo: "", dlNo: "" },
  { id: "6", name: "Kavya Nair", mobile: "66554 43322", email: "kavya@example.com", aadhaar: "verified", pan: "verified", dl: "pending", joined: "Apr 20, 2026", aadhaarNo: "XXXX XXXX 3322", panNo: "LMNOP9012Q", dlNo: "" },
];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  verified: { label: "Verified", class: "bg-[#D1FAE5] text-[#065F46]" },
  pending: { label: "Pending", class: "bg-[#FEF3C7] text-[#92400E]" },
  rejected: { label: "Rejected", class: "bg-[#FEE2E2] text-[#991B1B]" },
  not_submitted: { label: "Not Submitted", class: "bg-[#F1F2F7] text-[#9090A8]" },
};

type DocType = "aadhaar" | "pan" | "dl";
type UserRow = (typeof KYC_USERS)[0];

interface ApiVerifyState { loading: boolean; result: null | "success" | "fail"; message: string }

export default function AdminDocumentsPage() {
  const [users, setUsers] = useState(KYC_USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviewUser, setReviewUser] = useState<UserRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocType>("aadhaar");
  const [apiState, setApiState] = useState<ApiVerifyState>({ loading: false, result: null, message: "" });

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search);
    if (filter === "all") return matchSearch;
    if (filter === "pending") return matchSearch && [u.aadhaar, u.pan, u.dl].some((s) => s === "pending");
    if (filter === "verified") return matchSearch && u.aadhaar === "verified" && u.pan === "verified" && u.dl === "verified";
    if (filter === "rejected") return matchSearch && [u.aadhaar, u.pan, u.dl].some((s) => s === "rejected");
    return matchSearch;
  });

  const handleVerify = (userId: string, doc: DocType) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [doc]: "verified" } : u));
    if (reviewUser?.id === userId) setReviewUser(prev => prev ? { ...prev, [doc]: "verified" } : null);
  };

  const handleReject = (userId: string, doc: DocType) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [doc]: "rejected" } : u));
    if (reviewUser?.id === userId) setReviewUser(prev => prev ? { ...prev, [doc]: "rejected" } : null);
  };

  const handleApiVerify = (docType: DocType) => {
    setApiState({ loading: true, result: null, message: "" });
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success && reviewUser) {
        handleVerify(reviewUser.id, docType);
        setApiState({ loading: false, result: "success", message: `${docType.toUpperCase()} verified successfully via DigiLocker API!` });
      } else {
        setApiState({ loading: false, result: "fail", message: "API verification failed. Please verify manually." });
      }
    }, 2000);
  };

  const docLabel = (doc: DocType) => doc === "dl" ? "Driving Licence" : doc === "pan" ? "PAN Card" : "Aadhaar Card";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">KYC Document Review</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Verify Aadhaar, PAN & DL via 3rd party API or manually</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {[
            { status: "pending", count: users.filter((u) => [u.aadhaar, u.pan, u.dl].some((s) => s === "pending")).length, color: "bg-[#FEF3C7] text-[#92400E]" },
            { status: "rejected", count: users.filter((u) => [u.aadhaar, u.pan, u.dl].some((s) => s === "rejected")).length, color: "bg-[#FEE2E2] text-[#991B1B]" },
          ].map(({ status, count, color }) => (
            <span key={status} className={cn("px-3 py-1.5 rounded-lg font-semibold text-xs capitalize", color)}>
              {count} {status}
            </span>
          ))}
        </div>
      </div>

      {/* API Integration Notice */}
      <div className="mb-5 bg-gradient-to-r from-[#EDE9FE] to-[#DDD6FE] border border-[#7C3AED]/20 rounded-2xl p-4 flex items-center gap-3">
        <Shield size={18} className="text-[#7C3AED] shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-[#4C1D95] text-sm">3rd Party API Verification Enabled</p>
          <p className="text-xs text-[#6D28D9] mt-0.5">Aadhaar (via DigiLocker / Karza), PAN (via Quicko / Surepass), DL (via Vahan API) — Configure API keys in server .env</p>
        </div>
        <a href="https://digilocker.gov.in/public/oauth2" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[#7C3AED] font-bold whitespace-nowrap hover:underline">
          API Docs <ExternalLink size={10} />
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 mb-5 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or mobile..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <div className="relative">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] bg-white outline-none">
            <option value="all">All KYC</option>
            <option value="pending">Has Pending</option>
            <option value="verified">Fully Verified</option>
            <option value="rejected">Has Rejected</option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9090A8] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E4E5EF] bg-[#F8F9FC]">
                {["Customer", "Aadhaar", "PAN Card", "Driving Licence", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#9090A8] text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#F8F9FC] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F0F1A] text-sm">{u.name}</p>
                        <p className="text-[#9090A8] text-xs">{u.mobile}</p>
                      </div>
                    </div>
                  </td>
                  {(["aadhaar", "pan", "dl"] as const).map((doc) => (
                    <td key={doc} className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_CONFIG[u[doc]].class)}>
                          {STATUS_CONFIG[u[doc]].label}
                        </span>
                        {u[doc] === "pending" && (
                          <button onClick={() => { setReviewUser(u); setActiveDoc(doc); setRejectionReason(""); setApiState({ loading: false, result: null, message: "" }); }}
                            className="text-[10px] font-bold text-[#E8540A] hover:underline">Review</button>
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-[#4A4A6A] text-xs">{u.joined}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => { setReviewUser(u); setActiveDoc("aadhaar"); setRejectionReason(""); setApiState({ loading: false, result: null, message: "" }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-gradient text-white text-xs font-semibold"
                    >
                      <Eye size={12} /> Review KYC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">{reviewUser.name}</h3>
                <p className="text-xs text-[#9090A8]">{reviewUser.mobile} · {reviewUser.email}</p>
              </div>
              <button onClick={() => { setReviewUser(null); setApiState({ loading: false, result: null, message: "" }); }} className="text-[#9090A8] hover:text-[#0F0F1A]">
                <X size={20} />
              </button>
            </div>

            {/* Doc Tabs */}
            <div className="flex gap-1 bg-[#F8F9FC] p-1 rounded-xl mb-5">
              {(["aadhaar", "pan", "dl"] as const).map((doc) => (
                <button key={doc} onClick={() => { setActiveDoc(doc); setApiState({ loading: false, result: null, message: "" }); }}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative", activeDoc === doc ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#9090A8]")}>
                  {doc === "dl" ? "DL" : doc === "pan" ? "PAN" : "Aadhaar"}
                  <span className={cn("absolute top-1 right-1 w-1.5 h-1.5 rounded-full", reviewUser[doc] === "verified" ? "bg-[#10B981]" : reviewUser[doc] === "pending" ? "bg-[#F59E0B]" : reviewUser[doc] === "rejected" ? "bg-[#EF4444]" : "bg-[#9090A8]")} />
                </button>
              ))}
            </div>

            {/* Document Number */}
            {activeDoc === "aadhaar" && reviewUser.aadhaarNo && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">Aadhaar No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewUser.aadhaarNo}</span>
              </div>
            )}
            {activeDoc === "pan" && reviewUser.panNo && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">PAN No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewUser.panNo}</span>
              </div>
            )}
            {activeDoc === "dl" && reviewUser.dlNo && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">DL No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewUser.dlNo}</span>
              </div>
            )}

            {/* Document Preview */}
            <div className="bg-[#F8F9FC] rounded-xl border border-[#E4E5EF] h-36 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-[#9090A8] text-sm">{docLabel(activeDoc)} — {reviewUser.name}</p>
                <p className="text-[#9090A8] text-xs mt-0.5">Document image would appear here</p>
              </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#4A4A6A] text-sm">Status:</span>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_CONFIG[reviewUser[activeDoc]].class)}>
                {STATUS_CONFIG[reviewUser[activeDoc]].label}
              </span>
            </div>

            {/* 3rd Party API Verification */}
            <div className="mb-4 border border-[#7C3AED]/20 bg-[#F5F3FF] rounded-xl p-4">
              <p className="text-xs font-bold text-[#4C1D95] mb-2 flex items-center gap-1.5"><Shield size={12} /> 3rd Party API Verification</p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-[#6D28D9]">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-bold">Aadhaar</p>
                  <p className="text-[10px] mt-0.5">DigiLocker / Karza</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-bold">PAN</p>
                  <p className="text-[10px] mt-0.5">Quicko / Surepass</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-bold">DL</p>
                  <p className="text-[10px] mt-0.5">Vahan API</p>
                </div>
              </div>
              <button
                onClick={() => handleApiVerify(activeDoc)}
                disabled={apiState.loading || reviewUser[activeDoc] === "verified"}
                className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all", reviewUser[activeDoc] === "verified" ? "bg-[#D1FAE5] text-[#065F46] cursor-not-allowed" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]")}
              >
                {apiState.loading ? <><Loader2 size={14} className="animate-spin" /> Verifying via API...</> : reviewUser[activeDoc] === "verified" ? <><CheckCircle size={14} /> Already Verified</> : <><Shield size={14} /> Verify {docLabel(activeDoc)} via API</>}
              </button>
              {apiState.result && (
                <div className={cn("mt-2 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5", apiState.result === "success" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]")}>
                  {apiState.result === "success" ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  {apiState.message}
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {reviewUser[activeDoc] !== "verified" && (
              <div className="mb-5">
                <label className="text-[#4A4A6A] text-xs font-semibold mb-1.5 block">Rejection Reason (required to reject)</label>
                <input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Document not clear, expired, mismatched name..."
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
            )}

            {/* Manual Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { handleVerify(reviewUser.id, activeDoc); setReviewUser(null); }}
                disabled={reviewUser[activeDoc] === "verified"}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D1FAE5] text-[#065F46] font-bold text-sm hover:bg-[#A7F3D0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={15} /> Verify Manually
              </button>
              <button
                disabled={!rejectionReason || reviewUser[activeDoc] === "rejected"}
                onClick={() => { handleReject(reviewUser.id, activeDoc); setReviewUser(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FEE2E2] text-[#991B1B] font-bold text-sm hover:bg-[#FECACA] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={15} /> Reject
              </button>
            </div>
            <a href={`https://wa.me/${reviewUser.mobile.replace(/\s/g, "")}`} target="_blank" rel="noreferrer"
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm">
              <Phone size={14} /> Contact Customer on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
