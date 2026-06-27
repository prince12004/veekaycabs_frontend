"use client";

import { useState } from "react";
import {
  Plus, Search, Download, Eye, QrCode, FileText, Phone,
  ChevronLeft, ChevronRight, X, Check, IndianRupee, Calendar,
  Car, User, MapPin, Clock, Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

const OFFLINE_BOOKINGS = [
  { id: "OFF_001", customer: "Rajesh Verma", mobile: "9811234567", car: "Toyota Rumion", regNo: "HR-8125-AX", city: "Delhi", start: "2026-06-15T10:00", end: "2026-06-16T10:00", amount: 3500, received: 3500, deposit: 5000, depositReturned: false, status: "active", addedBy: "Akki", remark: "Customer picked up at 10:15 AM", carReceived: false },
  { id: "OFF_002", customer: "Sunita Rani", mobile: "9876543211", car: "Maruti Suzuki Baleno", regNo: "DL7CX6144", city: "Noida", start: "2026-06-13T14:00", end: "2026-06-15T14:00", amount: 5200, received: 2600, deposit: 5000, depositReturned: false, status: "completed", addedBy: "Anil sir", remark: "", carReceived: true },
  { id: "OFF_003", customer: "Manish Gupta", mobile: "8800112233", car: "Toyota Glanza", regNo: "DL3CDA2958", city: "Gurgaon", start: "2026-06-14T09:00", end: "2026-06-17T09:00", amount: 9000, received: 4500, deposit: 8000, depositReturned: false, status: "active", addedBy: "Akki", remark: "Extended by 1 day", carReceived: false },
  { id: "OFF_004", customer: "Pooja Sharma", mobile: "7709988776", car: "Hyundai Creta", regNo: "DL7CY6997", city: "Delhi", start: "2026-06-10T08:00", end: "2026-06-12T08:00", amount: 7200, received: 7200, deposit: 10000, depositReturned: true, status: "completed", addedBy: "Anil sir", remark: "Deposit returned on return", carReceived: true },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  pending: { bg: "#FEF3C7", text: "#92400E" },
};

interface BookingForm {
  customer: string; mobile: string; email: string;
  city: string; car: string;
  start: string; end: string;
  amount: string; received: string; deposit: string;
  remark: string; addedBy: string;
  paymentMode: string;
}

const emptyForm: BookingForm = {
  customer: "", mobile: "", email: "",
  city: "Delhi", car: "",
  start: "", end: "",
  amount: "", received: "0", deposit: "5000",
  remark: "", addedBy: "Akki", paymentMode: "Cash",
};

const inputCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";
const selectCls = "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none";

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[#4A4A6A] uppercase tracking-wider mb-1.5">
      {text} {required && <span className="text-[#EF4444]">*</span>}
    </label>
  );
}

