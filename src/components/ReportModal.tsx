import React, { useState, useMemo } from "react";
import { X, Printer, Download, Filter, FileSpreadsheet, Calendar, ChevronRight, BarChart2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { EqaRecord } from "../types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: EqaRecord[];
  theme?: "light" | "dark";
}

export default function ReportModal({
  isOpen,
  onClose,
  records,
  theme = "dark",
}: ReportModalProps) {
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateField, setDateField] = useState<"deadlineDate" | "receiveDate">("deadlineDate");

  // Get unique branches dynamically for filtering
  const branchesList = useMemo(() => {
    const branches = records.map((r) => r.branch).filter(Boolean);
    return Array.from(new Set(branches)).sort();
  }, [records]);

  // Date Formatter Helper
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const thMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      const day = date.getDate();
      const month = thMonths[date.getMonth()];
      const year = date.getFullYear() + 543; // Buddhist Era
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getRecordStatus = (r: EqaRecord) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isOverdue = r.status === "pending" && r.deadlineDate < todayStr;
    if (isOverdue) return "overdue";
    return r.status; // 'pending' | 'submitted' | 'completed'
  };

  // Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const recordStatus = getRecordStatus(r);
      
      // Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && recordStatus !== "pending") return false;
        if (statusFilter === "overdue" && recordStatus !== "overdue") return false;
        if (statusFilter === "submitted" && recordStatus !== "submitted" && recordStatus !== "completed") return false;
      }

      // Branch Filter
      if (branchFilter !== "all" && r.branch !== branchFilter) return false;

      // Date Range Filter
      const targetDate = r[dateField];
      if (startDate && targetDate < startDate) return false;
      if (endDate && targetDate > endDate) return false;

      return true;
    }).sort((a, b) => a[dateField].localeCompare(b[dateField]));
  }, [records, statusFilter, branchFilter, startDate, endDate, dateField]);

  // Calculations for filtered statistics
  const stats = useMemo(() => {
    let total = filteredRecords.length;
    let pending = 0;
    let submitted = 0;
    let overdue = 0;

    filteredRecords.forEach((r) => {
      const status = getRecordStatus(r);
      if (status === "pending") pending++;
      else if (status === "overdue") overdue++;
      else submitted++;
    });

    return { total, pending, submitted, overdue };
  }, [filteredRecords]);

  // Export to CSV Function
  const handleExportCSV = () => {
    // UTF-8 BOM to display Thai characters correctly in Excel
    const BOM = "\uFEFF";
    
    const headers = [
      "ลำดับ",
      "วันที่รับตัวอย่าง",
      "รอบ/ครั้งที่ EQA",
      "สาขางาน",
      "จากหน่วยงาน",
      "วันกำหนดส่งผล",
      "วันที่ส่งผลจริง",
      "ผู้ส่งผล",
      "วันที่ได้รับผลประเมิน",
      "ผู้รับผลประเมิน",
      "สถานะดำเนินการ",
      "บันทึกเพิ่มเติม/หมายเหตุ"
    ];

    const rows = filteredRecords.map((r, idx) => {
      const statusText = 
        getRecordStatus(r) === "overdue" ? "เกินกำหนดส่ง!" :
        getRecordStatus(r) === "pending" ? "รอดำเนินการ" : "ส่งผลเสร็จสิ้น";

      return [
        idx + 1,
        r.receiveDate || "",
        `"${r.round || ""}"`,
        `"${r.branch || ""}"`,
        `"${r.fromDept || ""}"`,
        r.deadlineDate || "",
        r.submissionDate || "",
        `"${r.submittedBy || r.responsiblePerson || ""}"`,
        r.resultReceiptDate || "",
        `"${r.resultReceivedBy || ""}"`,
        `"${statusText}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = BOM + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `รายงาน_ทะเบียน_EQA_${statusFilter}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print using built-in print dialog
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-950/80" : "bg-slate-900/40"
      }`} 
      id="report-modal-backdrop"
    >
      <div 
        className={`border rounded-2xl shadow-2xl w-full max-w-7xl h-[94vh] max-h-[94vh] overflow-hidden flex flex-col transition-all duration-300 ${
          theme === "dark" 
            ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
            : "bg-white border-slate-100 text-slate-800"
        }`} 
        id="report-modal-container"
      >
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex justify-between items-center transition-colors duration-300 ${
          theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-zinc-200"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              theme === "dark" 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${theme === "dark" ? "text-zinc-150" : "text-slate-800"}`}>
                สร้างรายงานทะเบียนบันทึกและติดตามการรับ-ส่ง EQA
              </h2>
              <p className={`text-[11px] ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
                สรุปและแสดงข้อมูลทะเบียนรายงาน EQA ทุกประเภทสถานะส่งผล สามารถจัดกรอง พิมพ์รายงานเป็น PDF หรือส่งออกเป็น Excel CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              theme === "dark" 
                ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body & Controls Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Side Panel: Advanced Filter Controls */}
          <div className={`w-full md:w-72 p-5 border-r shrink-0 flex flex-col gap-4 overflow-y-auto transition-colors duration-300 ${
            theme === "dark" ? "bg-zinc-950/20 border-zinc-800" : "bg-slate-50/50 border-zinc-200"
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
              <Filter className="h-4 w-4" />
              <span>ตัวกรองรายงาน (Filters)</span>
            </div>

            {/* Filter 1: Status */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                สถานะการส่งรายงาน EQA
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold appearance-none cursor-pointer focus:outline-hidden focus:border-indigo-500 transition-colors ${
                  theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <option value="all">📁 แสดงทุกสถานะส่งผล</option>
                <option value="pending">🟡 รอดำเนินการส่งผล</option>
                <option value="overdue">🔴 เกินกำหนดส่ง</option>
                <option value="submitted">🟢 ส่งผลเสร็จสิ้น</option>
              </select>
            </div>

            {/* Filter 2: Branch */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                สาขางานห้องปฏิบัติการ
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold appearance-none cursor-pointer focus:outline-hidden focus:border-indigo-500 transition-colors ${
                  theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <option value="all">📁 แสดงทุกสาขางาน</option>
                {branchesList.map((branch) => (
                  <option key={branch} value={branch}>
                    🔬 {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Date Criteria Select */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                การเลือกช่วงเวลาจากคอลัมน์
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDateField("deadlineDate")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all ${
                    dateField === "deadlineDate"
                      ? "bg-indigo-600 text-white"
                      : theme === "dark"
                        ? "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                        : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
                  }`}
                >
                  วันกำหนดส่ง
                </button>
                <button
                  type="button"
                  onClick={() => setDateField("receiveDate")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all ${
                    dateField === "receiveDate"
                      ? "bg-indigo-600 text-white"
                      : theme === "dark"
                        ? "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                        : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
                  }`}
                >
                  วันรับตัวอย่าง
                </button>
              </div>
            </div>

            {/* Filter 4: Start & End Date */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                ตั้งแต่วันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition-colors ${
                  theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition-colors ${
                  theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setBranchFilter("all");
                setStartDate("");
                setEndDate("");
              }}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-all mt-2 cursor-pointer ${
                theme === "dark"
                  ? "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  : "border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              ล้างค่าตัวกรองทั้งหมด
            </button>

            {/* Action panel at the bottom of filters */}
            <div className="mt-auto space-y-2 pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>พิมพ์รายงาน (Print / PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                }`}
              >
                <Download className="h-4 w-4" />
                <span>ดาวน์โหลด Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Report Sheet Preview */}
          <div className={`flex-1 p-6 overflow-y-auto flex flex-col gap-6 transition-colors duration-300 ${
            theme === "dark" ? "bg-zinc-950/40" : "bg-slate-50/30"
          }`}>
            
            {/* Live Filter Information & Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className={`p-3.5 border rounded-xl flex items-center gap-3 transition-colors ${
                theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-150 shadow-3xs"
              }`}>
                <div className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                }`}>
                  <BarChart2 className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>รายการที่ค้นพบ</p>
                  <p className="text-sm font-bold tracking-tight mt-0.5">{stats.total} รายการ</p>
                </div>
              </div>

              <div className={`p-3.5 border rounded-xl flex items-center gap-3 transition-colors ${
                theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-150 shadow-3xs"
              }`}>
                <div className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
                }`}>
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>รอดำเนินการส่งผล</p>
                  <p className="text-sm font-bold tracking-tight mt-0.5 text-amber-500">{stats.pending} รายการ</p>
                </div>
              </div>

              <div className={`p-3.5 border rounded-xl flex items-center gap-3 transition-colors ${
                theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-150 shadow-3xs"
              }`}>
                <div className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>ส่งผลเสร็จสิ้น</p>
                  <p className="text-sm font-bold tracking-tight mt-0.5 text-emerald-500">{stats.submitted} รายการ</p>
                </div>
              </div>

              <div className={`p-3.5 border rounded-xl flex items-center gap-3 transition-colors ${
                theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-150 shadow-3xs"
              }`}>
                <div className={`p-2 rounded-lg ${
                  stats.overdue > 0 
                    ? "bg-rose-500/10 text-rose-400" 
                    : theme === "dark" 
                      ? "bg-zinc-800 text-zinc-500" 
                      : "bg-slate-100 text-slate-400"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>เกินกำหนดส่ง</p>
                  <p className={`text-sm font-bold tracking-tight mt-0.5 ${stats.overdue > 0 ? "text-rose-500 animate-pulse" : ""}`}>{stats.overdue} รายการ</p>
                </div>
              </div>

            </div>

            {/* Document Sheet Layout (This is the element targeted by @media print) */}
            <div 
              id="print-area" 
              className={`p-6 sm:p-8 rounded-xl border flex flex-col gap-6 shadow-xs relative transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-zinc-900 border-zinc-850" 
                  : "bg-white border-slate-150 text-slate-900"
              }`}
            >
              
              {/* Formal Hospital Report Header (clinical/academic style) */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-4 gap-4 border-slate-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 select-none print:hidden" />
                    <h1 className="text-sm sm:text-base font-extrabold tracking-tight dark:text-zinc-100 text-zinc-900">
                      ทะเบียนบันทึกและติดตามการรับ-ส่ง EQA
                    </h1>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    ห้องปฏิบัติการทางการแพทย์ งานชันสูตรสาธารณสุข โรงพยาบาลสมเด็จพระยุพราชเดชอุดม
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ประเภทรายงาน: แสดงทุกประเภทสถานะผลการส่งประเมินควบคุมคุณภาพจากภายนอก
                  </p>
                </div>

                <div className="sm:text-right space-y-0.5 w-full sm:w-auto">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ข้อมูล ณ วันที่: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    เงื่อนไขตัวกรอง: สาขา [{branchFilter === "all" ? "ทั้งหมด" : branchFilter}] | สถานะ [{
                      statusFilter === "all" ? "ทั้งหมด" : 
                      statusFilter === "pending" ? "รอดำเนินการ" : 
                      statusFilter === "overdue" ? "เกินกำหนดส่ง" : "ส่งผลเสร็จสิ้น"
                    }]
                  </p>
                  {startDate || endDate ? (
                    <p className="text-[9px] text-indigo-500 font-bold dark:text-indigo-400">
                      ช่วงเวลา ({dateField === "deadlineDate" ? "วันกำหนดส่ง" : "วันรับตัวอย่าง"}): {startDate ? formatThaiDate(startDate) : "เริ่มต้น"} - {endDate ? formatThaiDate(endDate) : "สิ้นสุด"}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Printable Table Sheet */}
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-zinc-950/60 font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800">
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-center w-8">ที่</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800">วันรับตัวอย่าง</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-center">รอบ/ครั้งที่</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 font-bold">สาขางาน</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800">จากหน่วยงาน</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400">กำหนดส่ง</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400">วันที่ส่งจริง</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800">ผู้ส่งผล/ผู้ดูแล</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400">วันที่รับประเมิน</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800">ผู้สแกนรับผล</th>
                      <th className="px-2.5 py-3 border border-slate-200 dark:border-zinc-800 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((r, idx) => {
                        const status = getRecordStatus(r);
                        return (
                          <tr 
                            key={r.id} 
                            className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                          >
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 text-center font-mono font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap">
                              {formatThaiDate(r.receiveDate)}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 text-center font-mono font-medium">
                              {r.round}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 font-bold">
                              {r.branch}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 max-w-[130px] truncate" title={r.fromDept}>
                              {r.fromDept}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap font-bold text-rose-500">
                              {formatThaiDate(r.deadlineDate)}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap font-bold text-indigo-500 dark:text-indigo-400">
                              {r.submissionDate ? formatThaiDate(r.submissionDate) : "-"}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 font-medium truncate max-w-[110px]" title={r.submittedBy || r.responsiblePerson}>
                              {r.submittedBy || r.responsiblePerson || "-"}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap font-bold text-emerald-500">
                              {r.resultReceiptDate ? formatThaiDate(r.resultReceiptDate) : "-"}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 truncate max-w-[100px]" title={r.resultReceivedBy}>
                              {r.resultReceivedBy || "-"}
                            </td>
                            <td className="px-2.5 py-2.5 border border-slate-200 dark:border-zinc-800 text-center whitespace-nowrap">
                              {status === "overdue" && (
                                <span className="inline-block px-1.5 py-0.5 rounded-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 font-extrabold text-[9px]">
                                  🔴 เกินกำหนด!
                                </span>
                              )}
                              {status === "pending" && (
                                <span className="inline-block px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 font-extrabold text-[9px]">
                                  🟡 รอส่งผล
                                </span>
                              )}
                              {(status === "submitted" || status === "completed") && (
                                <span className="inline-block px-1.5 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px]">
                                  🟢 เรียบร้อย
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-zinc-500">
                          ไม่พบประวัติทะเบียนบันทึก EQA ตรงตามเงื่อนไขที่เลือก
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Printable Notes / Approval signature block */}
              <div className="grid grid-cols-2 gap-8 pt-10 text-[10px] border-t border-slate-200 dark:border-zinc-800 mt-4">
                <div className="space-y-4">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">หมายเหตุ / คำอธิบายเพิ่มเติม:</p>
                  <p className="text-zinc-500 leading-relaxed text-[9px]">
                    1. รายงานนี้รวมสถิติขั้นตอนการรับตัวอย่าง, วันครบกำหนดส่งผล, วันเวลาส่งผลประเมิน, และวันลงทะเบียนรับรายงานผลการประเมินย้อนกลับ<br />
                    2. การรายงานผลล่าช้า (Overdue) จะมีการแจ้งเตือนแบบออโตเมติกทางสมาร์ทโฟน LINE Notify แก่สมาชิกกลุ่มเพื่อความปลอดภัยเชิงคุณภาพ
                  </p>
                </div>
                
                <div className="flex flex-col items-end justify-end space-y-12 pr-6">
                  <div className="text-center">
                    <p className="text-zinc-650 dark:text-zinc-400">ลงชื่อ.............................................................. ผู้สรุปรายงาน</p>
                    <p className="text-[9px] text-zinc-400 mt-2">(...........................................................................)</p>
                    <p className="text-[9px] text-zinc-400 mt-1">ตำแหน่ง นักเทคนิคการแพทย์ปฏิบัติการ / หัวหน้างานชันสูตร</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
