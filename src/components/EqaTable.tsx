import React, { useState } from "react";
import { Search, Filter, Edit2, Trash2, Eye, Calendar, Bell, Users, Clock, AlertTriangle } from "lucide-react";
import { EqaRecord } from "../types";

interface EqaTableProps {
  records: EqaRecord[];
  onEditRecord: (record: EqaRecord) => void;
  onDeleteRecord: (id: string) => void;
  onViewRecordDetails: (record: EqaRecord) => void;
  theme?: "light" | "dark";
}

export default function EqaTable({
  records,
  onEditRecord,
  onDeleteRecord,
  onViewRecordDetails,
  theme = "dark",
}: EqaTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRecords = records.filter((r) => {
    const searchString = `${r.branch} ${r.fromDept} ${r.round} ${r.responsiblePerson || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    // Calculate custom statuses based on deadline & completion
    const todayStr = new Date().toISOString().split("T")[0];
    const isOverdue = r.status === "pending" && r.deadlineDate < todayStr;
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && r.status === "pending" && !isOverdue;
    if (statusFilter === "overdue") return matchesSearch && isOverdue;
    if (statusFilter === "submitted") return matchesSearch && (r.status === "submitted" || r.status === "completed");
    return matchesSearch;
  });

  // Date formatter for Thai Display
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
      const year = date.getFullYear() + 543; // convert to Buddhist Era
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getDeadlineIndicator = (r: EqaRecord) => {
    if (r.status === "completed" || r.status === "submitted") {
      return {
        color: "bg-emerald-500",
        tooltip: "ส่งผลประเมินเรียบร้อยแล้ว (ปกติ)",
        textColor: "text-emerald-500"
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
        color: "bg-rose-500 animate-pulse",
        tooltip: `เกินกำหนดส่งแล้ว (${Math.abs(diffDays)} วัน)`,
        textColor: "text-rose-500"
      };
    } else if (diffDays === 0) {
      return {
        color: "bg-rose-500 animate-pulse",
        tooltip: "วันนี้วันสุดท้ายในการส่งผลประเมิน!",
        textColor: "text-rose-500"
      };
    } else if (diffDays >= 1 && diffDays <= 3) {
      return {
        color: "bg-amber-500",
        tooltip: `กำหนดส่งในอีก ${diffDays} วัน (ก่อนกำหนดส่ง 1-3 วัน)`,
        textColor: "text-amber-500 font-bold"
      };
    } else {
      return {
        color: "bg-emerald-500",
        tooltip: `ปกติ (เหลือเวลาอีก ${diffDays} วัน)`,
        textColor: "text-emerald-500"
      };
    }
  };

  const getStatusBadge = (r: EqaRecord) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (r.status === "pending" && r.deadlineDate < todayStr) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>เกินกำหนดส่ง!</span>
        </span>
      );
    }

    switch (r.status) {
      case "pending":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600">
            <Clock className="h-3.5 w-3.5" />
            <span>รอดำเนินการ</span>
          </span>
        );
      case "submitted":
      case "completed":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>ส่งผลประเมินแล้ว</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col transition-all duration-300 ${
      theme === "dark" 
        ? "bg-zinc-900/50 border-zinc-800" 
        : "bg-white border-zinc-200"
    }`} id="eqa-table-card">
      
      {/* Table Header Controls */}
      <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300 ${
        theme === "dark" 
          ? "border-zinc-800/80 bg-zinc-900/20" 
          : "border-zinc-200 bg-zinc-50/50"
      }`}>
        <h2 className={`text-sm font-bold ${theme === 'dark' ? "text-zinc-100" : "text-zinc-800"}`}>
          ทะเบียนบันทึกและติดตามการรับ-ส่ง EQA
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาสาขา, ครั้งที่, หน่วยงาน..."
              className={`w-full pl-9 pr-4 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 transition-all font-medium placeholder-zinc-500 ${
                theme === "dark" 
                  ? "bg-zinc-950 border-zinc-850 text-zinc-100" 
                  : "bg-white border-zinc-250 text-zinc-800"
              }`}
              id="search-input-records"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full sm:w-auto pl-3 pr-8 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-bold appearance-none cursor-pointer ${
                theme === "dark" 
                  ? "bg-zinc-950 border-zinc-850 text-zinc-300" 
                  : "bg-white border-zinc-250 text-zinc-700"
              }`}
            >
              <option value="all">📁 แสดงทั้งหมด</option>
              <option value="pending">🟡 เฉพาะรอดำเนินการ</option>
              <option value="overdue">🔴 เฉพาะเกินกำหนดส่ง</option>
              <option value="submitted">🟢 เฉพาะส่งผลเสร็จสิ้น</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        {filteredRecords.length > 0 ? (
          <table className="w-full text-left border-collapse" id="records-table">
            <thead className={`text-xs font-bold uppercase tracking-wider border-b transition-colors duration-300 ${
              theme === "dark" 
                ? "bg-zinc-950/40 text-zinc-400 border-zinc-850" 
                : "bg-zinc-50 text-zinc-500 border-zinc-200"
            }`}>
              <tr>
                <th className="px-6 py-4">วันรับตัวอย่าง</th>
                <th className="px-6 py-4">รอบ/ครั้งที่</th>
                <th className="px-6 py-4">สาขางาน</th>
                <th className="px-6 py-4">จากหน่วยงาน</th>
                <th className="px-6 py-4">วันกำหนดส่ง</th>
                <th className="px-6 py-4">ผู้รับผิดชอบ</th>
                <th className="px-6 py-4">สถานะส่งผล</th>
                <th className="px-6 py-4 text-center">แจ้งเตือน</th>
                <th className="px-6 py-4 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs transition-colors duration-300 ${
              theme === "dark" 
                ? "divide-zinc-850 text-zinc-300" 
                : "divide-zinc-150 text-zinc-700"
            }`}>
              {filteredRecords.map((r) => {
                const pendingAlertsCount = r.alerts?.filter((a) => a.status === "pending").length || 0;
                return (
                  <tr key={r.id} className={`transition-colors border-zinc-850 ${
                    theme === "dark" 
                      ? "hover:bg-zinc-800/20" 
                      : "hover:bg-zinc-50/70"
                  }`}>
                    
                    {/* Receive Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span className={`font-semibold ${theme === 'dark' ? "text-zinc-200" : "text-zinc-850"}`}>{formatThaiDate(r.receiveDate)}</span>
                      </div>
                    </td>

                    {/* Round / No. */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-mono border px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        theme === "dark" 
                          ? "bg-zinc-800 text-zinc-300 border-zinc-700/80" 
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}>
                        {r.round}
                      </span>
                    </td>

                    {/* Laboratory Branch */}
                    <td className={`px-6 py-4 whitespace-nowrap font-bold ${theme === 'dark' ? "text-zinc-100" : "text-zinc-900"}`}>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const indicator = getDeadlineIndicator(r);
                          return (
                            <>
                              <span 
                                className={`w-2 h-4 rounded-xs shrink-0 ${indicator.color}`} 
                                title={indicator.tooltip}
                              />
                              <span>{r.branch}</span>
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Source Organization */}
                    <td className={`px-6 py-4 font-medium max-w-[180px] truncate ${theme === 'dark' ? "text-zinc-400" : "text-zinc-600"}`} title={r.fromDept}>
                      {r.fromDept}
                    </td>

                    {/* Deadline date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-rose-500">{formatThaiDate(r.deadlineDate)}</span>
                    </td>

                    {/* Responsible person */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className={theme === 'dark' ? "text-zinc-400" : "text-zinc-600"}>{r.responsiblePerson || "ไม่ระบุ"}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(r)}
                    </td>

                    {/* Reminder Info Count */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {pendingAlertsCount > 0 ? (
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-bold animate-pulse" title={`มีตั้งเวลาเตือนรอดำเนินการ ${pendingAlertsCount} รายการ`}>
                          <Bell className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{pendingAlertsCount}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>

                    {/* Actions panel */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onViewRecordDetails(r)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                            theme === 'dark' 
                              ? "text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800" 
                              : "text-zinc-600 hover:text-cyan-600 hover:bg-zinc-100 hover:border-zinc-200"
                          }`}
                          title="ดูและอัปเดตสถานะรับ-ส่ง"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>

                        <button
                          onClick={() => onEditRecord(r)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                            theme === 'dark' 
                              ? "text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800" 
                              : "text-zinc-600 hover:text-indigo-600 hover:bg-zinc-100 hover:border-zinc-200"
                          }`}
                          title="แก้ไขรายละเอียด"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                            theme === 'dark' 
                              ? "text-zinc-500 hover:text-rose-400 hover:bg-zinc-850" 
                              : "text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                          }`}
                          title="ลบบันทึก"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={`p-12 text-center transition-colors duration-300 ${theme === 'dark' ? "text-zinc-500" : "text-zinc-400 bg-white"}`}>
            <p className="font-bold text-sm">ไม่พบข้อมูลทะเบียน EQA ที่ตรงกับเงื่อนไข</p>
            <p className="text-xs mt-1">ลองล้างค่าค้นหา หรือคลิก "บันทึก EQA" เพื่อสร้างรายการแรกของคุณ</p>
          </div>
        )}
      </div>
    </div>
  );
}
