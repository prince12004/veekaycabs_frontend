"use client";

import { useState } from "react";
import { Send, CheckCircle2, XCircle, Loader2, MessageSquare, Phone } from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    name: "vk_booking_confirmed",
    label: "Booking Confirmed (User)",
    params: ["Customer Name", "Booking ID", "Car Name", "Pickup Date", "Return Date", "Location", "Total Amount", "Amount Paid"],
    defaults: ["Rahul Kumar", "VK123456", "Maruti Swift", "1 Jul 2026, 10:00 AM", "3 Jul 2026, 10:00 AM", "Indore, MP", "Rs. 3500", "Rs. 1000"],
  },
  {
    name: "vk_admin_new_booking",
    label: "New Booking Alert (Admin)",
    params: ["Booking ID", "Customer Name", "Mobile", "Car", "Pickup", "Return", "Delivery Type", "Amount"],
    defaults: ["VK123456", "Rahul Kumar", "9999999999", "Maruti Swift", "1 Jul 2026", "3 Jul 2026", "Office Pickup", "Rs. 3500"],
  },
  {
    name: "car_docs_with_file",
    label: "Car Docs to Customer",
    params: ["Customer Name", "Booking ID", "Car Name", "Reg No"],
    defaults: ["Rahul Kumar", "VK123456", "Maruti Swift", "MP09AB1234"],
  },
  {
    name: "vk_booking_cancelled",
    label: "Booking Cancelled",
    params: ["Customer Name", "Booking ID", "Car Name"],
    defaults: ["Rahul Kumar", "VK123456", "Maruti Swift"],
  },
  {
    name: "vk_pickup_reminder",
    label: "Pickup Reminder",
    params: ["Customer Name", "Booking ID", "Car Name", "Pickup Time", "Location"],
    defaults: ["Rahul Kumar", "VK123456", "Maruti Swift", "1 Jul 2026, 10:00 AM", "Indore, MP"],
  },
  {
    name: "car_docs_with_file",
    label: "Car Document File (PDF)",
    params: ["Customer Name", "Booking ID", "Car Name", "Reg No", "Document Name"],
    defaults: ["Rahul Kumar", "VK123456", "Maruti Swift", "MP09AB1234", "RC Book"],
  },
];

type ResultType = { success: boolean; message: string } | null;

