import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Calendar, Bell, Info, ShieldAlert } from "lucide-react";
import { EqaRecord, AlertSchedule } from "../types";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<EqaRecord, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  recordToEdit?: EqaRecord | null;
  lineConfigured: boolean;
  theme?: "light" | "dark";
}

const QUICK_BRANCHES = ["เคมี (Chemistry)", "ธนาคารเลือด (Blood Bank)", "โลหิตวิทยา (Hematology)", "จุลชีววิทยา (Microbiology)", "ภูมิคุ้มกันวิทยา (Immunology)", "จุลทรรศน์ศาสตร์ (Microscopy)"];
const QUICK_DEPTS = [
  { label: "กรมวิทยาศาสตร์การแพทย์", value: "กรมวิทยาศาสตร์การแพทย์" },
  { label: "ม.มหิดล", value: "มหาวิทยาลัยมหิดล" },
  { label: "ม.เชียงใหม่", value: "มหาวิทยาลัยเชียงใหม่" }
];

export default function RecordModal({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  lineConfigured,
  theme = "dark",
}: RecordModalProps) {
  const [receiveDate, setReceiveDate] = useState("");
  const [fromDept, setFromDept] = useState("");
  const [branch, setBranch] = useState("");
  const [round, setRound] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<'pending' | 'submitted' | 'completed' | 'overdue'>('pending');
  
  // Custom alert rules array
  const [alerts, setAlerts] = useState<AlertSchedule[]>([]);

  // Sub-form for adding a new alert item
  const [newTopicType, setNewTopicType] = useState<'deadline_warning' | 'sample_received' | 'results_received' | 'custom'>('deadline_warning');
  const [newCustomTopic, setNewCustomTopic] = useState("");
  const [newRemindAt, setNewRemindAt] = useState("");
  const [newNotifyLine, setNewNotifyLine] = useState(true);
  const [newNotifyWeb, setNewNotifyWeb] = useState(true);

  useEffect(() => {
    if (recordToEdit) {
      setReceiveDate(recordToEdit.receiveDate || "");
      setFromDept(recordToEdit.fromDept || "");
      setBranch(recordToEdit.branch || "");
      setRound(recordToEdit.round || "");
      setDeadlineDate(recordToEdit.deadlineDate || "");
      setResponsiblePerson(recordToEdit.responsiblePerson || "");
      setNotes(recordToEdit.notes || "");
      setStatus(recordToEdit.status || 'pending');
      setAlerts(recordToEdit.alerts || []);
    } else {
      // Set sensible defaults for a new record
      const today = new Date().toISOString().split("T")[0];
      setReceiveDate(today);
      setFromDept("ศูนย์วิทยาศาสตร์การแพทย์");
      setBranch("");
      setRound("");
      setDeadlineDate("");
      setResponsiblePerson("");
      setNotes("");
      setStatus('pending');
      setAlerts([]);
    }
  }, [recordToEdit, isOpen]);

  // Set default alert schedules based on deadline input
  useEffect(() => {
    if (deadlineDate && alerts.length === 0 && !recordToEdit) {
      // Auto-schedule standard warnings to help the user!
      try {
        const deadlineObj = new Date(deadlineDate);
        if (!isNaN(deadlineObj.getTime())) {
          const threeDaysBefore = new Date(deadlineObj);
          threeDaysBefore.setDate(deadlineObj.getDate() - 3);
          threeDaysBefore.setHours(9, 0, 0, 0); // 9:00 AM

          const oneDayBefore = new Date(deadlineObj);
          oneDayBefore.setDate(deadlineObj.getDate() - 1);
          oneDayBefore.setHours(9, 0, 0, 0); // 9:00 AM

          // Format to datetimelocal YYYY-MM-DDTHH:mm
          const formatDateLocal = (date: Date) => {
            const pad = (num: number) => String(num).padStart(2, "0");
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
          };

          setAlerts([
            {
              id: "al_" + Math.random().toString(36).substring(2, 9),
              topicType: 'deadline_warning',
              remindAt: formatDateLocal(threeDaysBefore),
              notifyLine: lineConfigured,
              notifyWeb: true,
              status: 'pending'
            },
            {
              id: "al_" + Math.random().toString(36).substring(2, 9),
              topicType: 'deadline_warning',
              remindAt: formatDateLocal(oneDayBefore),
              notifyLine: lineConfigured,
              notifyWeb: true,
              status: 'pending'
            }
          ]);
        }
      } catch (e) {
        console.error("Auto scheduling failed:", e);
      }
    }
  }, [deadlineDate, recordToEdit]);

  if (!isOpen) return null;

  const handleAddAlertItem = () => {
    if (!newRemindAt) {
      alert("กรุณาระบุวันและเวลาแจ้งเตือน");
      return;
    }

    if (newTopicType === "custom" && !newCustomTopic.trim()) {
      alert("กรุณาระบุหัวข้อการแจ้งเตือนแบบกำหนดเอง");
      return;
    }

    const newAlert: AlertSchedule = {
      id: "al_" + Math.random().toString(36).substring(2, 9),
      topicType: newTopicType,
      customTopic: newTopicType === "custom" ? newCustomTopic : undefined,
      remindAt: newRemindAt,
      notifyLine: newNotifyLine,
      notifyWeb: newNotifyWeb,
      status: 'pending',
    };

    setAlerts([...alerts, newAlert]);
    // Clear sub-form
    setNewCustomTopic("");
    setNewRemindAt("");
  };

  const handleRemoveAlertItem = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveDate || !fromDept || !branch || !deadlineDate || !round) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }

    const payload = {
      receiveDate,
      fromDept,
      branch,
      deadlineDate,
      round,
      responsiblePerson,
      notes,
      status,
      alerts,
    };

    try {
      await onSave(recordToEdit ? { ...payload, id: recordToEdit.id } : payload);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper translations for Thai UI
  const getTopicLabel = (type: string, custom?: string) => {
    switch (type) {
      case 'deadline_warning': return "⚠️ แจ้งเตือนครบกำหนดส่งผลประเมิน";
      case 'sample_received': return "📦 แจ้งเตือนได้รับตัวอย่างตรวจ";
      case 'results_received': return "📑 แจ้งเตือนประกาศผลการประเมินรอบนั้น";
      case 'custom': return `🔔 ${custom || "แจ้งเตือนทั่วไป"}`;
      default: return "🔔 แจ้งเตือน";
    }
  };

  const formatThaiDateString = (isoStr: string) => {
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
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in backdrop-blur-md transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-950/85" : "bg-zinc-900/40"
      }`} 
      id="record-modal-backdrop"
    >
      <div 
        className={`border rounded-2xl shadow-2xl w-full max-w-6xl h-[96vh] lg:h-[88vh] max-h-[96vh] overflow-hidden flex flex-col animate-scale-up transition-all duration-300 ${
          theme === "dark" 
            ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
            : "bg-white border-zinc-200 text-zinc-800"
        }`} 
        id="record-modal-container"
      >
        
        {/* Modal Header */}
        <div className={`p-5 border-b flex justify-between items-center transition-colors duration-300 ${
          theme === "dark" 
            ? "border-zinc-800 bg-zinc-900/20" 
            : "border-zinc-150 bg-zinc-50/50"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 border rounded-xl transition-all duration-300 ${
              theme === "dark"
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                {recordToEdit ? "แก้ไขบันทึกและตั้งค่าแจ้งเตือน EQA" : "บันทึกและตั้งค่าแจ้งเตือน EQA ใหม่"}
              </h2>
              <p className={`text-[11px] ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                กรอกทะเบียนรับ-ส่ง และกำหนดหัวข้อเวลาแจ้งเตือนได้ไม่จำกัด ร่วมกับแผนงานห้องปฏิบัติการ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              theme === "dark"
                ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Responsive Dual-Column Layout to minimize scrolling) */}
        <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 min-h-0 transition-colors duration-300 ${
          theme === "dark" ? "bg-zinc-950/25" : "bg-zinc-50/35"
        }`}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* Left Column: Register Information */}
            <div className={`p-5 rounded-xl border space-y-4 transition-all duration-300 ${
              theme === "dark" 
                ? "bg-zinc-900/40 border-zinc-800" 
                : "bg-white border-zinc-150 shadow-3xs"
            }`}>
              <h3 className={`text-xs sm:text-sm font-bold border-b pb-2 mb-3 flex items-center gap-1.5 ${
                theme === "dark" 
                  ? "text-zinc-200 border-zinc-850/60" 
                  : "text-zinc-800 border-zinc-150"
              }`}>
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>1. ข้อมูลทะเบียนรับ-ส่ง EQA</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    วันที่รับตัวอย่าง <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={receiveDate}
                      onChange={(e) => setReceiveDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className={`w-full pl-3 pr-10 py-2 rounded-xl text-xs transition-colors outline-hidden font-semibold cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                        theme === "dark"
                          ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500"
                          : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500"
                      }`}
                      required
                    />
                    <Calendar className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    รอบ / ครั้งที่ EQA <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    placeholder="เช่น 3/69, 2/2569"
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-colors outline-hidden font-mono font-semibold ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500"
                        : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500"
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    จากหน่วยงาน <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fromDept}
                    onChange={(e) => setFromDept(e.target.value)}
                    placeholder="เช่น ศูนย์วิทยาศาสตร์การแพทย์"
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-colors outline-hidden ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500"
                        : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500"
                    }`}
                    required
                  />
                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {QUICK_DEPTS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setFromDept(d.value)}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors border ${
                          theme === "dark"
                            ? "bg-zinc-800 text-zinc-400 border-zinc-750 hover:bg-indigo-500/10 hover:text-indigo-400"
                            : "bg-zinc-100 text-zinc-550 border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    สาขางานห้องปฏิบัติการ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="เช่น เคมี, ธนาคารเลือด"
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-colors outline-hidden font-semibold ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800 text-indigo-400 focus:border-indigo-500"
                        : "bg-zinc-50 border-zinc-200 text-indigo-700 focus:border-indigo-500"
                    }`}
                    required
                  />
                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {QUICK_BRANCHES.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBranch(b.split(" ")[0])}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors border ${
                          theme === "dark"
                            ? "bg-zinc-800 text-zinc-400 border-zinc-750 hover:bg-indigo-500/10 hover:text-indigo-400"
                            : "bg-zinc-100 text-zinc-550 border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        {b.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    วันกำหนดส่งผล <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      className={`w-full pl-3 pr-10 py-2 rounded-xl text-xs transition-colors outline-hidden font-bold cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                        theme === "dark"
                          ? "bg-zinc-950 border-zinc-800 text-rose-400 focus:border-indigo-500"
                          : "bg-zinc-50 border-zinc-200 text-rose-600 focus:border-indigo-500"
                      }`}
                      required
                    />
                    <Calendar className={`absolute right-3 h-4 w-4 pointer-events-none ${theme === "dark" ? "text-rose-400" : "text-rose-500"}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    ผู้รับผิดชอบหลัก
                  </label>
                  <input
                    type="text"
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    placeholder="ระบุชื่อผู้รับผิดชอบหลัก"
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-colors outline-hidden ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500"
                        : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    บันทึกเพิ่มเติม / หมายเหตุ
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ระบุรหัสตัวอย่างที่สแกนเข้ามา, วิธีวิเคราะห์..."
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-colors outline-hidden h-[74px] resize-none ${
                      theme === "dark"
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500 placeholder-zinc-600"
                        : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-indigo-500 placeholder-zinc-400"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-650"}`}>
                    สถานะบันทึกในระบบ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('pending')}
                      className={`py-2 px-2 text-[10.5px] font-bold rounded-xl border text-center cursor-pointer transition-all ${
                        status === 'pending' 
                          ? theme === "dark"
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 ring-2 ring-amber-500/15' 
                            : 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500/10 shadow-3xs'
                          : theme === "dark"
                            ? 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900' 
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      🟡 รอดำเนินการ (Pending)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('submitted')}
                      className={`py-2 px-2 text-[10.5px] font-bold rounded-xl border text-center cursor-pointer transition-all ${
                        status === 'submitted' 
                          ? theme === "dark"
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 ring-2 ring-indigo-500/15' 
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/10 shadow-3xs'
                          : theme === "dark"
                            ? 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900' 
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      🔵 ส่งผลแล้ว (Submitted)
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Alerts Multi-Scheduler */}
            <div className={`p-5 rounded-xl border space-y-4 transition-all duration-300 ${
              theme === "dark" 
                ? "bg-zinc-900/40 border-zinc-800" 
                : "bg-white border-zinc-150 shadow-3xs"
            }`}>
              <div className={`flex justify-between items-center border-b pb-2 mb-3 ${
                theme === "dark" ? "border-zinc-850/60" : "border-zinc-150"
              }`}>
                <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  theme === "dark" ? "text-zinc-200" : "text-zinc-800"
                }`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>2. ตั้งค่าการแจ้งเตือนแบบระบุเวลา</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-bold ${
                  theme === "dark"
                    ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/20"
                    : "text-indigo-600 bg-indigo-50 border-indigo-100"
                }`}>
                  ตั้งเวลาได้ไม่จำกัด
                </span>
              </div>

              {/* List of Scheduled alerts with customized height list */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${
                  theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                }`}>
                  รายการแจ้งเตือนที่ตั้งกำหนดการไว้
                </label>
                
                {alerts.length > 0 ? (
                  <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                          theme === "dark"
                            ? "bg-zinc-950 border-zinc-850 hover:border-zinc-800"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50"
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <div className={`p-1.5 border rounded-lg shrink-0 mt-0.5 ${
                            theme === "dark"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          }`}>
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${theme === "dark" ? "text-zinc-300" : "text-zinc-850"}`}>
                              {getTopicLabel(al.topicType, al.customTopic)}
                            </p>
                            <p className={`font-mono font-medium text-[10px] mt-0.5 ${
                              theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                            }`}>
                              {formatThaiDateString(al.remindAt)}
                            </p>
                            
                            {/* Alert channels badges */}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {al.notifyLine && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  theme === "dark"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  LINE OA
                                </span>
                              )}
                              {al.notifyWeb && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  theme === "dark"
                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                }`}>
                                  ระบบเว็บ
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                al.status === "sent" 
                                  ? theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                                  : al.status === "failed" 
                                    ? "bg-rose-500/10 text-rose-400" 
                                    : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {al.status === "sent" ? "ส่งแล้ว" : al.status === "failed" ? "ล้มเหลว" : "🔴 รอส่ง"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAlertItem(al.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="ลบกำหนดการ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 text-center text-xs rounded-xl border border-dashed ${
                    theme === "dark" 
                      ? "bg-zinc-950/40 border-zinc-800 text-zinc-500" 
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}>
                    ยังไม่มีการแจ้งเตือนตั้งเวลาไว้ ระบบจะสแกนและแจ้งเตือนด่วนตามปฏิทินของท่าน
                  </div>
                )}
              </div>

              {/* Quick guide warning if line not set */}
              {!lineConfigured && (
                <div className={`p-2.5 border rounded-xl flex items-start space-x-2 ${
                  theme === "dark" 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                    : "bg-amber-50 text-amber-700 border-amber-200 shadow-3xs"
                }`}>
                  <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-normal">
                    <strong>คำแนะนำ:</strong> ยังไม่ได้เปิดใช้ LINE Token ในการตั้งค่า การแจ้งเตือนจะเปิดใช้งานเฉพาะหน้าเว็บเท่านั้น (ไปที่รูปฟันเฟือง ⚙️ เพื่อตั้งค่า LINE OA)
                  </p>
                </div>
              )}

              {/* Scheduler Sub-form */}
              <div className={`p-4 rounded-xl border space-y-3.5 transition-colors duration-300 ${
                theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-zinc-50 border-zinc-150"
              }`}>
                <h4 className="text-[11px] font-bold flex items-center space-x-1.5 text-indigo-500">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  <span>กำหนดหัวข้อการแจ้งเตือนใหม่</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      หัวข้อ / วัตถุประสงค์แจ้งเตือน
                    </label>
                    <select
                      value={newTopicType}
                      onChange={(e: any) => setNewTopicType(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-semibold focus:outline-hidden focus:border-indigo-500 ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-zinc-150"
                          : "bg-white border-zinc-200 text-zinc-700 shadow-3xs"
                      }`}
                    >
                      <option value="deadline_warning">⚠️ แจ้งเตือนครบกำหนดส่งผลประเมิน</option>
                      <option value="sample_received">📦 แจ้งเตือนได้รับตัวอย่างตรวจ</option>
                      <option value="results_received">📑 แจ้งเตือนประกาศผลการประเมินรอบนั้น</option>
                      <option value="custom">🔔 แจ้งเตือนกำหนดเรื่องเอง (ระบุด้านล่าง)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      วันและเวลาที่แจ้งเตือน
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="datetime-local"
                        value={newRemindAt}
                        onChange={(e) => setNewRemindAt(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className={`w-full pl-3 pr-8 py-1.5 rounded-xl text-[11px] font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                          theme === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-zinc-150"
                            : "bg-white border-zinc-200 text-zinc-700 shadow-3xs"
                        }`}
                      />
                      <Calendar className="absolute right-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {newTopicType === "custom" && (
                  <div className="space-y-1 animate-fade-in">
                    <label className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      เรื่องที่ต้องการแจ้งเตือนแบบกำหนดเอง
                    </label>
                    <input
                      type="text"
                      value={newCustomTopic}
                      onChange={(e) => setNewCustomTopic(e.target.value)}
                      placeholder="เช่น โทรแจ้งแผนก หรือ เตรียมกล่องสิ่งส่งตรวจ"
                      className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-semibold focus:outline-hidden focus:border-indigo-500 ${
                        theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-zinc-150"
                          : "bg-white border-zinc-200 text-zinc-700 shadow-3xs"
                      }`}
                    />
                  </div>
                )}

                {/* Channel Selectors */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-zinc-800/20">
                  <div className="flex space-x-4 text-[10.5px] font-bold">
                    <label className={`flex items-center space-x-1.5 cursor-pointer ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                      <input
                        type="checkbox"
                        checked={newNotifyLine}
                        disabled={!lineConfigured}
                        onChange={(e) => setNewNotifyLine(e.target.checked)}
                        className="rounded border-zinc-400 bg-zinc-900 text-indigo-500 h-4 w-4 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className={!lineConfigured ? "text-zinc-500 cursor-not-allowed line-through opacity-55" : ""}>
                        📱 LINE OA
                      </span>
                    </label>

                    <label className={`flex items-center space-x-1.5 cursor-pointer ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                      <input
                        type="checkbox"
                        checked={newNotifyWeb}
                        onChange={(e) => setNewNotifyWeb(e.target.checked)}
                        className="rounded border-zinc-400 bg-zinc-900 text-indigo-500 h-4 w-4 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>💻 แจ้งเตือนบนเว็บ</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAlertItem}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                      theme === "dark"
                        ? "bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700"
                        : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-3xs"
                    }`}
                    id="btn-add-scheduled-alert"
                  >
                    <Plus className="h-3.5 w-3.5 text-indigo-500" />
                    <span>เพิ่มตั้งเวลาแจ้งเตือน</span>
                  </button>
                </div>
              </div>
            </div>
            
          </div>

          {/* Form Footer Buttons */}
          <div className={`flex justify-end space-x-2 pt-4 border-t ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-150"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                theme === "dark"
                  ? "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  : "border-zinc-200 text-zinc-550 hover:bg-zinc-50"
              }`}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md"
              id="btn-save-record-form"
            >
              <Save className="h-4 w-4" />
              <span>{recordToEdit ? "อัปเดตบันทึกข้อมูล" : "บันทึกและเปิดแจ้งเตือน"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
