"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string; // "YYYY-MM-DD HH:MM"
  onChange: (value: string) => void;
  minDate?: string;
  minDateTime?: string;
  placeholder?: string;
  dark?: boolean;
  hint?: string;
  error?: boolean;
}

export interface DateTimePickerHandle {
  open: () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

function formatDisplay(val: string): string {
  if (!val) return "";
  const [d, t] = val.split(" ");
  if (!d) return "";
  const dateObj = new Date(d + "T00:00:00");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const mon = dateObj.toLocaleDateString("en-IN", { month: "short" });
  const yr = dateObj.getFullYear();
  return t ? `${day} ${mon} ${yr} · ${t}` : `${day} ${mon} ${yr}`;
}

const DateTimePicker = forwardRef<DateTimePickerHandle, Props>(function DateTimePicker(
  { label, value, onChange, minDate, minDateTime, placeholder, dark, hint, error },
  ref
) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"date" | "time">("date");
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [pendingDate, setPendingDate] = useState("");
  const [pendingTime, setPendingTime] = useState(value ? value.split(" ")[1] || "" : "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position of the floating dropdown (fixed, so it escapes overflow:hidden parents)
  const [dropStyle, setDropStyle] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0, left: 0, width: 320, openUpward: false,
  });

  const minDateStr = minDateTime ? minDateTime.split(" ")[0] : minDate;
  const minTimeStr = minDateTime ? minDateTime.split(" ")[1] : undefined;

