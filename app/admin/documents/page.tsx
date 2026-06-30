"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, X, Eye, ChevronDown, Shield, ExternalLink, Loader2, AlertTriangle, Phone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminDocumentsApi } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type DocStatus = "not_uploaded" | "pending" | "verified" | "rejected" | "mismatch" | "expired";
type DocType = "aadhaar" | "pan" | "dl";

interface DocRecord {
  _id: string;
  userId: { _id: string; name: string; mobile: string; email: string; kycStatus: string };
  aadhaar: { number?: string; front?: string; back?: string; status: DocStatus; rejectedReason?: string };
  pan:     { number?: string; photo?: string; status: DocStatus; rejectedReason?: string };
  dl:      { number?: string; front?: string; back?: string; validity?: string; status: DocStatus; rejectedReason?: string };
  updatedAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<DocStatus, { label: string; cls: string }> = {
  not_uploaded: { label: "Not Uploaded", cls: "bg-[#F1F2F7] text-[#9090A8]" },
  pending:      { label: "Pending",      cls: "bg-[#FEF3C7] text-[#92400E]" },
  verified:     { label: "Verified",     cls: "bg-[#D1FAE5] text-[#065F46]" },
  rejected:     { label: "Rejected",     cls: "bg-[#FEE2E2] text-[#991B1B]" },
  mismatch:     { label: "Mismatch",     cls: "bg-[#FEE2E2] text-[#991B1B]" },
  expired:      { label: "Expired",      cls: "bg-[#FEE2E2] text-[#991B1B]" },
};

const docLabel = (doc: DocType) =>
  doc === "dl" ? "Driving Licence" : doc === "pan" ? "PAN Card" : "Aadhaar Card";

// ─── Image / PDF preview helper ───────────────────────────────────────────────
function DocImage({ url, alt }: { url?: string; alt: string }) {
  if (!url) {
    return (
      <div className="bg-[#F8F9FC] rounded-xl border border-[#E4E5EF] h-40 flex flex-col items-center justify-center text-[#9090A8]">
        <span className="text-3xl mb-1">📄</span>
        <p className="text-xs">Not uploaded</p>
      </div>
    );
  }

  // Raw Cloudinary PDFs or URLs ending in .pdf — can't render with <img>
  const isPdf = url.includes('/raw/upload/') || url.toLowerCase().includes('.pdf');

  if (isPdf) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="flex flex-col items-center justify-center h-40 bg-[#F8F9FC] rounded-xl border border-[#E4E5EF] hover:border-[#E8540A] hover:bg-[#FFF3ED] transition-all gap-2 group">
        <span className="text-4xl">📄</span>
        <p className="text-xs font-semibold text-[#4A4A6A] group-hover:text-[#E8540A]">{alt}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8540A]/10 text-[#E8540A] font-bold flex items-center gap-1">
          <Eye size={10} /> View PDF
        </span>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="block relative group rounded-xl overflow-hidden border border-[#E4E5EF] hover:border-[#E8540A] transition-colors">
      <img src={url} alt={alt} className="w-full h-40 object-cover bg-[#F8F9FC]"
        onError={(e) => {
          // If image fails to load (e.g., PDF stored as image), show fallback
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div class="w-full h-40 flex flex-col items-center justify-center bg-[#F8F9FC] gap-2"><span style="font-size:2rem">📄</span><span style="font-size:0.7rem;color:#9090A8">Click to view</span></div>`;
          }
        }}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
        <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [reviewDoc, setReviewDoc] = useState<DocRecord | null>(null);
  const [activeTab, setActiveTab] = useState<DocType>("aadhaar");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Fetch from MongoDB ──────────────────────────────────────────────────────
  const fetchDocs = useCallback((status: string) => {
    setLoading(true);
    adminDocumentsApi.getAll({ status })
      .then(({ data }) => setDocs(data.data || []))
      .catch(() => toast.error("Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDocs(filter); }, [filter, fetchDocs]);

  // ── Filter locally by search ────────────────────────────────────────────────
  const filtered = docs.filter((d) => {
    const name   = d.userId?.name?.toLowerCase() || "";
    const mobile = d.userId?.mobile || "";
    return name.includes(search.toLowerCase()) || mobile.includes(search);
  });

  // ── Verify / Reject ─────────────────────────────────────────────────────────
  const applyDecision = async (status: "verified" | "rejected") => {
    if (!reviewDoc) return;
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setSaving(true);
    try {
      const decision = { status, ...(status === "rejected" ? { reason: rejectionReason } : {}) };
      const { data } = await adminDocumentsApi.review(reviewDoc.userId._id, { [activeTab]: decision });
      // Update local list
      setDocs((prev) => prev.map((d) => d._id === reviewDoc._id ? { ...d, [activeTab]: { ...d[activeTab], status } } : d));
      setReviewDoc((prev) => prev ? { ...prev, [activeTab]: { ...prev[activeTab], status } } : null);
      toast.success(`${docLabel(activeTab)} ${status}`);
      setRejectionReason("");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const pendingCount  = docs.filter((d) => [d.aadhaar, d.pan, d.dl].some((s) => s?.status === "pending")).length;
  const rejectedCount = docs.filter((d) => [d.aadhaar, d.pan, d.dl].some((s) => s?.status === "rejected")).length;

  // ── Joined date format ──────────────────────────────────────────────────────
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-black font-syne text-2xl text-[#0F0F1A]">KYC Document Review</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Verify Aadhaar, PAN & DL — live from database</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-[#FEF3C7] text-[#92400E]">{pendingCount} Pending</span>
          )}
          {rejectedCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-[#FEE2E2] text-[#991B1B]">{rejectedCount} Rejected</span>
          )}
          <button onClick={() => fetchDocs(filter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:bg-[#F8F9FC]">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* API Notice */}


      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 mb-5 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or mobile..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <div className="relative">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] bg-white outline-none">
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="all">All KYC</option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9090A8] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#9090A8]">
            <Loader2 size={20} className="animate-spin" /> Loading from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9090A8]">
            <p className="font-semibold">No documents found</p>
            <p className="text-xs mt-1">Try changing the filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E4E5EF] bg-[#F8F9FC]">
                  {["Customer", "Aadhaar", "PAN Card", "Driving Licence", "Last Updated", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[#9090A8] text-xs font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#F8F9FC] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(d.userId?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F0F1A] text-sm">{d.userId?.name || "—"}</p>
                          <p className="text-[#9090A8] text-xs">{d.userId?.mobile || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {(["aadhaar", "pan", "dl"] as const).map((doc) => {
                      const st: DocStatus = d[doc]?.status || "not_uploaded";
                      return (
                        <td key={doc} className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_CFG[st].cls)}>
                              {STATUS_CFG[st].label}
                            </span>
                            {st === "pending" && (
                              <button onClick={() => { setReviewDoc(d); setActiveTab(doc); setRejectionReason(""); }}
                                className="text-[10px] font-bold text-[#E8540A] hover:underline">
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3.5 text-[#4A4A6A] text-xs">{fmtDate(d.updatedAt)}</td>

                    <td className="px-4 py-3.5">
                      <button onClick={() => { setReviewDoc(d); setActiveTab("aadhaar"); setRejectionReason(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-gradient text-white text-xs font-semibold">
                        <Eye size={12} /> Review KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review Modal ─────────────────────────────────────────────────────── */}
      {reviewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold font-syne text-[#0F0F1A] text-lg">{reviewDoc.userId?.name}</h3>
                <p className="text-xs text-[#9090A8]">{reviewDoc.userId?.mobile} · {reviewDoc.userId?.email}</p>
              </div>
              <button onClick={() => setReviewDoc(null)} className="text-[#9090A8] hover:text-[#0F0F1A]">
                <X size={20} />
              </button>
            </div>

            {/* Doc Tabs */}
            <div className="flex gap-1 bg-[#F8F9FC] p-1 rounded-xl mb-5">
              {(["aadhaar", "pan", "dl"] as const).map((doc) => {
                const st: DocStatus = reviewDoc[doc]?.status || "not_uploaded";
                return (
                  <button key={doc} onClick={() => { setActiveTab(doc); setRejectionReason(""); }}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative", activeTab === doc ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#9090A8]")}>
                    {doc === "dl" ? "DL" : doc === "pan" ? "PAN" : "Aadhaar"}
                    <span className={cn("absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                      st === "verified" ? "bg-[#10B981]" : st === "pending" ? "bg-[#F59E0B]" : st === "rejected" ? "bg-[#EF4444]" : "bg-[#D1D5DB]"
                    )} />
                  </button>
                );
              })}
            </div>

            {/* Doc Number */}
            {activeTab === "aadhaar" && reviewDoc.aadhaar?.number && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">Aadhaar No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewDoc.aadhaar.number}</span>
              </div>
            )}
            {activeTab === "pan" && reviewDoc.pan?.number && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">PAN No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewDoc.pan.number}</span>
              </div>
            )}
            {activeTab === "dl" && reviewDoc.dl?.number && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">DL No.</span>
                <span className="font-mono text-sm font-bold text-[#0F0F1A]">{reviewDoc.dl.number}</span>
              </div>
            )}
            {activeTab === "dl" && reviewDoc.dl?.validity && (
              <div className="mb-3 bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#9090A8]">Valid Till</span>
                <span className="text-sm font-bold text-[#0F0F1A]">
                  {new Date(reviewDoc.dl.validity).toLocaleDateString("en-IN")}
                </span>
              </div>
            )}

            {/* Actual Document Images from Cloudinary */}
            <div className="mb-4">
              {activeTab === "aadhaar" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs font-semibold text-[#4A4A6A] mb-1.5">Front</p><DocImage url={reviewDoc.aadhaar?.front} alt="Aadhaar Front" /></div>
                  <div><p className="text-xs font-semibold text-[#4A4A6A] mb-1.5">Back</p><DocImage url={reviewDoc.aadhaar?.back} alt="Aadhaar Back" /></div>
                </div>
              )}
              {activeTab === "pan" && (
                <div><p className="text-xs font-semibold text-[#4A4A6A] mb-1.5">PAN Card</p><DocImage url={reviewDoc.pan?.photo} alt="PAN Card" /></div>
              )}
              {activeTab === "dl" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs font-semibold text-[#4A4A6A] mb-1.5">Front</p><DocImage url={reviewDoc.dl?.front} alt="DL Front" /></div>
                  <div><p className="text-xs font-semibold text-[#4A4A6A] mb-1.5">Back</p><DocImage url={reviewDoc.dl?.back} alt="DL Back" /></div>
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#4A4A6A] text-sm">Status:</span>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_CFG[reviewDoc[activeTab]?.status || "not_uploaded"].cls)}>
                {STATUS_CFG[reviewDoc[activeTab]?.status || "not_uploaded"].label}
              </span>
              {reviewDoc[activeTab]?.rejectedReason && (
                <span className="text-xs text-[#EF4444]">— {reviewDoc[activeTab].rejectedReason}</span>
              )}
            </div>

            {/* Rejection Reason */}
            {reviewDoc[activeTab]?.status !== "verified" && (
              <div className="mb-4">
                <label className="text-[#4A4A6A] text-xs font-semibold mb-1.5 block">
                  Rejection Reason {reviewDoc[activeTab]?.status !== "rejected" ? "(required only to reject)" : ""}
                </label>
                <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Document not clear, expired, name mismatch..."
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-2">
              <button onClick={() => applyDecision("verified")} disabled={saving || reviewDoc[activeTab]?.status === "verified"}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D1FAE5] text-[#065F46] font-bold text-sm hover:bg-[#A7F3D0] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Verify
              </button>
              <button onClick={() => applyDecision("rejected")} disabled={saving || !rejectionReason.trim() || reviewDoc[activeTab]?.status === "rejected"}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FEE2E2] text-[#991B1B] font-bold text-sm hover:bg-[#FECACA] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Reject
              </button>
            </div>
            <a href={`https://wa.me/${(reviewDoc.userId?.mobile || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm">
              <Phone size={14} /> Contact on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
