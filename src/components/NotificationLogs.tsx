import React from "react";
import { Bell, Trash2, Smartphone, Monitor, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { NotificationLog } from "../types";

interface NotificationLogsProps {
  logs: NotificationLog[];
  onClearLogs: () => void;
  onRefresh: () => void;
  theme?: "light" | "dark";
}

export default function NotificationLogs({
  logs,
  onClearLogs,
  onRefresh,
  theme = "dark",
}: NotificationLogsProps) {
  
  // Format dates for display
  const formatThaiDateTime = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const day = date.getDate();
      const month = thMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds} น.`;
    } catch {
      return isoStr;
    }
  };

  const getLogTypeBadge = (type: string) => {
    const isDark = theme === "dark";
    switch (type) {
      case "deadline_warning":
        return (
          <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
            isDark 
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            ⚠️ กำหนดส่งผล
          </span>
        );
      case "sample_received":
        return (
          <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
            isDark 
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
              : "bg-indigo-50 text-indigo-700 border-indigo-200"
          }`}>
            📦 รับตัวอย่าง
          </span>
        );
      case "results_received":
        return (
          <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
            isDark 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            📑 ผลประเมิน
          </span>
        );
      default:
        return (
          <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
            isDark 
              ? "bg-zinc-800 text-zinc-300 border-zinc-700" 
              : "bg-zinc-100 text-zinc-600 border-zinc-200"
          }`}>
            🔔 แจ้งเตือน
          </span>
        );
    }
  };

  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col h-full transition-all duration-300 ${
      theme === "dark" 
        ? "bg-zinc-900/50 border-zinc-800" 
        : "bg-white border-zinc-200"
    }`} id="logs-panel-card">
      {/* Header controls */}
      <div className={`p-3.5 border-b flex items-center justify-between transition-colors duration-300 ${
        theme === "dark" 
          ? "border-zinc-800 bg-zinc-900/20" 
          : "border-zinc-200 bg-zinc-50/50"
      }`}>
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-indigo-500 shrink-0" />
          <h2 className={`text-xs font-bold ${theme === 'dark' ? "text-zinc-100" : "text-zinc-800"}`}>
            ประวัติการแจ้งเตือนและการทำงานล่าสุด (Compact Mode)
          </h2>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRefresh}
            className={`p-1 rounded-md transition-colors ${
              theme === "dark" ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            }`}
            title="รีเฟรชประวัติ"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {logs.length > 0 && (
            <button
              onClick={() => {
                if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติแจ้งเตือนทั้งหมด?")) {
                  onClearLogs();
                }
              }}
              className={`p-1 rounded-md transition-colors ${
                theme === "dark" ? "text-zinc-500 hover:text-rose-400 hover:bg-zinc-850" : "text-zinc-450 hover:text-rose-600 hover:bg-rose-50"
              }`}
              title="ล้างประวัติ"
              id="btn-clear-notification-logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[440px] scrollbar-thin">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border transition-all text-[11px] flex flex-col space-y-1.5 ${
                log.status === "failed"
                  ? "bg-rose-500/5 border-rose-500/10"
                  : theme === "dark"
                    ? "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/70"
                    : "bg-zinc-50/55 border-zinc-200/80 hover:bg-zinc-100/50"
              }`}
            >
              {/* Header inside log item */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-1.5 min-w-0">
                  {getLogTypeBadge(log.type)}
                  <span className={`font-bold truncate max-w-[150px] ${theme === 'dark' ? "text-zinc-300" : "text-zinc-800"}`} title={log.recordTitle}>
                    {log.recordTitle}
                  </span>
                </div>
                
                <span className={`text-[9px] font-mono shrink-0 ${theme === 'dark' ? "text-zinc-500" : "text-zinc-400"}`}>
                  {formatThaiDateTime(log.timestamp)}
                </span>
              </div>

              {/* Message block */}
              <p className={`leading-relaxed font-bold whitespace-pre-line p-2 rounded-lg border font-mono text-[10px] ${
                theme === "dark" 
                  ? "text-zinc-300 bg-zinc-900/50 border-zinc-800/40" 
                  : "text-zinc-700 bg-white border-zinc-150 shadow-3xs"
              }`}>
                {log.message}
              </p>

              {/* Channel and Result tags */}
              <div className="flex justify-between items-center pt-0.5">
                {/* Channel icon indicators */}
                <div className="flex items-center space-x-1.5 text-[9px] text-zinc-500">
                  <span>ช่องทาง:</span>
                  {(log.channel === "line" || log.channel === "both") && (
                    <span className={`flex items-center space-x-0.5 px-1 py-0.2 rounded border ${
                      theme === "dark" 
                        ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" 
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}>
                      <Smartphone className="h-2.5 w-2.5" />
                      <span>LINE</span>
                    </span>
                  )}
                  {(log.channel === "web" || log.channel === "both") && (
                    <span className={`flex items-center space-x-0.5 px-1 py-0.2 rounded border ${
                      theme === "dark" 
                        ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" 
                        : "text-indigo-700 bg-indigo-50 border-indigo-200"
                    }`}>
                      <Monitor className="h-2.5 w-2.5" />
                      <span>หน้าเว็บ</span>
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center">
                  {log.status === "failed" ? (
                    <div className={`flex items-center space-x-0.5 px-1 py-0.2 rounded border text-[9px] ${
                      theme === "dark" 
                        ? "text-rose-400 bg-rose-500/5 border-rose-500/10" 
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}>
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span className="font-bold">ไม่สำเร็จ</span>
                    </div>
                  ) : (
                    <div className={`flex items-center space-x-0.5 px-1 py-0.2 rounded border text-[9px] ${
                      theme === "dark" 
                        ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" 
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}>
                      <CheckCircle className="h-2.5 w-2.5" />
                      <span className="font-bold">สำเร็จ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Print error detail if failed */}
              {log.error && (
                <div className={`p-1.5 rounded-lg text-[9px] leading-relaxed font-mono border ${
                  theme === "dark" 
                    ? "bg-rose-950/40 text-rose-300 border-rose-900/30" 
                    : "bg-rose-50 text-rose-700 border-rose-155"
                }`}>
                  {log.error}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs">
            <Bell className={`h-6 w-6 mx-auto mb-1.5 ${theme === "dark" ? "text-zinc-800" : "text-zinc-300"}`} />
            <p className={`font-semibold text-[11px] ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>ไม่มีประวัติการแจ้งเตือน</p>
          </div>
        )}
      </div>
    </div>
  );
}
