"use client";

import { useState, useEffect } from "react";
import { Search, Phone, Mail, Trash2, MessageSquare, Send, ChevronLeft, ChevronRight, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminContactsAPI } from "@/lib/api";

interface ContactRequest {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  type?: string;
  status: "new" | "contacted" | "resolved";
  adminNotes?: string;
  createdAt: string;
}

interface ReplyModal {
  _id: string;
  name: string;
  email: string;
  mobile: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [replyTo, setReplyTo] = useState<ReplyModal | null>(null);
  const [replyText, setReplyText] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchContacts = async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pg, limit: 10 };
      if (filter === "Pending") params.status = "new";
      if (filter === "Replied") params.status = "contacted";
      if (filter === "Resolved") params.status = "resolved";
      const { data } = await adminContactsAPI.getAll(params);
      setRequests(data?.data || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.pages || 1);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchContacts(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    fetchContacts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const markStatus = async (id: string, status: "contacted" | "resolved") => {
    setUpdating(id);
    try {
      await adminContactsAPI.updateStatus(id, { status });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } finally {
      setUpdating(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminContactsAPI.exportCsv();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = "contact-requests.csv"; a.click();
    } catch {}
  };

  const handleReply = async () => {
    if (!replyTo) return;
    await markStatus(replyTo._id, "contacted");
    setReplyTo(null);
    setReplyText("");
  };

  const filtered = search
    ? requests.filter(r => {
        const s = search.toLowerCase();
        return r.name.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.mobile?.includes(s);
      })
    : requests;

  const pendingCount = requests.filter(r => r.status === "new").length;
  const repliedCount = requests.filter(r => r.status !== "new").length;

  const statusLabel = (status: string) => {
    if (status === "new") return { text: "Pending", cls: "bg-[#FEF3C7] text-[#92400E]" };
    if (status === "contacted") return { text: "Replied", cls: "bg-[#D1FAE5] text-[#065F46]" };
    return { text: "Resolved", cls: "bg-[#E0E7FF] text-[#3730A3]" };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Contact Requests</h1>
          <p className="text-[#9090A8] text-sm">{total} total · {pendingCount} pending reply</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 border-[1.5px] border-[#E8540A] text-[#E8540A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#FFF3ED] transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: total, color: "#3B82F6", bg: "#DBEAFE" },
          { label: "Pending Reply", value: requests.filter(r => r.status === "new").length, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Replied / Resolved", value: requests.filter(r => r.status !== "new").length, color: "#10B981", bg: "#D1FAE5" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <MessageSquare size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F0F1A]">{s.value}</p>
              <p className="text-[#9090A8] text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, mobile..."
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "Pending", "Replied", "Resolved"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors",
                filter === f ? "bg-[#E8540A] text-white" : "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#E4E5EF]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#E8540A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-12 text-center">
          <MessageSquare size={32} className="mx-auto text-[#E4E5EF] mb-3" />
          <p className="text-[#9090A8] text-sm">No contact requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const badge = statusLabel(req.status);
            return (
              <div key={req._id} className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {req.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#0F0F1A]">{req.name}</p>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badge.cls)}>
                            {badge.text}
                          </span>
                          {req.type && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0F1F6] text-[#4A4A6A]">
                              {req.type}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-0.5">
                          {req.email && (
                            <a href={`mailto:${req.email}`} className="flex items-center gap-1 text-xs text-[#4A4A6A] hover:text-[#E8540A]">
                              <Mail size={10} /> {req.email}
                            </a>
                          )}
                          {req.mobile && (
                            <span className="flex items-center gap-1 text-xs text-[#4A4A6A]">
                              <Phone size={10} /> {req.mobile}
                            </span>
                          )}
                          <span className="text-xs text-[#9090A8]">{fmtDate(req.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => { setReplyTo({ _id: req._id, name: req.name, email: req.email, mobile: req.mobile }); setReplyText(""); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8540A] text-white text-xs font-bold hover:bg-[#C94508] transition-colors"
                      >
                        <Send size={11} /> Reply
                      </button>
                      {req.status === "new" && (
                        <button
                          onClick={() => markStatus(req._id, "resolved")}
                          disabled={updating === req._id}
                          className="px-3 py-2 rounded-xl bg-[#F0F1F6] text-[#4A4A6A] text-xs font-bold hover:bg-[#E4E5EF] transition-colors disabled:opacity-50"
                        >
                          {updating === req._id ? <Loader2 size={11} className="animate-spin" /> : "Resolve"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className={cn("text-sm text-[#4A4A6A] leading-relaxed", expanded === req._id ? "" : "line-clamp-2")}>
                      {req.message}
                    </p>
                    {req.message.length > 120 && (
                      <button
                        onClick={() => setExpanded(expanded === req._id ? null : req._id)}
                        className="text-xs text-[#E8540A] font-semibold mt-1"
                      >
                        {expanded === req._id ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-[#9090A8] text-sm">Showing {filtered.length} of {total}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn("w-9 h-9 rounded-xl font-bold text-sm transition-colors",
                page === p ? "bg-[#E8540A] text-white" : "border border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Reply Modal */}
      {replyTo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">Reply to {replyTo.name}</h3>
              <button onClick={() => setReplyTo(null)} className="text-[#9090A8] hover:text-[#0F0F1A]">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F8F9FC] rounded-xl p-4 text-sm">
                <p className="text-[#9090A8] text-xs mb-1">To:</p>
                <p className="font-semibold text-[#0F0F1A]">{replyTo.name}</p>
                {replyTo.email && <p className="text-[#4A4A6A] text-xs">{replyTo.email}</p>}
                {replyTo.mobile && <p className="text-[#4A4A6A] text-xs">{replyTo.mobile}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Reply Message</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={5}
                  placeholder="Type your reply here..."
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none bg-white"
                />
              </div>
              <div className="flex gap-3">
                {replyTo.mobile && (
                  <a
                    href={`https://wa.me/91${replyTo.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(replyText)}`}
                    target="_blank" rel="noreferrer"
                    onClick={handleReply}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm"
                  >
                    <Phone size={14} /> WhatsApp
                  </a>
                )}
                {replyTo.email && (
                  <a
                    href={`mailto:${replyTo.email}?subject=Re: Your enquiry - Veekay Cabs&body=${encodeURIComponent(replyText)}`}
                    onClick={handleReply}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm"
                  >
                    <Mail size={14} /> Send Email
                  </a>
                )}
              </div>
              <button onClick={() => setReplyTo(null)} className="w-full py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
