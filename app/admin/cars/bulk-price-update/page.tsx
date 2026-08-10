"use client";

import { useState, useEffect, useMemo } from "react";
import { Tag, CheckCircle2, XCircle, Loader2, Info, Car as CarIcon, Layers, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCarsApi } from "@/lib/api";
import { CAR_TYPES } from "@/lib/constants";

const PRICE_FIELDS = [
  { key: "regularPrice", label: "Regular Price (per hr)" },
  { key: "weekendPrice", label: "Weekend Price (per hr)" },
  { key: "extraKmRate", label: "Extra KM Rate" },
  { key: "securityDeposit", label: "Security Deposit" },
  { key: "doorstepDeliveryCharge", label: "Doorstep Delivery Charge" },
] as const;

type PriceField = typeof PRICE_FIELDS[number]["key"];
type LightCar = { _id: string; name: string; type: string; registrationNo: string } & Partial<Record<PriceField, number>>;

const CAR_FIELDS = ["_id", "name", "type", "registrationNo", ...PRICE_FIELDS.map((f) => f.key)].join(",");

const emptyPrices = (): Record<PriceField, string> => ({
  regularPrice: "",
  weekendPrice: "",
  extraKmRate: "",
  securityDeposit: "",
  doorstepDeliveryCharge: "",
});

const money = (n?: number) => (n === undefined ? "—" : `Rs. ${n.toLocaleString("en-IN")}`);

