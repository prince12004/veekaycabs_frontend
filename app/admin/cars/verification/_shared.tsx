"use client";

import { useState, Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RcResult {
  status: "verified" | "failed" | "not_run";
  ownerName?: string;
  fatherName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  registrationDate?: string;
  rcStatus?: string;
  ownerNumber?: string;
  rtoCode?: string;
  registeredAt?: string;
  vehicleClass?: string;
  vehicleModel?: string;
  makerDescription?: string;
  bodyType?: string;
  fuelType?: string;
  color?: string;
  seatCapacity?: number;
  cubicCapacity?: string;
  manufacturingDate?: string;
  chassisNumber?: string;
  engineNumber?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceValidUpto?: string;
  fitnessValidUpto?: string;
  taxUpto?: string;
  puccUpto?: string;
  financer?: string;
  blacklistStatus?: string;
  analyzedAt?: string;
  error?: string;
}

export interface Challan {
  challanNumber?: string;
  challanDate?: string;
  amount: number;
  status?: string;
  offense?: string;
  location?: string;
}

export interface ChallanResult {
  status: "checked" | "failed" | "not_run";
  ownerName?: string;
  totalChallans: number;
  totalPendingAmount: number;
  challans: Challan[];
  analyzedAt?: string;
  error?: string;
}

export interface CheckedEntry {
  _id: string;
  registrationNo: string;
  rcVerification?: RcResult;
  challanCheck?: ChallanResult;
}

export const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#9090A8] uppercase tracking-wide">{label}</p>
      <p className="text-[#0F0F1A] font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

export function CheckedVehiclesTable({
  entries,
  loading,
  onRecheck,
}: {
  entries: CheckedEntry[];
  loading: boolean;
  onRecheck?: (entry: CheckedEntry) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <p className="text-xs text-[#9090A8] text-center py-6">Loading...</p>;
  if (entries.length === 0) return <p className="text-xs text-[#9090A8] text-center py-6">No vehicles checked yet</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[#9090A8] border-b border-[#E4E5EF]">
            <th className="py-2 pr-3 font-semibold">Reg. No.</th>
            <th className="py-2 pr-3 font-semibold">RC Status</th>
            <th className="py-2 pr-3 font-semibold">Challan Status</th>
            <th className="py-2 pr-3 font-semibold">Last Checked</th>
            <th className="py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const lastChecked = [entry.rcVerification?.analyzedAt, entry.challanCheck?.analyzedAt]
              .filter(Boolean)
              .sort()
              .pop();
            const isOpen = expandedId === entry._id;
            return (
              <Fragment key={entry._id}>
                <tr
                  onClick={() => setExpandedId(isOpen ? null : entry._id)}
                  className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#F8F9FC] cursor-pointer"
                >
                  <td className="py-2.5 pr-3 font-medium text-[#0F0F1A]">{entry.registrationNo}</td>
                  <td className="py-2.5 pr-3">
                    {entry.rcVerification?.status === "verified" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">Verified</span>}
                    {entry.rcVerification?.status === "failed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Failed</span>}
                    {!entry.rcVerification?.analyzedAt && <span className="text-[10px] text-[#9090A8]">—</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    {entry.challanCheck?.status === "checked" && entry.challanCheck.totalChallans === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">Clean</span>}
                    {entry.challanCheck?.status === "checked" && entry.challanCheck.totalChallans > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">{entry.challanCheck.totalChallans} Found</span>}
                    {entry.challanCheck?.status === "failed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Failed</span>}
                    {!entry.challanCheck?.analyzedAt && <span className="text-[10px] text-[#9090A8]">—</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-[#9090A8]">{fmtDateTime(lastChecked)}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-3">
                      {onRecheck && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRecheck(entry); }}
                          className="text-[#3B82F6] font-semibold hover:underline"
                        >
                          Recheck
                        </button>
                      )}
                      <ChevronDown size={14} className={cn("text-[#9090A8] transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-[#E4E5EF]">
                    <td colSpan={5} className="bg-[#F8F9FC] p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                        {/* RC details */}
                        <div className="bg-white rounded-xl border border-[#E4E5EF] p-3 space-y-2">
                          <p className="font-bold text-[#0F0F1A]">RC Verification</p>
                          {entry.rcVerification?.status === "verified" ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Owner Name" value={entry.rcVerification.ownerName} />
                              <Field label="Father Name" value={entry.rcVerification.fatherName} />
                              <Field label="RC Status" value={entry.rcVerification.rcStatus} />
                              <Field label="Owner No." value={entry.rcVerification.ownerNumber} />
                              <Field label="Vehicle Model" value={entry.rcVerification.vehicleModel} />
                              <Field label="Maker" value={entry.rcVerification.makerDescription} />
                              <Field label="Body Type" value={entry.rcVerification.bodyType} />
                              <Field label="Fuel Type" value={entry.rcVerification.fuelType} />
                              <Field label="Color" value={entry.rcVerification.color} />
                              <Field label="Seats" value={entry.rcVerification.seatCapacity?.toString()} />
                              <Field label="Mfg. Date" value={entry.rcVerification.manufacturingDate} />
                              <Field label="RTO Code" value={entry.rcVerification.rtoCode} />
                              <Field label="Chassis No." value={entry.rcVerification.chassisNumber} />
                              <Field label="Engine No." value={entry.rcVerification.engineNumber} />
                              <Field label="Insurance Co." value={entry.rcVerification.insuranceCompany} />
                              <Field label="Insurance Upto" value={fmtDate(entry.rcVerification.insuranceValidUpto)} />
                              <Field label="Fitness Upto" value={fmtDate(entry.rcVerification.fitnessValidUpto)} />
                              <Field label="Tax Upto" value={fmtDate(entry.rcVerification.taxUpto)} />
                              <Field label="PUCC Upto" value={fmtDate(entry.rcVerification.puccUpto)} />
                              <Field label="Financer" value={entry.rcVerification.financer || "None"} />
                              <Field label="Blacklist" value={entry.rcVerification.blacklistStatus || "None"} />
                              {entry.rcVerification.presentAddress && (
                                <div className="col-span-2">
                                  <Field label="Address" value={entry.rcVerification.presentAddress} />
                                </div>
                              )}
                              <Field label="Checked At" value={fmtDateTime(entry.rcVerification.analyzedAt)} />
                            </div>
                          ) : entry.rcVerification?.status === "failed" ? (
                            <p className="text-[#991B1B]">{entry.rcVerification.error || "RC verification failed"}</p>
                          ) : (
                            <p className="text-[#9090A8]">Not run</p>
                          )}
                        </div>
                        {/* Challan details */}
                        <div className="bg-white rounded-xl border border-[#E4E5EF] p-3 space-y-2">
                          <p className="font-bold text-[#0F0F1A]">Challan Check</p>
                          {entry.challanCheck?.status === "checked" ? (
                            <>
                              {entry.challanCheck.ownerName && <Field label="Owner Name" value={entry.challanCheck.ownerName} />}
                              {entry.challanCheck.challans.length > 0 ? (
                                <div className="space-y-1.5">
                                  <p className="text-[#92400E] font-semibold">Total Pending: ₹{entry.challanCheck.totalPendingAmount.toLocaleString("en-IN")}</p>
                                  {entry.challanCheck.challans.map((c, i) => (
                                    <div key={i} className="border border-[#E4E5EF] rounded-lg px-2.5 py-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-[#0F0F1A]">{c.challanNumber || `Challan #${i + 1}`}</span>
                                        <span className="font-bold text-[#EF4444]">₹{c.amount?.toLocaleString("en-IN") || 0}</span>
                                      </div>
                                      <p className="text-[#9090A8]">{c.offense || "—"} {c.location ? `· ${c.location}` : ""}</p>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[#9090A8]">{fmtDateTime(c.challanDate)}</span>
                                        <span className={cn("font-bold", (c.status || "").toLowerCase() === "pending" ? "text-[#F59E0B]" : "text-[#10B981]")}>{c.status || "—"}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[#10B981]">No pending challans found</p>
                              )}
                            </>
                          ) : entry.challanCheck?.status === "failed" ? (
                            <p className="text-[#991B1B]">{entry.challanCheck.error || "Challan check failed"}</p>
                          ) : (
                            <p className="text-[#9090A8]">Not run</p>
                          )}
                          {entry.challanCheck?.analyzedAt && <p className="text-[#9090A8] pt-1">Checked At: {fmtDateTime(entry.challanCheck.analyzedAt)}</p>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