function BillModal({ booking, onClose }: { booking: (typeof OFFLINE_BOOKINGS)[0]; onClose: () => void }) {
  const balance = booking.amount - booking.received;
  const nights = Math.round((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60 * 60 * 24));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#E8540A] to-[#FF6B35] p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Veekay Cabs — Booking Bill</p>
              <p className="font-black text-lg font-syne mt-0.5">#{booking.id}</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Customer</p>
              <p className="font-bold text-[#0F0F1A]">{booking.customer}</p>
              <p className="text-[#4A4A6A] text-xs">{booking.mobile}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Car</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{booking.car}</p>
              <p className="text-[#4A4A6A] text-xs">{booking.regNo}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Duration</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{nights} day{nights !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Booking Start</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{new Date(booking.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <div className="bg-[#F8F9FC] rounded-xl p-3">
              <p className="text-[#9090A8] text-xs mb-0.5">Booking End</p>
              <p className="font-semibold text-[#0F0F1A] text-sm">{new Date(booking.end).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
          </div>
          <div className="border-t border-dashed border-[#E4E5EF] pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Booking Amount</span><span className="font-bold">Rs. {booking.amount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Amount Received</span><span className="font-bold text-[#10B981]">Rs. {booking.received.toLocaleString("en-IN")}</span></div>
            {balance > 0 && <div className="flex justify-between"><span className="text-[#4A4A6A]">Balance Due</span><span className="font-bold text-[#EF4444]">Rs. {balance.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between"><span className="text-[#4A4A6A]">Security Deposit</span><span className="font-bold">Rs. {booking.deposit.toLocaleString("en-IN")}</span></div>
          </div>
          <div className="bg-[#FFF3ED] rounded-xl p-3 text-xs text-[#4A4A6A]">
            <p className="font-semibold text-[#E8540A] mb-1">Terms & Conditions</p>
            <p>• Speed limit: 120 km/h • Security deposit refundable after car return & inspection • Fuel to be returned at same level • Any damage chargeable extra</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => window.open(`https://wa.me/${booking.mobile}?text=Your Veekay Cabs booking ${booking.id} is confirmed. Total: Rs.${booking.amount}. Pickup: ${booking.start}. Car: ${booking.car} (${booking.regNo}). Thank you!`)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">
              <Phone size={14} /> WhatsApp
            </button>
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0F0F1A] text-white font-bold text-sm">
              <Printer size={14} /> Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrModal({ booking, onClose }: { booking: (typeof OFFLINE_BOOKINGS)[0]; onClose: () => void }) {
  const balance = booking.amount - booking.received;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold font-syne text-[#0F0F1A]">QR Payment</h3>
          <button onClick={onClose} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
        </div>
        <div className="bg-[#F8F9FC] rounded-2xl p-6 flex flex-col items-center">
          <div className="w-44 h-44 bg-[#0F0F1A] rounded-xl flex items-center justify-center mb-4">
            <div className="grid grid-cols-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={cn("w-7 h-7 rounded-sm", Math.random() > 0.5 ? "bg-white" : "bg-[#0F0F1A]")} />
              ))}
            </div>
          </div>
          <p className="text-[#9090A8] text-xs text-center">Scan to pay via UPI</p>
          <p className="font-bold text-[#0F0F1A] text-xl mt-2">Rs. {(balance > 0 ? balance : booking.amount).toLocaleString("en-IN")}</p>
          <p className="text-[#9090A8] text-xs mt-0.5">{balance > 0 ? "Balance Due" : "Total Amount"}</p>
        </div>
        <div className="mt-4 p-3 bg-[#FFF3ED] rounded-xl text-xs text-[#E8540A] font-semibold text-center">
          UPI: veekaycabs@upi · Veekay Cabs
        </div>
        <div className="flex gap-3 mt-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">
            <Phone size={14} /> Share on WhatsApp
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfflineBookingsPage() {
  const [bookings, setBookings] = useState(OFFLINE_BOOKINGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [billFor, setBillFor] = useState<(typeof OFFLINE_BOOKINGS)[0] | null>(null);
  const [qrFor, setQrFor] = useState<(typeof OFFLINE_BOOKINGS)[0] | null>(null);
  const [page, setPage] = useState(1);

  const filtered = bookings.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = !s || b.customer.toLowerCase().includes(s) || b.mobile.includes(s) || b.car.toLowerCase().includes(s) || b.id.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || b.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const update = (f: keyof BookingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = {
      id: `OFF_00${bookings.length + 1}`,
      customer: form.customer, mobile: form.mobile,
      car: form.car, regNo: "NEW-REG", city: form.city,
      start: form.start, end: form.end,
      amount: Number(form.amount), received: Number(form.received),
      deposit: Number(form.deposit), depositReturned: false,
      status: "active", addedBy: form.addedBy, remark: form.remark,
      carReceived: false,
    };
    setBookings(prev => [newBooking, ...prev]);
    setForm(emptyForm);
    setShowAddForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F0F1A] font-syne">Offline Bookings</h1>
          <p className="text-[#9090A8] text-sm">{bookings.length} offline bookings · {bookings.filter(b => b.status === "active").length} active</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border-[1.5px] border-[#E8540A] text-[#E8540A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#FFF3ED] transition-colors">
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm"
          >
            <Plus size={16} /> Add Offline Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, car, booking ID..." className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-[#E4E5EF] rounded-xl text-sm focus:border-[#E8540A] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none bg-white">
          {["All", "Active", "Completed", "Cancelled", "Pending"].map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none" />
        <input type="date" className="border-[1.5px] border-[#E4E5EF] rounded-xl px-3 py-2.5 text-sm focus:border-[#E8540A] outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FC] border-b border-[#E4E5EF]">
                {["ID", "Customer", "Car", "Period", "Amount", "Received", "Deposit", "Added By", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#9090A8] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const s = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                const balance = b.amount - b.received;
                return (
                  <tr key={b.id} className={cn("border-b border-[#E4E5EF] hover:bg-[#FFF3ED] transition-colors", i % 2 === 1 ? "bg-[#F8F9FC]/50" : "")}>
                    <td className="px-4 py-3.5 font-mono text-xs text-[#4A4A6A] font-bold">{b.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#0F0F1A] text-sm">{b.customer}</p>
                      <p className="text-[#9090A8] text-xs">{b.mobile}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#0F0F1A] text-sm">{b.car}</p>
                      <p className="text-[#9090A8] text-xs">{b.regNo}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-[#4A4A6A]">{new Date(b.start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} → {new Date(b.end).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#0F0F1A] text-sm">Rs. {b.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-xs font-bold", balance > 0 ? "text-[#F59E0B]" : "text-[#10B981]")}>
                        Rs. {b.received.toLocaleString("en-IN")}
                      </span>
                      {balance > 0 && <p className="text-[10px] text-[#EF4444]">Due: Rs. {balance.toLocaleString("en-IN")}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-xs font-bold", b.depositReturned ? "text-[#10B981]" : "text-[#F59E0B]")}>
                        Rs. {b.deposit.toLocaleString("en-IN")}
                      </span>
                      <p className="text-[10px] text-[#9090A8]">{b.depositReturned ? "Returned" : "Held"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#4A4A6A] font-medium">{b.addedBy}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => setBillFor(b)} title="Generate Bill" className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] hover:bg-[#F59E0B] hover:text-white transition-colors flex items-center justify-center">
                          <FileText size={13} />
                        </button>
                        <button onClick={() => setQrFor(b)} title="QR Payment" className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors flex items-center justify-center">
                          <QrCode size={13} />
                        </button>
                        <button title="View Details" className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white transition-colors flex items-center justify-center">
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E5EF]">
          <p className="text-[#9090A8] text-sm">Showing {filtered.length} of {bookings.length} bookings</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#E8540A] text-white font-bold text-sm">{page}</button>
            <button onClick={() => setPage(p => p + 1)} className="w-9 h-9 rounded-xl border border-[#E4E5EF] flex items-center justify-center hover:border-[#E8540A] hover:text-[#E8540A] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Offline Booking Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E5EF]">
              <h3 className="font-black font-syne text-[#0F0F1A] text-lg">Add Offline Booking</h3>
              <button onClick={() => setShowAddForm(false)} className="text-[#9090A8] hover:text-[#0F0F1A]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label text="Customer Name" required />
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.customer} onChange={update("customer")} required placeholder="Full name" className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <Label text="Mobile Number" required />
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input value={form.mobile} onChange={update("mobile")} required placeholder="10-digit mobile" className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <Label text="Email" />
                  <input value={form.email} onChange={update("email")} placeholder="customer@email.com" type="email" className={inputCls} />
                </div>
                <div>
                  <Label text="City" required />
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <select value={form.city} onChange={update("city")} className={cn(selectCls, "pl-9")}>
                      {["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Greater Noida"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {/* Car & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label text="Select Car" required />
                  <div className="relative">
                    <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <select value={form.car} onChange={update("car")} required className={cn(selectCls, "pl-9")}>
                      <option value="">-- Select Car --</option>
                      {["Toyota Rumion - HR-8125-AX", "Toyota Glanza - DL3CDA2958", "Maruti Suzuki Baleno - DL7CX6144", "Hyundai Creta - DL7CY6997", "Mahindra Scorpio N - HR-8504-D"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label text="Added By" required />
                  <select value={form.addedBy} onChange={update("addedBy")} className={selectCls}>
                    {["Akki", "Anil sir", "Sushant sir"].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <Label text="Booking Start" required />
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="datetime-local" value={form.start} onChange={update("start")} required className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
                <div>
                  <Label text="Booking End" required />
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                    <input type="datetime-local" value={form.end} onChange={update("end")} required className={cn(inputCls, "pl-9")} />
                  </div>
                </div>
              </div>
              {/* Amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { field: "amount" as const, label: "Booking Amount" },
                  { field: "received" as const, label: "Amount Received" },
                  { field: "deposit" as const, label: "Security Deposit" },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <Label text={label} required />
                    <div className="relative">
                      <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
                      <input type="number" value={form[field]} onChange={update(field)} placeholder="0" className={cn(inputCls, "pl-8")} required />
                    </div>
                  </div>
                ))}
                <div>
                  <Label text="Payment Mode" required />
                  <select value={form.paymentMode} onChange={update("paymentMode")} className={selectCls}>
                    {["Cash", "UPI", "Bank Transfer", "Card"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label text="Remark" />
                <textarea value={form.remark} onChange={update("remark")} placeholder="Any notes about this booking..." rows={2} className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl px-4 py-2.5 text-sm text-[#0F0F1A] bg-white outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 btn-gradient py-3.5 rounded-xl text-white font-bold text-sm">
                  <Check size={16} /> Add Booking
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-3.5 rounded-xl border border-[#E4E5EF] text-[#4A4A6A] font-semibold text-sm hover:border-[#E8540A]/50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {billFor && <BillModal booking={billFor} onClose={() => setBillFor(null)} />}
      {qrFor && <QrModal booking={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}