export default function BulkPriceUpdatePage() {
  const [allCars, setAllCars] = useState<LightCar[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [matchMode, setMatchMode] = useState<"name" | "type">("name");
  const [selectedName, setSelectedName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [prices, setPrices] = useState<Record<PriceField, string>>(emptyPrices());
  const [mixedFields, setMixedFields] = useState<Set<PriceField>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadCars = () =>
    adminCarsApi.getAll({ limit: "all", fields: CAR_FIELDS }).then((res) => setAllCars(res.data?.data || []));

  useEffect(() => {
    loadCars().finally(() => setLoadingCars(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const carNames = useMemo(
    () => Array.from(new Set(allCars.map((c) => c.name))).sort((a, b) => a.localeCompare(b)),
    [allCars]
  );
  const carTypesInFleet = useMemo(
    () => Array.from(new Set(allCars.map((c) => c.type))),
    [allCars]
  );

  const target = matchMode === "name" ? selectedName : selectedType;

  const matchedCars = useMemo(() => {
    if (!target) return [];
    return allCars.filter((c) => (matchMode === "name" ? c.name === selectedName : c.type === selectedType));
  }, [allCars, matchMode, selectedName, selectedType, target]);

  // Whenever the selected model/type changes, pull in the current price of
  // the matching cars so the admin can see (and tweak from) what's actually
  // set today, instead of starting from a blank field every time.
  useEffect(() => {
    if (!target || matchedCars.length === 0) {
      setPrices(emptyPrices());
      setMixedFields(new Set());
      return;
    }
    const next = emptyPrices();
    const mixed = new Set<PriceField>();
    PRICE_FIELDS.forEach(({ key }) => {
      const values = Array.from(new Set(matchedCars.map((c) => c[key]).filter((v) => v !== undefined)));
      if (values.length === 1) next[key] = String(values[0]);
      else if (values.length > 1) mixed.add(key);
    });
    setPrices(next);
    setMixedFields(mixed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, matchMode]);

  const hasAnyPrice = PRICE_FIELDS.some(({ key }) => prices[key] !== "");

  const handleSubmit = async () => {
    if (!target) {
      showToast(matchMode === "name" ? "Select a car model" : "Select a car type", "error");
      return;
    }
    if (!hasAnyPrice) {
      showToast("Enter at least one price field to update", "error");
      return;
    }
    const confirmMsg =
      matchMode === "name"
        ? `Update pricing for every "${selectedName}" car (${matchedCars.length} car(s)) in the fleet?`
        : `Update pricing for every "${selectedType}" car (${matchedCars.length} car(s)) in the fleet?`;
    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = matchMode === "name" ? { name: selectedName } : { type: selectedType };
      PRICE_FIELDS.forEach(({ key }) => {
        if (prices[key] !== "") payload[key] = prices[key];
      });
      const res = await adminCarsApi.bulkUpdatePrice(payload);
      const { matched, modified } = res.data;
      showToast(`Updated ${modified} of ${matched} matching car(s).`);
      // Refresh the cached fleet snapshot so the fields/table now reflect
      // the just-saved values instead of the pre-update numbers.
      await loadCars();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Bulk update failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const statTiles = [
    { label: "Total Cars in Fleet", value: allCars.length, icon: CarIcon },
    { label: "Distinct Models", value: carNames.length, icon: Layers },
    { label: "Car Types", value: carTypesInFleet.length, icon: ListChecks },
  ];

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all",
          toast.type === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-[#0F0F1A] font-bold text-xl font-syne">Bulk Price Update</h1>
        <p className="text-[#9090A8] text-sm mt-0.5">
          Update pricing for every car of a given model or type in one go, instead of editing each car individually.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statTiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E4E5EF] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#E8540A]/10 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-[#E8540A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F0F1A] font-syne leading-none">{loadingCars ? "—" : value}</p>
              <p className="text-[#9090A8] text-xs mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form + Matched Cars, side by side on wide screens */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-6 space-y-6 xl:sticky xl:top-6">
          {/* Match by name or type */}
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">Match Cars By</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setMatchMode("name"); setSelectedType(""); }}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors",
                  matchMode === "name"
                    ? "bg-[#E8540A] border-[#E8540A] text-white"
                    : "bg-[#F8F9FC] border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]"
                )}
              >
                Car Model
              </button>
              <button
                onClick={() => { setMatchMode("type"); setSelectedName(""); }}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors",
                  matchMode === "type"
                    ? "bg-[#E8540A] border-[#E8540A] text-white"
                    : "bg-[#F8F9FC] border-[#E4E5EF] text-[#4A4A6A] hover:border-[#E8540A]"
                )}
              >
                Car Type
              </button>
            </div>
          </div>

          {matchMode === "name" ? (
            <div>
              <label htmlFor="bulk-price-car-model" className="block text-xs font-semibold text-[#4A4A6A] mb-2">Car Model</label>
              <select
                id="bulk-price-car-model"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                disabled={loadingCars}
                className="w-full px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] text-sm focus:outline-none focus:border-[#E8540A]"
              >
                <option value="">{loadingCars ? "Loading models..." : "Select a car model"}</option>
                {carNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="bulk-price-car-type" className="block text-xs font-semibold text-[#4A4A6A] mb-2">Car Type</label>
              <select
                id="bulk-price-car-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] text-sm focus:outline-none focus:border-[#E8540A]"
              >
                <option value="">Select a car type</option>
                {CAR_TYPES.filter((t) => t !== "All").map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {target && (
            <div className="flex items-center gap-2 text-xs text-[#4A4A6A] bg-[#F8F9FC] border border-[#E4E5EF] rounded-xl px-3 py-2">
              <Info size={13} className="text-[#E8540A] shrink-0" />
              {matchedCars.length === 0
                ? "No cars currently match this selection."
                : `${matchedCars.length} car(s) match — current prices pre-filled below.`}
            </div>
          )}

          {/* Price fields */}
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-2">
              Price(s) — leave a field blank to leave it unchanged
            </label>
            <div className="grid grid-cols-1 gap-3">
              {PRICE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`bulk-price-${key}`} className="block text-[11px] text-[#9090A8] mb-1">
                    {label}
                    {mixedFields.has(key) && (
                      <span className="text-[#F59E0B] font-semibold"> — mixed values, currently blank</span>
                    )}
                  </label>
                  <input
                    id={`bulk-price-${key}`}
                    type="number"
                    min={0}
                    value={prices[key]}
                    onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={mixedFields.has(key) ? "Mixed — enter to overwrite all" : "—"}
                    className="w-full px-3 py-2.5 border border-[#E4E5EF] rounded-xl bg-[#F8F9FC] text-sm focus:outline-none focus:border-[#E8540A]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !target || !hasAnyPrice}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#E8540A] text-white rounded-xl text-sm font-semibold hover:bg-[#c94508] disabled:opacity-40 transition-colors"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
            Update All Matching Cars
          </button>
        </div>

        {/* Matched Cars preview */}
        <div className="bg-white rounded-2xl border border-[#E4E5EF] overflow-hidden">
          <div className="p-5 border-b border-[#E4E5EF] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#0F0F1A] text-sm">Matched Cars</h2>
              <p className="text-[#9090A8] text-xs mt-0.5">
                {target ? "These cars will be updated when you save." : "Pick a model or type on the left to preview affected cars."}
              </p>
            </div>
            {target && <span className="text-xs font-semibold text-[#E8540A] bg-[#E8540A]/10 px-3 py-1.5 rounded-full">{matchedCars.length} car(s)</span>}
          </div>

          {!target ? (
            <div className="p-16 text-center text-[#9090A8] text-sm">No selection yet</div>
          ) : matchedCars.length === 0 ? (
            <div className="p-16 text-center text-[#9090A8] text-sm">No cars match this selection</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E5EF] text-left text-[#9090A8] text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Car</th>
                    <th className="px-5 py-3 font-semibold">Reg No</th>
                    <th className="px-5 py-3 font-semibold">Regular</th>
                    <th className="px-5 py-3 font-semibold">Weekend</th>
                    <th className="px-5 py-3 font-semibold">Extra KM</th>
                    <th className="px-5 py-3 font-semibold">Deposit</th>
                    <th className="px-5 py-3 font-semibold">Doorstep</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedCars.map((c) => (
                    <tr key={c._id} className="border-b border-[#E4E5EF] last:border-0 hover:bg-[#F8F9FC]">
                      <td className="px-5 py-3 font-medium text-[#0F0F1A]">{c.name}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{c.registrationNo}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{money(c.regularPrice)}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{money(c.weekendPrice)}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{money(c.extraKmRate)}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{money(c.securityDeposit)}</td>
                      <td className="px-5 py-3 text-[#4A4A6A]">{money(c.doorstepDeliveryCharge)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
