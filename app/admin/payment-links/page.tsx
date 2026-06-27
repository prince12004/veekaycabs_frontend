"use client";

import { useState } from "react";
import { Plus, Copy, Link as LinkIcon, CheckCircle, Clock, XCircle, Search, Phone, IndianRupee, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_LINKS = [
  { id: "PAY_LNK_001", bookingId: "DL_HyundaiI20_SumitK_5512_2026", customer: "Sumit Kapoor", mobile: "76543 21098", amount: 1280, description: "Balance payment — Hyundai i20 booking", status: "pending", createdOn: "Jun 15, 2026", expiresOn: "Jun 22, 2026", url: "https://rzp.io/l/aBcD1234" },
  { id: "PAY_LNK_002", bookingId: "OFF_003", customer: "Manish Gupta", mobile: "8800112233", amount: 4500, description: "50% advance — Toyota Glanza offline booking", status: "paid", createdOn: "Jun 14, 2026", expiresOn: "Jun 21, 2026", url: "https://rzp.io/l/EfGh5678" },
  { id: "PAY_LNK_003", bookingId: "DL_HondaCity_PriyaM_9912_2026", customer: "Priya Mehta", mobile: "65432 10987", amount: 500, description: "Penalty — Car returned with damage", status: "expired", createdOn: "Jun 8, 2026", expiresOn: "Jun 15, 2026", url: "https://rzp.io/l/IjKl9012" },
];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending: { label: "Pending", bg: "#FEF3C7", text: "#92400E", icon: Clock },
  paid: { label: "Paid", bg: "#D1FAE5", text: "#065F46", icon: CheckCircle },
  expired: { label: "Expired", bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
};

interface NewLink { customer: string; mobile: string; bookingId: string; amount: string; description: string; expires: string }
const emptyLink: NewLink = { customer: "", mobile: "", bookingId: "", amount: "", description: "", expires: "" };

export default function PaymentLinksPage() {
  const [links, setLinks] = useState(PAYMENT_LINKS);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewLink>(emptyLink);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = links.filter(l => {
    const s = search.toLowerCase();
    return !s || l.customer.toLowerCase().includes(s) || l.bookingId.toLowerCase().includes(s) || l.id.toLowerCase().includes(s);
  });

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newLink = {
      id: `PAY_LNK_00${links.length + 1}`,
      bookingId: form.bookingId || "MANUAL",
      customer: form.customer,
      mobile: form.mobile,
      amount: Number(form.amount),
      description: form.description,
      status: "pending",
      createdOn: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      expiresOn: form.expires,
      url: `https://rzp.io/l/${Math.random().toString(36).substring(2, 10)}`,
    };
    setLinks(prev => [newLink, ...prev]);
    setForm(emptyLink);
    setShowCreate(false);
  };

  const update = (f: keyof NewLink) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Payment Links</h1>
          <p className="text-[#9090A8] text-sm">{links.length} links created · {links.filter(l => l.status === "pending").length} pending</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm">
          <Plus size={16} /> Create Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pending", value: `Rs. ${links.filter(l => l.status === "pending").reduce((s, l) => s + l.amount, 0).toLocaleString("en-IN")}`, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Total Collected", value: `Rs. ${links.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0).toLocaleString("en-IN")}`, color: "#10B981", bg: "#D1FAE5" },
          { label: "Expired Links", value: links.filter(l => l.status === "expired").length.toString(), color: "#EF4444", bg: "#FEE2E2" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: c.bg }}>
              <IndianRupee size={18} style={{ color: c.color }} />
            </div>
            <p className="text-xl font-black text-[#0F0F1A]">{c.value}</p>
            <p className="text-[#9090A8] text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or link ID..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {filtered.map(link => {
          const sc = STATUS_CFG[link.status];
          const StatusIcon = sc.icon;
          return (
            <div key={link.id} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF3ED] flex items-center justify-center shrink-0">
                    <LinkIcon size={18} className="text-[#E8540A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-[#0F0F1A]">{link.customer}</p>
                      <span className="text-xs font-mono text-[#9090A8]">{link.id}</span>
                      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                        <StatusIcon size={10} /> {sc.label}
                      </span>
                    </div>
                    <p className="text-[#4A4A6A] text-sm">{link.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#9090A8]">
                      <span>Booking: <span className="font-mono">{link.bookingId}</span></span>
                      <span>Created: {link.createdOn}</span>
                      <span>Expires: {link.expiresOn}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs bg-[#F8F9FC] px-3 py-1.5 rounded-lg text-[#4A4A6A] font-mono flex-1 min-w-0 truncate">{link.url}</code>
                      <button onClick={() => copyLink(link.url, link.id)} className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap", copied === link.id ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#E4E5EF]")}>
                        {copied === link.id ? <CheckCircle size={11} /> : <Copy size={11} />}
                        {copied === link.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-xl text-[#0F0F1A]">Rs. {link.amount.toLocaleString("en-IN")}</p>
                  <a href={`https://wa.me/${link.mobile}?text=Pay Rs. ${link.amount} for your Veekay Cabs booking: ${link.url}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#25D366] text-white">
                    <Phone size={11} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A]">Create Payment Link</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { field: "customer" as const, label: "Customer Name", placeholder: "Full name", required: true },
                { field: "mobile" as const, label: "Mobile Number", placeholder: "10-digit mobile", required: true },
                { field: "bookingId" as const, label: "Booking ID", placeholder: "e.g., DL_HyundaiCreta_...", required: false },
              ].map(({ field, label, placeholder, required }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">{label} {required && <span className="text-[#EF4444]">*</span>}</label>
                  <input value={form[field]} onChange={update(field)} placeholder={placeholder} required={required}
                    className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Amount (Rs.) <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                  <input type="number" value={form.amount} onChange={update("amount")} placeholder="0" required className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Description <span className="text-[#EF4444]">*</span></label>
                <input value={form.description} onChange={update("description")} placeholder="e.g., Balance payment for booking" required
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">Expiry Date</label>
                <input type="date" value={form.expires} onChange={update("expires")}
                  className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-xl text-white font-bold text-sm">Create Link</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
