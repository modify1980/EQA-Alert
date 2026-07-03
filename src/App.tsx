import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Stats from "./components/Stats";
import EqaTable from "./components/EqaTable";
import NotificationLogs from "./components/NotificationLogs";
import SettingsModal from "./components/SettingsModal";
import OcrModal from "./components/OcrModal";
import RecordModal from "./components/RecordModal";
import RecordDetailsModal from "./components/RecordDetailsModal";
import EqaCalendar from "./components/EqaCalendar";
import AdminPinModal from "./components/AdminPinModal";
import UserManualModal from "./components/UserManualModal";
import ReportModal from "./components/ReportModal";
import { EqaRecord, AppSettings, NotificationLog } from "./types";
import { RefreshCw, Sparkles, BookOpen, Clock, ShieldCheck, Heart, List, Calendar, Bell, X, FileSpreadsheet } from "lucide-react";

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_DAYS = [
  "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"
];

export default function App() {
  // Live states
  const [records, setRecords] = useState<EqaRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    lineChannelAccessToken: "",
    lineSendType: "broadcast",
    lineTargetId: "",
    lineNotifyActive: true,
    enableSoundAlerts: true,
    lineGroupUrl: "https://line.me/ti/g/Opx608h97X",
  });
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'calendar' | 'logs'>('table');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem("eqa_theme");
      return (stored === "light" || stored === "dark") ? stored : "dark";
    } catch {
      return "dark";
    }
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("eqa_theme", nextTheme);
    } catch (e) {
      console.error(e);
    }
  };

  const [showBanner, setShowBanner] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("eqa_banner_dismissed");
      return stored !== "true";
    } catch {
      return true;
    }
  });

  const handleDismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("eqa_banner_dismissed", "true");
    } catch (e) {
      console.error(e);
    }
  };

  // Modal open states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem("eqa_is_admin") === "true";
    } catch {
      return false;
    }
  });
  const [adminActionQueue, setAdminActionQueue] = useState<{
    type: "edit" | "delete" | "toggle";
    payload?: any;
  } | null>(null);

  // Selection states
  const [recordToEdit, setRecordToEdit] = useState<EqaRecord | null>(null);
  const [selectedRecordDetails, setSelectedRecordDetails] = useState<EqaRecord | null>(null);

  // Clock state
  const [timeString, setTimeString] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Update Thai Buddhist Era clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dayName = THAI_DAYS[now.getDay()];
      const dayNum = now.getDate();
      const monthName = THAI_MONTHS_FULL[now.getMonth()];
      const yearBE = now.getFullYear() + 543;
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      
      setTimeString(`วัน${dayName}ที่ ${dayNum} ${monthName} พ.ศ. ${yearBE} เวลา ${hours}:${minutes}:${seconds} น.`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all database records, settings, and logs from back-end Express API
  const fetchAllData = async () => {
    try {
      const [recordsRes, settingsRes, logsRes] = await Promise.all([
        fetch("/api/records"),
        fetch("/api/settings"),
        fetch("/api/logs"),
      ]);

      if (recordsRes.ok && settingsRes.ok && logsRes.ok) {
        const recordsData = await recordsRes.json();
        const settingsData = await settingsRes.json();
        const logsData = await logsRes.json();

        setRecords(recordsData);
        setSettings(settingsData);
        setLogs(logsData);

        const now = new Date();
        const yearBE = now.getFullYear() + 543;
        const timeStr = `${now.getDate()} ${THAI_MONTHS_FULL[now.getMonth()]} พ.ศ. ${yearBE} เวลา ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} น.`;
        setLastUpdated(timeStr);
      }
    } catch (err) {
      console.error("Error fetching data from server:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllData();

    // Setup periodic polling (every 10 seconds) to sync real-time alerts fired by background worker
    const syncInterval = setInterval(fetchAllData, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        // Force immediate check of background alerts in case token changed
        await fetch("/api/alerts/trigger-check", { method: "POST" });
        fetchAllData();
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  // Create or Update Record
  const handleSaveRecord = async (payload: Omit<EqaRecord, "id" | "createdAt"> & { id?: string }) => {
    const isEditing = !!payload.id;
    const url = isEditing ? `/api/records/${payload.id}` : "/api/records";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Trigger immediate background check to check for any alerts scheduled in the past or immediately
        await fetch("/api/alerts/trigger-check", { method: "POST" });
        fetchAllData();
      } else {
        throw new Error("Failed to save EQA record");
      }
    } catch (err) {
      console.error("Error saving EQA record:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // Save Lifecycle details (Columns 7-10 in the printed table sheet)
  const handleSaveLifecycle = async (id: string, updates: Partial<EqaRecord>) => {
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        fetchAllData();
      } else {
        throw new Error("Failed to update record lifecycle");
      }
    } catch (err) {
      console.error("Error updating lifecycle:", err);
      alert("ไม่สามารถบันทึกข้อมูลขั้นตอนส่งผลได้");
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบทะเบียน EQA และรายการเวลาแจ้งเตือนทั้งหมดของรายการนี้? (การทำงานนี้ไม่สามารถย้อนกลับได้)")) {
      return;
    }

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAllData();
      } else {
        throw new Error("Failed to delete record");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // Admin authentication handlers
  const handleAdminSuccess = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem("eqa_is_admin", "true");
    } catch (e) {
      console.error(e);
    }

    if (adminActionQueue) {
      if (adminActionQueue.type === "edit") {
        setRecordToEdit(adminActionQueue.payload);
        setIsAddRecordOpen(true);
      } else if (adminActionQueue.type === "delete") {
        handleDeleteRecord(adminActionQueue.payload);
      }
      setAdminActionQueue(null);
    }
  };

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      try {
        localStorage.setItem("eqa_is_admin", "false");
      } catch (e) {
        console.error(e);
      }
    } else {
      setAdminActionQueue({ type: "toggle" });
      setIsAdminPinModalOpen(true);
    }
  };

  const handleProtectedEdit = (rec: EqaRecord) => {
    if (isAdmin) {
      setRecordToEdit(rec);
      setIsAddRecordOpen(true);
    } else {
      setAdminActionQueue({ type: "edit", payload: rec });
      setIsAdminPinModalOpen(true);
    }
  };

  const handleProtectedDelete = (id: string) => {
    if (isAdmin) {
      handleDeleteRecord(id);
    } else {
      setAdminActionQueue({ type: "delete", payload: id });
      setIsAdminPinModalOpen(true);
    }
  };

  // Import batch of records scanned via AI OCR
  const handleImportOcrRecords = async (scannedRecords: any[]) => {
    let successCount = 0;
    try {
      for (const scanned of scannedRecords) {
        // Pre-create standard default alarm warning rules for each imported record
        const deadlineObj = new Date(scanned.deadlineDate);
        const alertsList: any[] = [];
        
        if (!isNaN(deadlineObj.getTime())) {
          // Warning 3 days before at 9:00 AM
          const threeDaysBefore = new Date(deadlineObj);
          threeDaysBefore.setDate(deadlineObj.getDate() - 3);
          threeDaysBefore.setHours(9, 0, 0, 0);

          // Warning 1 day before at 9:00 AM
          const oneDayBefore = new Date(deadlineObj);
          oneDayBefore.setDate(deadlineObj.getDate() - 1);
          oneDayBefore.setHours(9, 0, 0, 0);

          const formatDateLocal = (date: Date) => {
            const pad = (num: number) => String(num).padStart(2, "0");
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
          };

          alertsList.push(
            {
              id: "al_" + Math.random().toString(36).substring(2, 9),
              topicType: 'deadline_warning',
              remindAt: formatDateLocal(threeDaysBefore),
              notifyLine: !!settings.lineChannelAccessToken && settings.lineNotifyActive,
              notifyWeb: true,
              status: 'pending'
            },
            {
              id: "al_" + Math.random().toString(36).substring(2, 9),
              topicType: 'deadline_warning',
              remindAt: formatDateLocal(oneDayBefore),
              notifyLine: !!settings.lineChannelAccessToken && settings.lineNotifyActive,
              notifyWeb: true,
              status: 'pending'
            }
          );
        }

        const payload = {
          receiveDate: scanned.receiveDate || new Date().toISOString().split("T")[0],
          fromDept: scanned.fromDept || "หน่วยงานภายนอก",
          branch: scanned.branch || "เคมี",
          deadlineDate: scanned.deadlineDate || new Date().toISOString().split("T")[0],
          round: scanned.round || "1/69",
          responsiblePerson: scanned.responsiblePerson || "",
          status: 'pending' as const,
          alerts: alertsList,
        };

        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) successCount++;
      }

      await fetch("/api/alerts/trigger-check", { method: "POST" });
      fetchAllData();
      alert(`นำเข้าข้อมูล EQA ด้วยระบบ AI สำเร็จเรียบร้อยแล้ว จำนวน ${successCount} รายการ!`);
    } catch (err) {
      console.error("Error importing OCR records:", err);
      alert("เกิดข้อผิดพลาดในการนำเข้าข้อมูลบางรายการ");
    }
  };

  // Clear all logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  // Export active tab content or entire workspace as JPG with "last updated" info
  const handleExportJpg = async () => {
    const node = document.getElementById("export-container");
    if (!node) {
      alert("ไม่พบข้อมูลสำหรับการส่งออกรูปภาพ");
      return;
    }

    setIsExporting(true);

    try {
      // Small delay to let state change render
      await new Promise((resolve) => setTimeout(resolve, 350));

      const { toJpeg } = await import("html-to-image");

      const bgColor = theme === "dark" ? "#09090b" : "#ffffff";
      const originalStyle = node.style.cssText;

      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        backgroundColor: bgColor,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: node.offsetWidth + "px",
          height: node.offsetHeight + "px",
        }
      });

      node.style.cssText = originalStyle;

      const link = document.createElement("a");
      const viewName = activeTab === "table" ? "table" : activeTab === "calendar" ? "calendar" : "logs";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `eqa_alert_memo_${viewName}_${timestamp}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting JPG:", err);
      alert("เกิดข้อผิดพลาดในการส่งออกรูปภาพ JPG กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300 ${
      theme === 'dark' 
        ? "bg-zinc-950 text-zinc-100" 
        : "bg-zinc-50 text-zinc-900"
    }`} id="app-root-container">
      
      {/* Header component */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddRecord={() => {
          setRecordToEdit(null);
          setIsAddRecordOpen(true);
        }}
        onOpenOcr={() => setIsOcrOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        timeString={timeString}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Banner with brief introduction */}
        {showBanner && (
          <div className={`border p-5 rounded-2xl mb-4 relative overflow-hidden transition-all duration-300 ${
            theme === 'dark'
              ? "bg-gradient-to-r from-indigo-950/40 via-zinc-900/80 to-zinc-950 border-zinc-800 text-zinc-100"
              : "bg-gradient-to-r from-indigo-50/50 via-indigo-100/20 to-cyan-50/20 border-indigo-100 text-zinc-900 shadow-xs"
          }`} id="welcome-banner">
            <button
              onClick={handleDismissBanner}
              className={`absolute top-3 right-3 p-1 rounded-lg transition-all cursor-pointer z-20 ${
                theme === 'dark' ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              }`}
              title="ปิดแนะนำระบบ"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="max-w-4xl space-y-2 pr-6">
                <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 animate-pulse shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span>ยินดีต้อนรับสู่ระบบ EQA Alert Memo </span>
                </h2>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? "text-zinc-400" : "text-zinc-650"}`}>
                  เครื่องมืออำนวยความสะดวกสำหรับห้องปฏิบัติการทางการแพทย์ ในการบันทึกคุมเอกสารการประเมินคุณภาพจากภายนอก (EQA) 
                  รองรับการอัปโหลดตารางเพื่อแปลงเป็นพิมพ์ดิจิทัลด้วย AI และตั้งค่าแจ้งเตือนผ่านสมาร์ทโฟน LINE Official Account เข้ากลุ่มของท่านตามกำหนดอย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Unified Full-Width Tab Layout */}
        <div className="space-y-4" id="dashboard-main-area">
          {/* Visual View Switcher (3 Tabs) & Export Button */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3" id="view-tabs-header">
            <div className={`flex p-1 rounded-xl border flex-1 max-w-2xl transition-all ${
              theme === 'dark'
                ? "bg-zinc-900/40 border-zinc-850"
                : "bg-zinc-100 border-zinc-250/60 shadow-2xs"
            }`} id="tabs-container">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'table'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : theme === 'dark'
                      ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white"
                }`}
                id="tab-view-table"
              >
                <List className="h-4 w-4" />
                <span>ตารางทะเบียน EQA (Table)</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : theme === 'dark'
                      ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white"
                }`}
                id="tab-view-calendar"
              >
                <Calendar className="h-4 w-4" />
                <span>ปฏิทินส่งงาน EQA (Calendar)</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : theme === 'dark'
                      ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white"
                }`}
                id="tab-view-logs"
              >
                <Bell className="h-4 w-4" />
                <span>ประวัติแจ้งเตือนล่าสุด ({logs.length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Report Generation Button */}
              <button
                onClick={() => setIsReportOpen(true)}
                className={`flex items-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  theme === 'dark'
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-2xs"
                }`}
                title="สร้างรายงานทะเบียนและสรุปผล EQA ทุกสถานะส่งผล"
                id="btn-open-report"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500" />
                <span>สร้างรายงานทะเบียน EQA</span>
              </button>

              {/* JPG Export Button */}
              <button
                onClick={handleExportJpg}
                disabled={isExporting}
                className={`flex items-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  theme === 'dark'
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                } ${isExporting ? "opacity-60 cursor-not-allowed" : ""}`}
                title="ส่งออกหน้าตารางหรือปฏิทินเป็นรูปภาพ JPG"
                id="btn-export-jpg"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>กำลังส่งออก...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>ส่งออกหน้านี้เป็น JPG</span>
                  </>
                )}
              </button>

              {!showBanner && (
                <button
                  onClick={() => setShowBanner(true)}
                  className={`flex items-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-white shadow-2xs"
                  }`}
                  id="btn-show-intro"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>แสดงคำแนะนำระบบ</span>
                </button>
              )}
            </div>
          </div>

          {/* Captured Area for JPG Export */}
          <div 
            id="export-container" 
            className={`space-y-5 rounded-2xl transition-all duration-300 ${
              isExporting 
                ? theme === 'dark'
                  ? 'p-8 bg-zinc-950 border border-zinc-900' 
                  : 'p-8 bg-white border border-zinc-250/60 shadow-md' 
                : ''
            }`}
          >
            {/* Header/Watermark info for exported JPG & visual information */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3 ${
              theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'
            }`}>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-indigo-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 animate-pulse text-emerald-400" />
                  <span>EQA Quality Control Memo Dashboard</span>
                </h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>
                  ระบบควบคุมเอกสารการประเมินคุณภาพ (EQA) โรงพยาบาลสมเด็จพระยุพราชเดชอุดม
                </p>
              </div>
              <div className="sm:text-right space-y-1 w-full sm:w-auto">
                <p className={`text-xs font-semibold flex items-center sm:justify-end gap-1.5 ${
                  theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'
                }`}>
                  <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>ปรับปรุงข้อมูลล่าสุด: {lastUpdated || "กำลังซิงค์..."}</span>
                </p>
                <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  พิมพ์เอกสารดิจิทัลอัจฉริยะร่วมกับระบบ AI
                </p>
              </div>
            </div>

            {/* Render Stats Dashboard inside exported container */}
            <Stats records={records} theme={theme} />

            {/* Active Tab View Rendering */}
            <div className="w-full animate-fade-in" id="tab-content-container">
              {activeTab === 'table' && (
                <EqaTable
                  records={records}
                  onEditRecord={handleProtectedEdit}
                  onDeleteRecord={handleProtectedDelete}
                  onViewRecordDetails={(rec) => {
                    setSelectedRecordDetails(rec);
                    setIsDetailsOpen(true);
                  }}
                  theme={theme}
                />
              )}

              {activeTab === 'calendar' && (
                <EqaCalendar
                  records={records}
                  onViewRecordDetails={(rec) => {
                    setSelectedRecordDetails(rec);
                    setIsDetailsOpen(true);
                  }}
                  onEditRecord={handleProtectedEdit}
                  theme={theme}
                />
              )}

              {activeTab === 'logs' && (
                <div className="max-w-4xl mx-auto">
                  <NotificationLogs
                    logs={logs}
                    onClearLogs={handleClearLogs}
                    onRefresh={fetchAllData}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer credits */}
      <footer className={`mt-20 border-t py-6 text-center text-[11px] font-medium transition-colors duration-300 ${
        theme === 'dark'
          ? "border-zinc-900 bg-zinc-950 text-zinc-500"
          : "border-zinc-200 bg-white text-zinc-600 shadow-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <BookOpen className={`h-4 w-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <span>EQA Quality Control Memo Dashboard &copy; 2026</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>พัฒนาขึ้นด้วย</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 shrink-0" />
            <span>ร่วมกับ Gemini 3.5 AI สำหรับงานวิชาการห้องแล็บวิจัยทางการแพทย์</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        theme={theme}
      />

      {/* Record Creation Form Modal */}
      <RecordModal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        onSave={handleSaveRecord}
        recordToEdit={recordToEdit}
        lineConfigured={!!settings.lineChannelAccessToken && settings.lineNotifyActive}
        theme={theme}
      />

      {/* AI OCR Scanner Modal */}
      <OcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onImportRecords={handleImportOcrRecords}
        theme={theme}
      />

      {/* EQA Lifecycle details update modal (Columns 7-10 in the paper document) */}
      <RecordDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        record={selectedRecordDetails}
        onSaveLifecycle={handleSaveLifecycle}
        theme={theme}
      />

      {/* Admin Authentication PIN Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => {
          setIsAdminPinModalOpen(false);
          setAdminActionQueue(null);
        }}
        onSuccess={handleAdminSuccess}
        theme={theme}
      />

      {/* EQA User Manual Operational Guide Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        theme={theme}
      />

      {/* EQA Comprehensive Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        records={records}
        theme={theme}
      />
    </div>
  );
}
