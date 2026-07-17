"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DatePicker({ value, onChange, disabled, placeholder, minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value + "T00:00:00").getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value + "T00:00:00").getMonth() : new Date().getMonth()));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dropStyle, setDropStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });

  const calcPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const DROPDOWN_H = 360;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < DROPDOWN_H && rect.top > spaceBelow;
    setDropStyle({
      top: openUpward ? rect.top - DROPDOWN_H - 8 : rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 300),
    });
  };

  const openPicker = () => {
    if (disabled) return;
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    calcPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const dropdown = document.getElementById("__dp_portal");
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdown && !dropdown.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => calcPosition();
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const dayStr = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isOutOfRange = (day: number) => {
    const d = dayStr(day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const isSelected = (day: number) => dayStr(day) === value;

  const isToday = (day: number) => new Date(viewYear, viewMonth, day).toDateString() === new Date().toDateString();

  const handleDayClick = (day: number) => {
    onChange(dayStr(day));
    setOpen(false);
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const formatted = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear + 5 - i);

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="__dp_portal"
          key="dp"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ position: "fixed", top: dropStyle.top, left: dropStyle.left, width: dropStyle.width, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] border border-[#E4E5EF] overflow-hidden p-4"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <button type="button" onClick={prevMonth} className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center hover:bg-[#F8F9FC] text-[#4A4A6A] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-bold text-[#0F0F1A] font-syne bg-transparent outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-bold text-[#0F0F1A] font-syne bg-transparent outline-none cursor-pointer"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center hover:bg-[#F8F9FC] text-[#4A4A6A] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[#9090A8] text-[11px] font-bold">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: getFirstDay(viewYear, viewMonth) }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }, (_, i) => {
              const day = i + 1;
              const outOfRange = isOutOfRange(day);
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !outOfRange && handleDayClick(day)}
                  disabled={outOfRange}
                  className={cn(
                    "h-9 w-full rounded-lg text-sm font-medium transition-all",
                    selected && "bg-[#E8540A] text-white font-bold shadow-[0_4px_12px_rgba(232,84,10,0.3)]",
                    !selected && today && "bg-[#FFF3ED] text-[#E8540A] font-bold",
                    !selected && !today && !outOfRange && "text-[#0F0F1A] hover:bg-[#F8F9FC]",
                    outOfRange && "text-[#D1D5DB] cursor-not-allowed"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        disabled={disabled}
        className={cn(
          "w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-10 pr-9 py-2.5 text-sm flex items-center text-left transition-colors relative",
          disabled ? "bg-[#F8F9FC] text-[#9090A8] cursor-default" : "bg-white text-[#0F0F1A] hover:border-[#E8540A]/60 cursor-pointer"
        )}
      >
        <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E8540A]" />
        {formatted || <span className="text-[#9090A8]">{placeholder || "Select date"}</span>}
        {value && !disabled && (
          <span onClick={clearValue} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9090A8] hover:text-[#E8540A] transition-colors">
            <X size={13} />
          </span>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
