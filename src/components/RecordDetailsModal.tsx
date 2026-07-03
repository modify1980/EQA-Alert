import React, { useState, useEffect } from "react";
import { X, Calendar, CheckSquare, Bell, User, Send, FileCheck, HelpCircle } from "lucide-react";
import { EqaRecord } from "../types";

interface RecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EqaRecord | null;
  onSaveLifecycle: (id: string, updates: Partial<EqaRecord>) => Promise<void>;
  theme?: "light" | "dark";
}

export default function RecordDetailsModal({
  isOpen,
  onClose,
  record,
  onSaveLifecycle,
  theme = "dark",
}: RecordDetailsModalProps) {
  const [submissionDate, setSubmissionDate] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [resultReceiptDate, setResultReceiptDate] = useState("");
  const [resultReceivedBy, setResultReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setSubmissionDate(record.submissionDate || "");
      setSubmittedBy(record.submittedBy || "");
      setResultReceiptDate(record.resultReceiptDate || "");
      setResultReceivedBy(record.resultReceivedBy || "");
      setNotes(record.notes || "");
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // If both receipt of results and submission is completed, mark as 'completed'
    // Else if submission is completed, mark as 'submitted'
    // Otherwise keep as 'pending'
    let newStatus = record.status;
    if (submissionDate && resultReceiptDate) {
      newStatus = 'completed';
    } else if (submissionDate) {
      newStatus = 'submitted';
    } else {
      newStatus = 'pending';
    }

    try {
      await onSaveLifecycle(record.id, {
        submissionDate: submissionDate || undefined,
        submittedBy: submittedBy || undefined,
        resultReceiptDate: resultReceiptDate || undefined,
        resultReceivedBy: resultReceivedBy || undefined,
        notes: notes || undefined,
        status: newStatus,
      });
      onClose();
    } catch (err) {
      console.error("Failed to save lifecycle details:", err);
    } finally {
      setIsSaving(false);
    }
  };

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
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getAlertTopicLabel = (type: string, custom?: string) => {
    switch (type) {
      case 'deadline_warning': return "⚠️ เตือนวันครบส่งผล";
      case 'sample_received': return "📦 เตือนได้รับตัวอย่าง";
      case 'results_received': return "📑 เตือนครบกำหนดรับผลประเมิน";
      case 'custom': return `🔔 ${custom || "แจ้งเตือนทั่วไป"}`;
      default: return "🔔 แจ้งเตือน";
    }
  };

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
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in backdrop-blur-md transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-950/80" : "bg-slate-900/40"
      }`} 
      id="lifecycle-modal-backdrop"
    >
      <div 
        className={`border rounded-2xl shadow-2xl w-full max-w-5xl h-[94vh] lg:h-[86vh] max-h-[94vh] overflow-hidden flex flex-col animate-scale-up transition-all duration-300 ${
          theme === "dark" 
            ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
            : "bg-white border-slate-100 text-slate-800"
        }`} 
        id="lifecycle-modal-container"
      >
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex justify-between items-center transition-colors duration-300 ${
          theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-blue-50/20 border-slate-100"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              theme === "dark" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}>
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${theme === "dark" ? "text-zinc-150" : "text-slate-800"}`}>
                บันทึกขั้นตอนการรับ-ส่ง EQA ทั้งหมด (Lifecycle)
              </h2>
              <p className={`text-[11px] ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
                บันทึกวันและเวลาการส่งผลจริงและวันที่ได้รับการประเมินเพื่อเก็บสถิติและเปรียบเทียบในรายงาน
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

        {/* Modal Body (2-Column Side-by-Side on Desktop to prevent overall scroll) */}
        <div className={`flex-1 p-4 sm:p-5 overflow-y-auto lg:overflow-hidden min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 transition-colors duration-300 ${
          theme === "dark" ? "bg-zinc-950/15" : "bg-slate-50/20"
        }`}>
          
          {/* Column 1: Details and Alerts Schedule */}
          <div className="col-span-1 lg:col-span-5 flex flex-col h-full space-y-4 min-h-0">
            {/* Section 1: EQA Original Log Information (Read Only) */}
            <div className={`p-4 rounded-xl border transition-all duration-300 shadow-3xs ${
              theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-100"
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${
                theme === "dark" ? "text-zinc-400" : "text-slate-400"
              }`}>รายละเอียดใบ EQA ทะเบียนรับ</h3>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>วันรับตัวอย่าง</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-zinc-200" : "text-slate-850"}`}>
                    {formatThaiDate(record.receiveDate)}
                  </p>
                </div>
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>รอบ / ครั้งที่ EQA</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-zinc-200" : "text-slate-850"}`}>
                    {record.round}
                  </p>
                </div>
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>สาขางานห้องปฏิบัติการ</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-indigo-400" : "text-blue-700"}`}>
                    {record.branch}
                  </p>
                </div>
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>จากหน่วยงาน</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-zinc-200" : "text-slate-850"}`}>
                    {record.fromDept}
                  </p>
                </div>
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>วันกำหนดส่งผลประเมิน</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-rose-400" : "text-rose-700"}`}>
                    {formatThaiDate(record.deadlineDate)}
                  </p>
                </div>
                <div>
                  <p className={`font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>ผู้รับผิดชอบดูแล</p>
                  <p className={`font-bold text-sm mt-0.5 ${theme === "dark" ? "text-zinc-200" : "text-slate-850"}`}>
                    {record.responsiblePerson || "ยังไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Alarm Alert Logs list */}
            <div className={`p-4 rounded-xl border flex-1 min-h-0 flex flex-col transition-all duration-300 shadow-3xs ${
              theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-100"
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 shrink-0 ${
                theme === "dark" ? "text-zinc-400" : "text-slate-400"
              }`}>สถานะของกำหนดการแจ้งเตือนทั้งหมด ({record.alerts?.length || 0})</h3>
              
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {record.alerts && record.alerts.length > 0 ? (
                  record.alerts.map((al) => (
                    <div
                      key={al.id}
                      className={`p-2.5 border rounded-xl text-xs flex justify-between items-center transition-all ${
                        theme === "dark" 
                          ? "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-800" 
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`font-bold ${theme === "dark" ? "text-zinc-300" : "text-slate-750"}`}>
                          {getAlertTopicLabel(al.topicType, al.customTopic)}
                        </p>
                        <p className={`font-mono text-[10px] mt-0.5 ${theme === "dark" ? "text-zinc-500" : "text-slate-500"}`}>
                          เวลาตั้งเตือน: {formatThaiDateTime(al.remindAt)}
                        </p>
                        <div className={`flex items-center space-x-1.5 mt-1 text-[9.5px] font-semibold ${
                          theme === "dark" ? "text-zinc-400" : "text-slate-500"
                        }`}>
                          <span>ช่องทาง: {al.notifyLine ? "LINE" : ""} {al.notifyLine && al.notifyWeb ? "&" : ""} {al.notifyWeb ? "หน้าเว็บ" : ""}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          al.status === "sent" 
                            ? theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : al.status === "failed" 
                              ? theme === "dark" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-100" 
                              : theme === "dark" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {al.status === "sent" ? "🟢 ส่งเตือนสำเร็จ" : al.status === "failed" ? "🔴 ส่งล้มเหลว" : "🟡 รอแจ้งเตือน"}
                        </span>
                        {al.errorMessage && (
                          <p className="text-[9px] text-rose-500 mt-1 max-w-[120px] truncate" title={al.errorMessage}>
                            Error: {al.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className={`text-xs ${
                      theme === "dark" ? "text-zinc-500" : "text-slate-400"
                    }`}>
                      ไม่มีกำหนดการแจ้งเตือนสำหรับรายการนี้
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Lifecycle inputs Form */}
          <form onSubmit={handleSave} className="col-span-1 lg:col-span-7 flex flex-col h-full space-y-4 min-h-0" id="lifecycle-details-form">
            <div className={`p-4 sm:p-5 rounded-xl border flex-1 min-h-0 flex flex-col justify-between transition-all duration-300 shadow-3xs ${
              theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-100"
            }`}>
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                <h3 className={`text-xs sm:text-sm font-bold border-b pb-2 mb-1 flex items-center gap-1.5 ${
                  theme === "dark" ? "text-zinc-200 border-zinc-800/80" : "text-slate-800 border-slate-50"
                }`}>
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>อัปเดตข้อมูลการส่งผลและการรับผลประเมิน (คอลัมน์ 7-10 ในสมุดทะเบียน)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 7 & 8: Submission of results */}
                  <div className={`space-y-3 p-3.5 border rounded-xl transition-all ${
                    theme === "dark" 
                      ? "bg-blue-950/15 border-blue-900/30 text-blue-300" 
                      : "bg-blue-50/20 border-blue-100/50 text-blue-800"
                  }`}>
                    <h4 className="text-xs font-bold flex items-center space-x-1.5">
                      <Send className="h-3.5 w-3.5" />
                      <span>ข้อมูลการส่งผลวิเคราะห์ EQA (คอลัมน์ 7-8)</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                          วันที่ส่งผลวิเคราะห์จริง
                        </label>
                        <input
                          type="date"
                          value={submissionDate}
                          onChange={(e) => setSubmissionDate(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-semibold transition-colors ${
                            theme === "dark" ? "bg-zinc-950 border-zinc-800 text-blue-400" : "bg-white border-slate-200 text-blue-800"
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                          ส่งผลโดย (ชื่อเจ้าหน้าที่)
                        </label>
                        <input
                          type="text"
                          value={submittedBy}
                          onChange={(e) => setSubmittedBy(e.target.value)}
                          placeholder="ระบุชื่อผู้กรอกผล/ส่งผลตรวจ"
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium transition-colors ${
                            theme === "dark" ? "bg-zinc-950 border-zinc-800 text-zinc-150" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 9 & 10: Receipt of Evaluations */}
                  <div className={`space-y-3 p-3.5 border rounded-xl transition-all ${
                    theme === "dark" 
                      ? "bg-emerald-950/15 border-emerald-900/30 text-emerald-300" 
                      : "bg-emerald-50/20 border-emerald-100/50 text-emerald-800"
                  }`}>
                    <h4 className="text-xs font-bold flex items-center space-x-1.5">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>การประเมินและสแกนรับผลกลับ (คอลัมน์ 9-10)</span>
                    </h4>
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                          วันที่ได้รับผลการประเมิน
                        </label>
                        <input
                          type="date"
                          value={resultReceiptDate}
                          onChange={(e) => setResultReceiptDate(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-semibold transition-colors ${
                            theme === "dark" ? "bg-zinc-950 border-zinc-800 text-emerald-400" : "bg-white border-slate-200 text-emerald-800"
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-slate-650"}`}>
                          ผู้รับผล / สแกนผลลงทะเบียน
                        </label>
                        <input
                          type="text"
                          value={resultReceivedBy}
                          onChange={(e) => setResultReceivedBy(e.target.value)}
                          placeholder="ชื่อเจ้าหน้าที่ผู้รับเอกสารประเมิน"
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium transition-colors ${
                            theme === "dark" ? "bg-zinc-950 border-zinc-800 text-zinc-150" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-bold ${theme === "dark" ? "text-zinc-300" : "text-slate-700"}`}>
                    บันทึกเพิ่มเติม / ผลการประเมินคุณภาพ
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ผลการประเมินอยู่ในเกณฑ์ยอมรับ (Acceptable) หรือระบุคะแนนที่ได้..."
                    className={`w-full px-3 py-2 border focus:border-indigo-500 rounded-xl text-xs transition-all outline-hidden h-[85px] resize-none ${
                      theme === "dark" 
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end pt-3 border-t shrink-0 ${
                theme === "dark" ? "border-zinc-800/80" : "border-slate-100"
              }`}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer ${
                    theme === "dark" 
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/10" 
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/10"
                  }`}
                  id="btn-save-lifecycle"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{isSaving ? "กำลังบันทึก..." : "อัปเดตและบันทึกสถานะ"}</span>
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
