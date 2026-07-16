"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";
import { Shield, ArrowRight, Target, Eye, Heart } from "lucide-react";

const timeline = [
  { year: "2003", title: "Founded", desc: "Veekay Cabs started with 2 cars and a dream to make quality transportation accessible." },
  { year: "2010", title: "First 10 Cars", desc: "Grew our fleet to 10 vehicles, expanding across Delhi with KYC-verified rentals." },
  { year: "2015", title: "3 Cities Expansion", desc: "Expanded to Noida and Gurgaon, serving the entire Delhi NCR region." },
  { year: "2020", title: "Digital Platform Launch", desc: "Launched our website and app for seamless online booking in under 60 seconds." },
  { year: "2023", title: "2,000+ Happy Customers", desc: "Crossed 2,000 happy customers with industry-leading satisfaction scores." },
  { year: "2026", title: "100+ Fleet, Full GPS", desc: "101 GPS-tracked, fully insured vehicles. Delhi NCR's #1 self-drive platform." },
];

const values = [
  { icon: Shield, title: "Safety First", desc: "Every car undergoes 50-point inspection. GPS-enabled and fully insured." },
  { icon: Eye, title: "Transparency", desc: "Zero hidden charges. What you see is what you pay. Always." },
  { icon: Heart, title: "Customer Love", desc: "4.8/5 rating from 2,000+ reviews. We put our customers first." },
  { icon: Target, title: "Innovation", desc: "Constant improvement — from 60-second booking to real-time GPS tracking." },
];

const team = [
  { name: "Vivek Kumar", role: "Founder & CEO", initials: "VK" },
  { name: "Priya Sharma", role: "Operations Head", initials: "PS" },
  { name: "Rahul Gupta", role: "Technology Lead", initials: "RG" },
  { name: "Anita Singh", role: "Customer Success", initials: "AS" },
];

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center">
      <div className="font-black text-5xl text-[#E8540A] font-space-grotesk mb-2">
        {inView ? <CountUp end={value} duration={2} /> : 0}{suffix}
      </div>
      <p className="text-[#4A4A6A] font-medium">{label}</p>
    </div>
  );
}

export default function AboutClient() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[60vh] bg-gradient-to-br from-[#0F0F1A] via-[#1C1C2E] to-[#0F0F1A] flex items-center justify-center pt-20">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #E8540A 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              ✦ Our Story
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white font-syne leading-tight mb-6">
              Delhi NCR&apos;s Most{" "}
              <span className="bg-gradient-to-r from-[#E8540A] to-[#FF9A3C] bg-clip-text text-transparent">
                Trusted
              </span>{" "}
              Car Rental
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">
              Since 2003, we&apos;ve been making self-drive car rental simple, safe, and affordable across Delhi NCR.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Quote */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <blockquote className="border-l-4 border-[#E8540A] pl-8 py-4">
            <p className="text-3xl font-bold text-[#0F0F1A] font-syne leading-tight mb-4">
              &ldquo;Our mission is to give every Indian the freedom to drive — safely, affordably, and without hassle.&rdquo;
            </p>
            <footer className="text-[#9090A8]">— Vivek Kumar, Founder, Veekay Cabs</footer>
          </blockquote>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCounter value={2003} suffix="" label="Founded" />
            <StatCounter value={101} suffix="+" label="Cars in Fleet" />
            <StatCounter value={2587} suffix="+" label="Total Bookings" />
            <StatCounter value={2165} suffix="+" label="Happy Customers" />
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-chip">Our Journey</div>
              <h2 className="text-4xl font-black text-[#0F0F1A] font-syne mb-6">
                From 2 Cars to{" "}
                <span className="bg-gradient-to-r from-[#E8540A] to-[#FF9A3C] bg-clip-text text-transparent">
                  101+ Fleet
                </span>
              </h2>
              <p className="text-[#4A4A6A] leading-relaxed mb-4">
                Veekay Cabs was founded in 2003 with a simple idea: make quality car rental accessible to everyone in Delhi NCR, without the complexity and hidden charges that plagued the industry.
              </p>
              <p className="text-[#4A4A6A] leading-relaxed mb-6">
                Over two decades, we&apos;ve grown from a small operation with 2 cars to Delhi NCR&apos;s most trusted self-drive platform — with 101+ GPS-tracked, fully insured vehicles, a 60-second booking process, and a team dedicated to making every rental experience world-class.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-white font-semibold"
              >
                Get in Touch <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-[#F8F9FC] rounded-2xl p-6 border border-[#E4E5EF] hover:border-[#E8540A]/30 hover:-translate-y-1 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-[#E8540A]/10 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-[#E8540A]" />
                  </div>
                  <h3 className="font-bold text-[#0F0F1A] mb-2">{title}</h3>
                  <p className="text-[#4A4A6A] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-[#F8F9FC]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-chip">History</div>
            <h2 className="text-4xl font-black text-[#0F0F1A] font-syne">Our Journey Through the Years</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E8540A] to-[#FF9A3C] hidden sm:block" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-8"
                >
                  <div className="relative hidden sm:flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#E8540A] flex items-center justify-center z-10 shrink-0">
                      <span className="text-white font-black text-xs font-syne">{item.year}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 flex-1 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                    <div className="sm:hidden text-xs font-bold text-[#E8540A] mb-2">{item.year}</div>
                    <h3 className="font-bold text-[#0F0F1A] text-lg mb-2">{item.title}</h3>
                    <p className="text-[#4A4A6A] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-chip">The Team</div>
            <h2 className="text-4xl font-black text-[#0F0F1A] font-syne">Meet the People Behind Veekay Cabs</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center bg-[#F8F9FC] rounded-2xl p-8 border border-[#E4E5EF] hover:-translate-y-2 hover:shadow-lg transition-all duration-200">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center mx-auto mb-4 text-white font-black text-xl font-syne shadow-lg shadow-orange-500/30">
                  {member.initials}
                </div>
                <h3 className="font-bold text-[#0F0F1A] mb-1">{member.name}</h3>
                <p className="text-[#9090A8] text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#E8540A] to-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white font-syne mb-4">Ready to Drive with Veekay Cabs?</h2>
          <p className="text-white/80 text-xl mb-8">Join 2,165+ happy customers who trust us for every journey.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="bg-white text-[#E8540A] font-bold px-8 py-4 rounded-xl hover:bg-[#FFF3ED] transition-colors"
            >
              Book a Car Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
