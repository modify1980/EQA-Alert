import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock, AlertTriangle, Eye, ArrowRight, HelpCircle } from "lucide-react";
import { EqaRecord } from "../types";

interface EqaCalendarProps {
  records: EqaRecord[];
  onViewRecordDetails: (record: EqaRecord) => void;
  onEditRecord: (record: EqaRecord) => void;
  theme?: "light" | "dark";
}

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default function EqaCalendar({
  records,
  onViewRecordDetails,
  onEditRecord,
  theme = "dark",
}: EqaCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11

  // Handle month changes
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Helper to format Date to YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  };

  // Calculate status details for color coding
  const getDeadlineStatus = (r: EqaRecord) => {
    const isDark = theme === "dark";
    if (r.status === "completed" || r.status === "submitted") {
      return {
        color: "bg-emerald-500", // Green
        label: "ส่งผลประเมินแล้ว",
        border: isDark ? "border-emerald-500/20" : "border-emerald-200",
        badgeBg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
        text: isDark ? "text-emerald-400" : "text-emerald-600"
      };
    }

    const todayNoTime = new Date();
    todayNoTime.setHours(0, 0, 0, 0);

    const deadline = new Date(r.deadlineDate);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - todayNoTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        color: "bg-rose-500", // Red (Overdue)
        label: `เกินกำหนดส่ง (${Math.abs(diffDays)} วัน)`,
        border: isDark ? "border-rose-500/20" : "border-rose-200",
        badgeBg: isDark ? "bg-rose-500/10" : "bg-rose-50",
        text: isDark ? "text-rose-400" : "text-rose-600"
      };
    } else if (diffDays === 0) {
      return {
        color: "bg-rose-500", // Red (Final Day)
        label: "วันสุดท้าย!",
        border: isDark ? "border-rose-500/30 animate-pulse" : "border-rose-300 animate-pulse",
        badgeBg: isDark ? "bg-rose-500/10" : "bg-rose-50",
        text: isDark ? "text-rose-400 font-bold" : "text-rose-600 font-bold"
      };
    } else if (diffDays >= 1 && diffDays <= 3) {
      return {
        color: "bg-amber-500", // Orange (1-3 days)
        label: `กำหนดส่งใน ${diffDays} วัน`,
        border: isDark ? "border-amber-500/20" : "border-amber-200",
        badgeBg: isDark ? "bg-amber-500/10" : "bg-amber-50",
        text: isDark ? "text-amber-400" : "text-amber-700"
      };
    } else {
      return {
        color: "bg-emerald-500", // Green (Normal)
        label: `ปกติ (อีก ${diffDays} วัน)`,
        border: isDark ? "border-emerald-500/20" : "border-emerald-200",
        badgeBg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
        text: isDark ? "text-emerald-400" : "text-emerald-600"
      };
    }
  };

  // Generate calendar grid array
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Prev Month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dNum = daysInPrevMonth - i;
    calendarDays.push({
      dayNum: dNum,
      dateStr: formatDateString(prevYearIdx, prevMonthIdx, dNum),
      isCurrentMonth: false,
    });
  }

  // Current Month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarDays.push({
      dayNum: d,
      dateStr: formatDateString(currentYear, currentMonth, d),
      isCurrentMonth: true,
    });
  }

  // Next Month padding days to complete standard calendar grid (multiple of 7)
  const remainingCells = 42 - calendarDays.length;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({
      dayNum: n,
      dateStr: formatDateString(nextYearIdx, nextMonthIdx, n),
      isCurrentMonth: false,
    });
  }

  // Group records by deadline date for quick lookup in calendar render
  const recordsByDeadline = records.reduce((acc, rec) => {
    if (!rec.deadlineDate) return acc;
    if (!acc[rec.deadlineDate]) {
      acc[rec.deadlineDate] = [];
    }
    acc[rec.deadlineDate].push(rec);
    return acc;
  }, {} as Record<string, EqaRecord[]>);

  const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className={`border shadow-xs overflow-hidden flex flex-col transition-all duration-300 ${
      theme === "dark" 
        ? "bg-zinc-900/50 border-zinc-800" 
        : "bg-white border-zinc-200"
    }`} id="eqa-calendar-card">
      
      {/* Calendar Header with navigation */}
      <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300 ${
        theme === "dark" 
          ? "border-zinc-800/80 bg-zinc-900/20" 
          : "border-zinc-200 bg-zinc-50/50"
      }`}>
        <div>
          <h2 className={`text-sm font-bold flex items-center space-x-2 ${theme === 'dark' ? "text-zinc-100" : "text-zinc-800"}`}>
            <CalendarIcon className="h-4.5 w-4.5 text-indigo-500" />
            <span>ปฏิทินตรวจสอบและกำหนดส่งงาน EQA</span>
          </h2>
          <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? "text-zinc-400" : "text-zinc-500"}`}>แสดงรายรายการจำแนกตามวันครบกำหนดรายงานผล พร้อมแถบสีแจ้งสถานะความเร่งด่วน</p>
        </div>

        {/* Navigation buttons and Month display */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <button
            onClick={handlePrevMonth}
            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                : "bg-white hover:bg-zinc-50 border-zinc-250 text-zinc-600 hover:text-zinc-900 shadow-2xs"
            }`}
            id="btn-calendar-prev-month"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className={`text-xs font-bold min-w-[120px] text-center px-3 py-1.5 border rounded-xl transition-all ${
            theme === "dark"
              ? "bg-zinc-950 text-zinc-200 border-zinc-850"
              : "bg-white text-zinc-800 border-zinc-200 shadow-2xs"
          }`}>
            {THAI_MONTHS_FULL[currentMonth]} พ.ศ. {currentYear + 543}
          </span>

          <button
            onClick={handleNextMonth}
            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                : "bg-white hover:bg-zinc-50 border-zinc-250 text-zinc-600 hover:text-zinc-900 shadow-2xs"
            }`}
            id="btn-calendar-next-month"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend section */}
      <div className={`px-5 py-3.5 border-b flex flex-wrap gap-4 items-center text-[11px] font-medium transition-colors duration-300 ${
        theme === "dark"
          ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-400"
          : "bg-zinc-50 border-zinc-200 text-zinc-600"
      }`}>
        <span className={`font-bold flex items-center gap-1 ${theme === 'dark' ? "text-zinc-500" : "text-zinc-400"}`}>
          <HelpCircle className="h-3.5 w-3.5" />
          คำอธิบายสีสถานะ:
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>เขียว = ปกติ (&gt; 3 วัน หรือส่งผลแล้ว)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
          <span>ส้ม = ครบกำหนดส่งใน 1-3 วัน</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
          <span>แดง = วันสุดท้าย / เลยกำหนดส่ง</span>
        </div>
      </div>

      {/* Grid of days */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[650px] grid grid-cols-7 gap-1.5">
          {/* Weekday headers */}
          {WEEKDAYS.map((day, idx) => (
            <div
              key={idx}
              className={`text-center py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                idx === 0
                  ? theme === "dark" ? "text-rose-400 bg-rose-500/5" : "text-rose-600 bg-rose-50"
                  : idx === 6
                  ? theme === "dark" ? "text-indigo-400 bg-indigo-500/5" : "text-indigo-600 bg-indigo-50"
                  : theme === "dark" ? "text-zinc-400 bg-zinc-950/30" : "text-zinc-500 bg-zinc-100"
              }`}
            >
              {day}
            </div>
          ))}

          {/* Calendar Day cells */}
          {calendarDays.map((cell, idx) => {
            const dayRecords = recordsByDeadline[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={idx}
                className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition-all group ${
                  cell.isCurrentMonth
                    ? theme === "dark"
                      ? "bg-zinc-950/20 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/10"
                      : "bg-white border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50/40"
                    : theme === "dark"
                      ? "bg-zinc-950/5 border-zinc-900/60 opacity-35"
                      : "bg-zinc-50 border-zinc-100 text-zinc-400 opacity-55"
                } ${
                  isToday 
                    ? theme === "dark"
                      ? "ring-2 ring-indigo-500/50 bg-indigo-950/10 border-indigo-500/30" 
                      : "ring-2 ring-indigo-500/50 bg-indigo-50/60 border-indigo-200"
                    : ""
                }`}
              >
                {/* Day number & Today label */}
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                      isToday
                        ? "bg-indigo-600 text-white font-bold"
                        : cell.isCurrentMonth
                        ? theme === "dark" ? "text-zinc-300" : "text-zinc-800"
                        : theme === "dark" ? "text-zinc-650" : "text-zinc-400"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-extrabold text-indigo-500 bg-indigo-500/10 px-1 rounded-sm">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Day's scheduled records */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                  {dayRecords.map((rec) => {
                    const status = getDeadlineStatus(rec);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => onViewRecordDetails(rec)}
                        className={`p-1 rounded-md border text-[10px] font-bold leading-tight flex items-center space-x-1 hover:scale-[1.02] cursor-pointer transition-all ${
                          theme === "dark" ? "hover:bg-zinc-850" : "hover:bg-zinc-50/80 shadow-3xs"
                        } ${status.badgeBg} ${status.border} ${status.text}`}
                        title={`${rec.branch} - ${rec.fromDept} (รอบ ${rec.round})`}
                      >
                        {/* Colored status bar/indicator in front of text */}
                        <span className={`w-1.5 h-3.5 rounded-xs shrink-0 ${status.color}`}></span>
                        <span className="truncate flex-1 max-w-[70px]">{rec.branch}</span>
                        <span className="opacity-75 text-[8px] font-mono shrink-0">({rec.round})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