export default function WhatsAppTestPage() {
  const [mobile, setMobile] = useState("");
  const [mode, setMode] = useState<"template" | "text">("template");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [params, setParams] = useState<string[]>(TEMPLATES[0].defaults);
  const [textMsg, setTextMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ResultType>(null);

  const handleTemplateChange = (name: string) => {
    const t = TEMPLATES.find(t => t.name === name)!;
    setSelectedTemplate(t);
    setParams([...t.defaults]);
    setResult(null);
  };

  const handleSend = async () => {
    if (!mobile || mobile.replace(/\D/g, "").length < 10) {
      setResult({ success: false, message: "Enter a valid 10-digit mobile number" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = { mobile };
      if (mode === "template") {
        payload.campaignName = selectedTemplate.name;
        payload.templateParams = params;
      } else {
        payload.message = textMsg;
      }
      const res = await adminApi.post("/api/admin/whatsapp/test", payload);
      setResult({ success: true, message: res.data.message || "Message sent!" });
    } catch (err: any) {
      setResult({ success: false, message: err?.response?.data?.message || "Failed to send. Check server logs." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F0F1A] font-syne">WhatsApp Test</h1>
        <p className="text-[#9090A8] text-sm mt-0.5">Send a test message to any number to verify AiSensy is working</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — Config */}
        <div className="space-y-4">
          {/* Mobile */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">Recipient Mobile Number</label>
            <div className="flex items-center gap-2 px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] focus-within:border-[#E8540A] transition-colors">
              <Phone size={14} className="text-[#9090A8]" />
              <span className="text-sm font-semibold text-[#0F0F1A]">+91</span>
              <div className="w-px h-4 bg-[#E4E5EF]" />
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                className="flex-1 bg-transparent text-sm text-[#0F0F1A] placeholder:text-[#9090A8] outline-none"
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-3">Message Type</label>
            <div className="flex rounded-xl border border-[#E4E5EF] overflow-hidden">
              {(["template", "text"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); }}
                  className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors capitalize",
                    mode === m ? "bg-[#E8540A] text-white" : "text-[#4A4A6A] hover:bg-[#F8F9FC]")}>
                  {m === "template" ? "Template Message" : "Plain Text"}
                </button>
              ))}
            </div>
          </div>

          {/* Template selector */}
          {mode === "template" && (
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">Select Template</label>
                <select
                  value={selectedTemplate.name}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E4E5EF] rounded-xl text-sm bg-[#F8F9FC] focus:outline-none focus:border-[#E8540A]"
                >
                  {TEMPLATES.map(t => (
                    <option key={t.name} value={t.name}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#9090A8] mt-1">Campaign: <code className="bg-[#F8F9FC] px-1 rounded">{selectedTemplate.name}</code></p>
              </div>

              {/* Params */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#4A4A6A]">Template Parameters</label>
                {selectedTemplate.params.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#9090A8] w-16 shrink-0">{`{{${i + 1}}}`}</span>
                    <input
                      placeholder={label}
                      value={params[i] || ""}
                      onChange={e => {
                        const next = [...params];
                        next[i] = e.target.value;
                        setParams(next);
                      }}
                      className="flex-1 px-3 py-2 border border-[#E4E5EF] rounded-xl text-sm bg-[#F8F9FC] focus:outline-none focus:border-[#E8540A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text message */}
          {mode === "text" && (
            <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5">
              <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">Message Text</label>
              <textarea
                rows={5}
                placeholder="Type your message here..."
                value={textMsg}
                onChange={e => setTextMsg(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E4E5EF] rounded-xl text-sm bg-[#F8F9FC] focus:outline-none focus:border-[#E8540A] resize-none"
              />
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !mobile}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#E8540A] text-white rounded-xl font-bold text-sm hover:bg-[#c94508] disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? "Sending..." : "Send Test Message"}
          </button>

          {/* Result */}
          {result && (
            <div className={cn("flex items-start gap-3 p-4 rounded-xl border",
              result.success
                ? "bg-[#D1FAE5] border-[#10B981]/30 text-[#065F46]"
                : "bg-[#FEE2E2] border-[#EF4444]/30 text-[#991B1B]")}>
              {result.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm">{result.success ? "Success!" : "Failed"}</p>
                <p className="text-xs mt-0.5">{result.message}</p>
                {!result.success && (
                  <p className="text-xs mt-2 opacity-70">
                    Create campaigns in AiSensy (NeoDove) with the exact same name as the template, then try again.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Instructions */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-[#E8540A]" />
            <h3 className="font-bold text-sm text-[#0F0F1A]">Fix "Campaign does not exist" error</h3>
          </div>
          <ol className="space-y-3 text-sm text-[#4A4A6A]">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E8540A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Open AiSensy (NeoDove) → <strong>Contacts & Campaigns</strong> → <strong>Campaigns</strong> tab</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E8540A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Click <strong>+ New Campaign</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E8540A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Copy-paste the <strong>exact campaign name</strong> from the list below (character-perfect match required)</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E8540A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <span>Select the matching <strong>template</strong> and set type to <strong>Ongoing</strong></span>
            </li>
          </ol>
          <div className="mt-3 space-y-1.5">
            {TEMPLATES.map(t => (
              <div key={t.name} className="flex items-center justify-between bg-[#F8F9FC] rounded-lg px-3 py-2">
                <code className="text-xs font-bold text-[#E8540A]">{t.name}</code>
                <span className="text-[10px] text-[#9090A8]">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#FEF3C7] rounded-xl p-3">
            <p className="text-xs text-[#92400E] font-semibold">⚠ Set type to <strong>Ongoing</strong> — not one-time</p>
            <p className="text-xs text-[#92400E] mt-1">Create one campaign per template (6 total including car_docs_with_file)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