  const calcPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const DROPDOWN_H = 420;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < DROPDOWN_H && rect.top > spaceBelow;
    setDropStyle({
      top: openUpward ? rect.top - DROPDOWN_H - 8 : rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 320),
      openUpward,
    });
  };

  const openDropdown = () => {
    calcPosition();
    setOpen(true);
    setStep("date");
  };

  useImperativeHandle(ref, () => ({ open: openDropdown }));

  useEffect(() => {
    if (value) {
      const [d, t] = value.split(" ");
      setPendingDate(d || "");
      setPendingTime(t || "");
    }
  }, [value]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const dropdown = document.getElementById("__dtp_portal");
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdown && !dropdown.contains(e.target as Node)
      ) {
        setOpen(false);
        setStep("date");
      }
    };
    const onScroll = () => { calcPosition(); };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setPendingDate(d);
    setStep("time");
  };

  const handleTimeClick = (t: string) => {
    setPendingTime(t);
    onChange(`${pendingDate} ${t}`);
    setOpen(false);
    setStep("date");
  };

  const isDisabled = (day: number) => {
    if (!minDateStr) return false;
    const d = new Date(viewYear, viewMonth, day);
    const min = new Date(minDateStr + "T00:00:00");
    min.setHours(0, 0, 0, 0);
    return d < min;
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isSelected = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return d === pendingDate;
  };

  const isToday = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d.toDateString() === new Date().toDateString();
  };

  const isTimeDisabled = (t: string) => {
    if (!minDateStr || !minTimeStr) return false;
    if (pendingDate !== minDateStr) return false;
    return t < minTimeStr;
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setPendingDate("");
    setPendingTime("");
  };

  const pendingDateLabel = pendingDate
    ? (() => {
        const o = new Date(pendingDate + "T00:00:00");
        return `${String(o.getDate()).padStart(2, "0")} ${o.toLocaleDateString("en-IN", { month: "short" })} ${o.getFullYear()}`;
      })()
    : "";

  const inputBase = cn(
    "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm cursor-pointer focus:outline-none transition-all",
    dark
      ? "bg-white/[0.07] border border-white/15 hover:border-[#E8540A]/70 hover:bg-white/10"
      : "bg-white border-2 border-[#E4E5EF] hover:border-[#E8540A]/60",
    error && (dark ? "border-red-400/70" : "border-red-400")
  );

  const textColor = dark
    ? (value ? "text-white font-medium" : "text-white/45")
    : (value ? "text-[#0F0F1A] font-medium" : "text-[#9090A8]");

  // Portal dropdown — renders at root level so overflow:hidden parents can't clip it
  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="__dtp_portal"
          key="dtp"
          initial={{ opacity: 0, y: dropStyle.openUpward ? 6 : -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: dropStyle.openUpward ? 6 : -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: dropStyle.top,
            left: dropStyle.left,
            width: dropStyle.width,
            zIndex: 9999,
          }}
          className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] border border-[#E4E5EF] overflow-hidden"
        >
          {step === "date" ? (
            <div className="p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FC] text-[#4A4A6A] transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-[#0F0F1A] text-sm font-syne">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8F9FC] text-[#4A4A6A] transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 mb-1">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                  <div key={d} className="h-8 flex items-center justify-center text-[#9090A8] text-[11px] font-bold">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: getFirstDay(viewYear, viewMonth) }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }, (_, i) => {
                  const day = i + 1;
                  const disabled = isDisabled(day) || isPast(day);
                  const selected = isSelected(day);
                  const today = isToday(day);
                  return (
                    <button
                      key={day}
                      onClick={() => !disabled && handleDayClick(day)}
                      disabled={disabled}
                      className={cn(
                        "h-9 w-full rounded-lg text-sm font-medium transition-all",
                        selected && "bg-[#E8540A] text-white font-bold shadow-[0_4px_12px_rgba(232,84,10,0.3)]",
                        !selected && today && "bg-[#FFF3ED] text-[#E8540A] font-bold",
                        !selected && !today && !disabled && "text-[#0F0F1A] hover:bg-[#F8F9FC]",
                        disabled && "text-[#D1D5DB] cursor-not-allowed"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <p className="text-[#9090A8] text-[11px] text-center mt-3 flex items-center justify-center gap-1.5">
                <Clock size={11} />
                {hint || "Select a date to choose time"}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E5EF] bg-[#F8F9FC]">
                <button
                  onClick={() => setStep("date")}
                  className="flex items-center gap-1 text-[#E8540A] text-xs font-bold hover:underline"
                >
                  <ChevronLeft size={13} />
                  {pendingDateLabel}
                </button>
                <span className="text-[#0F0F1A] font-bold text-xs font-syne">Pick Time</span>
              </div>
              <div className="p-3 grid grid-cols-4 gap-1.5 max-h-[260px] overflow-y-auto">
                {TIME_SLOTS.map(t => {
                  const disabled = isTimeDisabled(t);
                  return (
                    <button
                      key={t}
                      onClick={() => !disabled && handleTimeClick(t)}
                      disabled={disabled}
                      className={cn(
                        "py-2 rounded-xl text-[13px] font-semibold transition-all",
                        disabled
                          ? "bg-[#F8F9FC] text-[#D1D5DB] cursor-not-allowed"
                          : pendingTime === t
                            ? "bg-[#E8540A] text-white shadow-[0_4px_12px_rgba(232,84,10,0.3)]"
                            : "bg-[#F8F9FC] text-[#4A4A6A] hover:bg-[#FFF3ED] hover:text-[#E8540A]"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={inputBase}
      >
        <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", dark ? "bg-white/10" : "bg-[#FFF3ED]")}>
          <Calendar size={12} className="text-[#E8540A]" />
        </span>
        <span className={cn("flex-1 text-left truncate", textColor)}>
          {value ? formatDisplay(value) : placeholder || `Select ${label}`}
        </span>
        {value && (
          <span onClick={clearValue} className={cn("hover:text-[#E8540A] transition-colors shrink-0", dark ? "text-white/40" : "text-[#9090A8]")}>
            <X size={12} />
          </span>
        )}
      </button>

      {hint && !open && (
        <p className={cn("text-[10px] mt-1 px-0.5", dark ? "text-white/35" : "text-[#9090A8]")}>{hint}</p>
      )}

      {/* Render dropdown via portal at document.body — escapes all overflow:hidden parents */}
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
});

export default DateTimePicker;
