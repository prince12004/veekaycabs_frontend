"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in required fields");
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
    toast.success("Message sent! We'll call you within 30 minutes.");
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            ✦ Get In Touch
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white font-syne mb-4">Contact Us</h1>
          <p className="text-white/70 text-lg">We&apos;re here 24/7. Call, WhatsApp, or drop us a message.</p>
        </div>
      </section>

      <section className="py-20 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 bg-white rounded-2xl border border-[#E4E5EF] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] h-fit"
            >
              <h2 className="text-2xl font-bold text-[#0F0F1A] font-syne mb-2">Send Us a Message</h2>
              <p className="text-[#9090A8] text-sm mb-8">We respond within 30 minutes during business hours.</p>

              {submitted ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={36} className="text-[#10B981]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F0F1A] mb-2">Message Sent!</h3>
                  <p className="text-[#4A4A6A]">Our team will reach out to you within 30 minutes.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F0F1A] mb-2">
                        Full Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full border-[1.5px] border-[#E4E5EF] rounded-xl px-4 py-3 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] focus:border-[#E8540A] focus:ring-2 focus:ring-[#FFF3ED] transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0F0F1A] mb-2">
                        Phone <span className="text-[#EF4444]">*</span>
                      </label>
                      <div className="flex">
                        <span className="flex items-center px-3 bg-[#F8F9FC] border-[1.5px] border-r-0 border-[#E4E5EF] rounded-l-xl text-sm text-[#4A4A6A]">+91</span>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="Mobile number"
                          className="flex-1 border-[1.5px] border-[#E4E5EF] rounded-r-xl px-4 py-3 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] focus:border-[#E8540A] focus:ring-2 focus:ring-[#FFF3ED] transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F0F1A] mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full border-[1.5px] border-[#E4E5EF] rounded-xl px-4 py-3 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] focus:border-[#E8540A] focus:ring-2 focus:ring-[#FFF3ED] transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F0F1A] mb-2">Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="w-full border-[1.5px] border-[#E4E5EF] rounded-xl px-4 py-3 text-sm text-[#0F0F1A] focus:border-[#E8540A] transition-all outline-none bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option>Booking Query</option>
                      <option>Tempo Traveller Inquiry</option>
                      <option>Cancellation / Refund</option>
                      <option>Document Verification</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F0F1A] mb-2">
                      Message <span className="text-[#EF4444]">*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      rows={4}
                      placeholder="Tell us how we can help you..."
                      className="w-full border-[1.5px] border-[#E4E5EF] rounded-xl px-4 py-3 text-sm text-[#0F0F1A] placeholder:text-[#9090A8] focus:border-[#E8540A] focus:ring-2 focus:ring-[#FFF3ED] transition-all outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gradient w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={18} /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-5">
              {[
                {
                  icon: Phone,
                  title: "Call Us",
                  content: (
                    <div className="space-y-2">
                      {["+91 99999 26867", "+91 9311826201", "+91 8448586825"].map(p => (
                        <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block text-sm text-[#4A4A6A] hover:text-[#E8540A] transition-colors font-medium">{p}</a>
                      ))}
                    </div>
                  ),
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp",
                  content: (
                    <a href="https://wa.me/919999926867" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#10B981] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#059669] transition-colors">
                      <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                  ),
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: (
                    <a href="mailto:sales@veekaycabs.com" className="text-sm text-[#E8540A] hover:underline font-medium">sales@veekaycabs.com</a>
                  ),
                },
                {
                  icon: MapPin,
                  title: "Delhi Office",
                  content: <p className="text-sm text-[#4A4A6A]">A 13, 1st Floor, Ganesh Nagar,<br />New Delhi 110092</p>,
                },
                {
                  icon: MapPin,
                  title: "Lucknow Office",
                  content: <p className="text-sm text-[#4A4A6A]">Flat 1007, Skyline Plaza-3,<br />Sushant Golf City, Lucknow</p>,
                },
                {
                  icon: Clock,
                  title: "Working Hours",
                  content: <p className="text-sm text-[#4A4A6A]">Mon–Sun: 8:00 AM – 10:00 PM<br />Emergency: 24/7</p>,
                },
              ].map(({ icon: Icon, title, content }) => (
                <div key={title} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E8540A]/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#E8540A]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0F0F1A] text-sm mb-2">{title}</p>
                    {content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
