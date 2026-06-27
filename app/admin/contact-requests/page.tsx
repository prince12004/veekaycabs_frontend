"use client";

import { useState } from "react";
import { Search, Phone, Mail, Trash2, MessageSquare, Send, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUESTS = [
  { id: 1, name: "Trusted Business", email: "info@trustedbusinessawards.com", mobile: "918620007775", message: "Hi A Tempo Traveller in Ghaziabad is an Economy-friendly vehicle option. Your business has been identified as a strong candidate for the Trusted Business Award...", receivedAt: "Jun 15, 2026", replied: false },
  { id: 2, name: "Grazyna Turpin", email: "turpin.grazyna@gmail.com", mobile: "6144680101", message: "Stop wasting your budget on expensive ads and complex tech by implementing a 30-day AI-driven roadmap that automates 80% of your content...", receivedAt: "Jun 14, 2026", replied: false },
  { id: 3, name: "Lalit Sharma", email: "lalits@gmail.com", mobile: "9811223344", message: "Hi, I want to book a Hyundai Creta for 3 days from June 20 to June 23. Please let me know the availability and pricing for Noida.", receivedAt: "Jun 13, 2026", replied: true },
  { id: 4, name: "Ritika Malhotra", email: "ritika@email.com", mobile: "8899001122", message: "Enquiring about long-term car rental for 1 month. Can you offer any special rates for monthly booking?", receivedAt: "Jun 12, 2026", replied: false },
  { id: 5, name: "Sameer Khan", email: "sameer@company.com", mobile: "7700112233", message: "We need 5 cars for a corporate event on June 25. Can you handle bulk bookings with driver or self-drive options?", receivedAt: "Jun 11, 2026", replied: true },
];

interface ReplyModal { id: number; name: string; email: string; mobile: string }

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState(REQUESTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [replyTo, setReplyTo] = useState<ReplyModal | null>(null);
  const [replyText, setReplyText] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = requests.filter(r => {
    const s = search.toLowerCase();
    const match = !s || r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.mobile.includes(s);
    const filt = filter === "All" || (filter === "Replied" && r.replied) || (filter === "Pending" && !r.replied);
    return match && filt;
  });

  const deleteRequest = (id: number) => setRequests(prev => prev.filter(r => r.id !== id));
  const markReplied = (id: number) => setRequests(prev => prev.map(r => r.id === id ? { ...r, replied: true } : r));

  const handleReply = () => {
    if (replyTo) {
      markReplied(replyTo.id);
      setReplyTo(null);
      setReplyText("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Contact Requests</h1>
          <p className="text-[#9090A8] text-sm">{requests.length} total · {requests.filter(r => !r.replied).length} pending reply</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: requests.length, color: "#3B82F6", bg: "#DBEAFE" },
          { label: "Pending Reply", value: requests.filter(r => !r.replied).length, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Replied", value: requests.filter(r => r.replied).length, color: "#10B981", bg: "#D1FAE5" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, mobile..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <div className="flex gap-1.5">
          {["All", "Pending", "Replied"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors", filter === f ? "bg-[#E8540A] text-white" : "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#E4E5EF]")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {req.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#0F0F1A]">{req.name}</p>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", req.replied ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]")}>
                        {req.replied ? "Replied" : "Pending"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                      <a href={`mailto:${req.email}`} className="flex items-center gap-1 text-xs text-[#4A4A6A] hover:text-[#E8540A]"><Mail size={10} /> {req.email}</a>
                      <span className="flex items-center gap-1 text-xs text-[#4A4A6A]"><Phone size={10} /> {req.mobile}</span>
                      <span className="text-xs text-[#9090A8]">{req.receivedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => { setReplyTo({ id: req.id, name: req.name, email: req.email, mobile: req.mobile }); setReplyText(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8540A] text-white text-xs font-bold hover:bg-[#C94508] transition-colors">
                    <Send size={11} /> Reply
                  </button>
                  <button onClick={() => deleteRequest(req.id)} className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#991B1B] hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-3 pl-13">
                <p className={cn("text-sm text-[#4A4A6A] leading-relaxed", expanded === req.id ? "" : "line-clamp-2")}>{req.message}</p>
                {req.message.length > 120 && (
                  <button onClick={() => setExpanded(expanded === req.id ? null : req.id)} className="text-xs text-[#E8540A] font-semibold mt-1">
                    {expanded === req.id ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-[#9090A8] text-sm">Showing {filtered.length} of {requests.length}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"><ChevronLeft size={16} /></button>
          <button className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm">{page}</button>
          <button onClick={() => setPage(p => p + 1)} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Reply Modal */}
      {replyTo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">Reply to {replyTo.name}</h3>
              <button onClick={() => setReplyTo(null)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F8F9FC] rounded-xl p-4 text-sm">
                <p className="text-[#9090A8] text-xs mb-1">To:</p>
                <p className="font-semibold text-[#0F0F1A]">{replyTo.name}</p>
                <p className="text-[#4A4A6A] text-xs">{replyTo.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Reply Message</label>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} placeholder="Type your reply here..." className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none resize-none bg-white" />
              </div>
              <div className="flex gap-3">
                <a href={`https://wa.me/${replyTo.mobile}?text=${encodeURIComponent(replyText)}`} target="_blank" rel="noreferrer" onClick={handleReply}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">
                  <Phone size={14} /> WhatsApp
                </a>
                <a href={`mailto:${replyTo.email}?subject=Re: Your enquiry - Veekay Cabs&body=${encodeURIComponent(replyText)}`} onClick={handleReply}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm">
                  <Mail size={14} /> Send Email
                </a>
              </div>
              <button onClick={() => setReplyTo(null)} className="w-full py-2.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
