import React from "react";
import { ListTodo, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { EqaRecord } from "../types";

interface StatsProps {
  records: EqaRecord[];
  theme?: "light" | "dark";
}

export default function Stats({ records, theme = "dark" }: StatsProps) {
  const total = records.length;
  
  const pending = records.filter(r => r.status === "pending").length;
  const submitted = records.filter(r => r.status === "submitted" || r.status === "completed").length;
  
  // Calculate overdue records (pending status and deadline date is earlier than today)
  const todayStr = new Date().toISOString().split("T")[0];
  const overdue = records.filter(r => r.status === "pending" && r.deadlineDate < todayStr).length;

  // Calculate total active alerts scheduled
  const activeAlerts = records.reduce((acc, r) => {
    const pendingAlertsInRecord = r.alerts?.filter(a => a.status === "pending").length || 0;
    return acc + pendingAlertsInRecord;
  }, 0);

  const cardBgClass = theme === "dark" 
    ? "bg-zinc-900/50 border-zinc-800" 
    : "bg-white border-zinc-200 shadow-2xs";

  const textPrimaryClass = theme === "dark" ? "text-zinc-100" : "text-zinc-900";
  const textLabelClass = theme === "dark" ? "text-zinc-500" : "text-zinc-500";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in" id="dashboard-stats">
      {/* Total Records */}
      <div className={`${cardBgClass} border p-4 rounded-2xl flex items-center space-x-4 transition-colors duration-300`}>
        <div className={`p-3 rounded-xl border ${
          theme === "dark" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
        }`}>
          <ListTodo className="h-6 w-6" />
        </div>
        <div>
          <p className={`text-xs font-semibold ${textLabelClass} uppercase tracking-wider`}>บันทึก EQA ทั้งหมด</p>
          <p className={`text-2xl font-bold ${textPrimaryClass} font-mono mt-0.5`}>{total}</p>
        </div>
      </div>

      {/* Pending Action */}
      <div className={`${cardBgClass} border p-4 rounded-2xl flex items-center space-x-4 transition-colors duration-300`}>
        <div className={`p-3 rounded-xl border ${
          theme === "dark" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-100"
        }`}>
          <Clock className="h-6 w-6 text-amber-500 animate-spin-slow" />
        </div>
        <div>
          <p className={`text-xs font-semibold ${textLabelClass} uppercase tracking-wider`}>รอดำเนินการส่งผล</p>
          <p className={`text-2xl font-bold ${textPrimaryClass} font-mono mt-0.5`}>{pending}</p>
        </div>
      </div>

      {/* Submitted / Completed */}
      <div className={`${cardBgClass} border p-4 rounded-2xl flex items-center space-x-4 transition-colors duration-300`}>
        <div className={`p-3 rounded-xl border ${
          theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"
        }`}>
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className={`text-xs font-semibold ${textLabelClass} uppercase tracking-wider`}>ส่งผลเสร็จสิ้น</p>
          <p className={`text-2xl font-bold ${textPrimaryClass} font-mono mt-0.5`}>{submitted}</p>
        </div>
      </div>

      {/* Overdue or Active Alerts */}
      <div className={`${cardBgClass} border p-4 rounded-2xl flex items-center space-x-4 transition-colors duration-300`}>
        <div className={`p-3 rounded-xl border ${
          overdue > 0 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
            : theme === "dark" 
              ? "bg-violet-500/10 text-violet-400 border-violet-500/20" 
              : "bg-violet-50 text-violet-600 border-violet-100"
        }`}>
          {overdue > 0 ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </div>
        <div>
          {overdue > 0 ? (
            <>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">เกินกำหนดส่ง!</p>
              <p className="text-2xl font-bold text-rose-500 font-mono mt-0.5">{overdue}</p>
            </>
          ) : (
            <>
              <p className={`text-xs font-semibold ${textLabelClass} uppercase tracking-wider`}>ตั้งเวลาแจ้งเตือนไว้</p>
              <p className={`text-2xl font-bold ${textPrimaryClass} font-mono mt-0.5`}>{activeAlerts}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
