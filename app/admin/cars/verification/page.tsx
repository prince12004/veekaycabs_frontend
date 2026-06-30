"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Loader2, RefreshCw, FileCheck, Receipt, IndianRupee, ClipboardList, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vehicleVerificationApi } from "@/lib/api";
import { RcResult, ChallanResult, CheckedEntry, Field, CheckedVehiclesTable, fmtDate, fmtDateTime } from "./_shared";

export default function VehicleVerificationPage() {
  const [regNo, setRegNo] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");

  const [rcLoading, setRcLoading] = useState(false);
  const [challanLoading, setChallanLoading] = useState(false);
  const [rcResult, setRcResult] = useState<RcResult | null>(null);
  const [challanResult, setChallanResult] = useState<ChallanResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [recentList, setRecentList] = useState<CheckedEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRecentList = () => {
    setLoadingList(true);
    vehicleVerificationApi.list({ page: 1, limit: 5 }).then((res) => {
      setRecentList(res.data?.data || []);
    }).finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadRecentList();
  }, []);

  const runRC = async (force = false) => {
    if (!regNo.trim()) {
      showToast("Enter a registration number first", "error");
      return;
    }
    if (!chassisNumber.trim() || !engineNumber.trim()) {
      showToast("Chassis number and engine number (last 5 characters each) are both required by QuickEKYC", "error");
      return;
    }
    setRcLoading(true);
    try {
      const { data } = await vehicleVerificationApi.verifyRC(regNo.trim(), chassisNumber.trim(), engineNumber.trim(), force);
      setRcResult(data.data);
      showToast("RC verification complete!");
      loadRecentList();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "RC verification failed", "error");
    } finally {
      setRcLoading(false);
    }
  };

  const runChallan = async (force = false) => {
    if (!regNo.trim()) {
      showToast("Enter a registration number first", "error");
      return;
    }
    setChallanLoading(true);
    try {
      const { data } = await vehicleVerificationApi.checkChallan(regNo.trim(), force);
      setChallanResult(data.data);
      showToast("Challan check complete!");
      loadRecentList();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Challan check failed", "error");
    } finally {
      setChallanLoading(false);
    }
  };

  const loadEntry = (entry: CheckedEntry) => {
    setRegNo(entry.registrationNo);
    setChassisNumber(entry.rcVerification?.chassisNumber?.slice(-5) || "");
    setEngineNumber(entry.rcVerification?.engineNumber?.slice(-5) || "");
    setRcResult(entry.rcVerification?.analyzedAt ? entry.rcVerification : null);
    setChallanResult(entry.challanCheck?.analyzedAt ? entry.challanCheck : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rc = rcResult;
  const challan = challanResult;

  return (
    <div className="p-6 space-y-5 min-h-full">
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all",
          toast.type === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-[#0F0F1A] font-bold text-xl font-syne">Vehicle Verification</h1>
        <p className="text-[#9090A8] text-sm mt-0.5">RC verification & pending challan check via QuickEKYC — works for any vehicle</p>
      </div>

      {/* Registration Number Input */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-3">
        <label className="block text-xs font-semibold text-[#4A4A6A]">Registration Number</label>
        <input
          value={regNo}
          onChange={(e) => setRegNo(e.target.value.toUpperCase())}
          placeholder="e.g. DL01AB1234"
          className="w-full px-4 py-3 border border-[#E4E5EF] focus:border-[#E8540A] rounded-xl text-sm outline-none uppercase"
        />
      </div>

      {!regNo.trim() && !rc && !challan && (
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F8F9FC] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-[#9090A8]" />
          </div>
          <p className="text-[#0F0F1A] font-semibold">Enter a registration number above</p>
          <p className="text-[#9090A8] text-sm mt-1">to run RC verification or challan check on any vehicle</p>
        </div>
      )}

      {(regNo.trim() || rc || challan) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* RC Verification Card */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                  <FileCheck size={16} className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-bold text-[#0F0F1A] text-sm">RC Verification</p>
                  <p className="text-[#9090A8] text-xs">Registration Certificate details</p>
                </div>
              </div>
              {rc?.status === "verified" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">Verified</span>}
              {rc?.status === "failed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Failed</span>}
              {!rc && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9090A8]/10 text-[#9090A8]">Not Run</span>}
            </div>

            {rc?.status === "failed" && (
              <div className="flex items-start gap-2 px-3 py-2 bg-[#FEF2F2] rounded-xl text-xs text-[#991B1B]">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {rc.error || "RC verification failed"}
              </div>
            )}

            {rc?.status === "verified" && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Owner Name" value={rc.ownerName} />
                <Field label="Vehicle Model" value={rc.vehicleModel} />
                <Field label="Vehicle Class" value={rc.vehicleClass} />
                <Field label="Fuel Type" value={rc.fuelType} />
                <Field label="Color" value={rc.color} />
                <Field label="Registration Date" value={fmtDate(rc.registrationDate)} />
                <Field label="Chassis No." value={rc.chassisNumber} />
                <Field label="Engine No." value={rc.engineNumber} />
                <Field label="Insurance Co." value={rc.insuranceCompany} />
                <Field label="Insurance Upto" value={fmtDate(rc.insuranceValidUpto)} />
                <Field label="Fitness Upto" value={fmtDate(rc.fitnessValidUpto)} />
                <Field label="Financer" value={rc.financer || "None"} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#4A4A6A] mb-1">Chassis No. (last 5 chars) *</label>
                <input
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AB123"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-[#E4E5EF] focus:border-[#3B82F6] rounded-lg text-xs outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#4A4A6A] mb-1">Engine No. (last 5 chars) *</label>
                <input
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. XY789"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-[#E4E5EF] focus:border-[#3B82F6] rounded-lg text-xs outline-none uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => runRC(false)}
                disabled={rcLoading || !regNo.trim() || !chassisNumber.trim() || !engineNumber.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
              >
                {rcLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                {rcLoading ? "Verifying..." : rc?.analyzedAt ? "View Cached Result" : "Run RC Verification"}
              </button>
              {rc?.analyzedAt && (
                <button
                  onClick={() => runRC(true)}
                  disabled={rcLoading}
                  title="Re-verify (bypass cache)"
                  className="p-2.5 rounded-xl border border-[#E4E5EF] hover:border-[#3B82F6] text-[#4A4A6A] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
            {rc?.analyzedAt && <p className="text-[10px] text-[#9090A8]">Last checked: {fmtDateTime(rc.analyzedAt)}</p>}
          </div>

          {/* Challan Check Card */}
          <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
                  <Receipt size={16} className="text-[#EF4444]" />
                </div>
                <div>
                  <p className="font-bold text-[#0F0F1A] text-sm">Challan Check</p>
                  <p className="text-[#9090A8] text-xs">Pending traffic challans</p>
                </div>
              </div>
              {challan?.status === "checked" && challan.totalChallans === 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">Clean</span>
              )}
              {challan?.status === "checked" && challan.totalChallans > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">{challan.totalChallans} Found</span>
              )}
              {challan?.status === "failed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Failed</span>}
              {!challan && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#9090A8]/10 text-[#9090A8]">Not Run</span>}
            </div>

            {challan?.status === "failed" && (
              <div className="flex items-start gap-2 px-3 py-2 bg-[#FEF2F2] rounded-xl text-xs text-[#991B1B]">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {challan.error || "Challan check failed"}
              </div>
            )}

            {challan?.status === "checked" && challan.ownerName && (
              <Field label="Owner Name" value={challan.ownerName} />
            )}

            {challan?.status === "checked" && challan.totalPendingAmount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FEF3C7] rounded-xl text-xs font-semibold text-[#92400E]">
                <IndianRupee size={13} />
                Total Pending: ₹{challan.totalPendingAmount.toLocaleString("en-IN")}
              </div>
            )}

            {challan?.status === "checked" && challan.challans.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {challan.challans.map((c, i) => (
                  <div key={i} className="px-3 py-2 border border-[#E4E5EF] rounded-xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F0F1A]">{c.challanNumber || `Challan #${i + 1}`}</span>
                      <span className="font-bold text-[#EF4444]">₹{c.amount?.toLocaleString("en-IN") || 0}</span>
                    </div>
                    <p className="text-[#9090A8] mt-0.5">{c.offense || "—"} {c.location ? `· ${c.location}` : ""}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#9090A8]">{fmtDateTime(c.challanDate)}</span>
                      <span className={cn("text-[10px] font-bold", (c.status || "").toLowerCase() === "pending" ? "text-[#F59E0B]" : "text-[#10B981]")}>{c.status || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {challan?.status === "checked" && challan.totalChallans === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#D1FAE5] rounded-xl text-xs font-semibold text-[#065F46]">
                <CheckCircle2 size={13} />
                No pending challans found
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => runChallan(false)}
                disabled={challanLoading || !regNo.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 transition-colors"
              >
                {challanLoading ? <Loader2 size={13} className="animate-spin" /> : <Receipt size={13} />}
                {challanLoading ? "Checking..." : challan?.analyzedAt ? "View Cached Result" : "Run Challan Check"}
              </button>
              {challan?.analyzedAt && (
                <button
                  onClick={() => runChallan(true)}
                  disabled={challanLoading}
                  title="Re-check (bypass cache)"
                  className="p-2.5 rounded-xl border border-[#E4E5EF] hover:border-[#EF4444] text-[#4A4A6A] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
            {challan?.analyzedAt && <p className="text-[10px] text-[#9090A8]">Last checked: {fmtDateTime(challan.analyzedAt)}</p>}
          </div>
        </div>
      )}

      {/* Recent Checked Vehicles (compact) */}
      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <ClipboardList size={16} className="text-[#8B5CF6]" />
            </div>
            <div>
              <p className="font-bold text-[#0F0F1A] text-sm">Recently Checked</p>
              <p className="text-[#9090A8] text-xs">Last 5 vehicles checked from this tool</p>
            </div>
          </div>
          <Link
            href="/admin/cars/verification/history"
            className="flex items-center gap-1 text-xs font-semibold text-[#3B82F6] hover:underline"
          >
            View All Checks <ArrowRight size={13} />
          </Link>
        </div>

        <CheckedVehiclesTable entries={recentList} loading={loadingList} onRecheck={loadEntry} />
      </div>
    </div>
  );
}
