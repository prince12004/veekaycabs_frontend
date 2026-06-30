"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { vehicleVerificationApi } from "@/lib/api";
import { CheckedEntry, CheckedVehiclesTable } from "../_shared";

const PAGE_SIZE = 20;

export default function VehicleVerificationHistoryPage() {
  const [entries, setEntries] = useState<CheckedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    vehicleVerificationApi.list({ page, limit: PAGE_SIZE }).then((res) => {
      setEntries(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-6 space-y-5 min-h-full">
      <div className="flex items-center gap-3">
        <Link href="/admin/cars/verification" className="text-[#9090A8] hover:text-[#E8540A] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-[#0F0F1A] font-bold text-xl font-syne">All Checked Vehicles</h1>
          <p className="text-[#9090A8] text-sm mt-0.5">Every registration number checked via RC verification or challan check — {total} total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E5EF] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <ClipboardList size={16} className="text-[#8B5CF6]" />
          </div>
          <p className="font-bold text-[#0F0F1A] text-sm">Checked Vehicles</p>
        </div>

        <CheckedVehiclesTable entries={entries} loading={loading} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-[#E4E5EF]">
            <p className="text-xs text-[#9090A8]">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:border-[#E8540A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E4E5EF] text-xs font-semibold text-[#4A4A6A] hover:border-[#E8540A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
