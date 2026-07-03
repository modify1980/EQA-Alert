import React, { useState, useEffect } from "react";
import { X, Save, Key, HelpCircle, Eye, EyeOff, Send, CheckCircle2, AlertCircle, Info, Database } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: Partial<AppSettings>) => Promise<void>;
  theme?: "light" | "dark";
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  theme = "dark",
}: SettingsModalProps) {
  const [token, setToken] = useState(settings.lineChannelAccessToken || "");
  const [sendType, setSendType] = useState<'broadcast' | 'push'>(settings.lineSendType || "broadcast");
  const [targetId, setTargetId] = useState(settings.lineTargetId || "");
  const [active, setActive] = useState(settings.lineNotifyActive);
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groupUrl, setGroupUrl] = useState(settings.lineGroupUrl || "https://line.me/ti/g/Opx608h97X");
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [dbStatus, setDbStatus] = useState<{
    supabaseEnabled: boolean;
    supabaseUrl: string | null;
    supabaseTableMissing?: boolean;
    fallbackLocal: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/db-status")
        .then((res) => res.json())
        .then((data) => setDbStatus(data))
        .catch((err) => console.error("Failed to fetch database status:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        lineChannelAccessToken: token,
        lineSendType: sendType,
        lineTargetId: targetId,
        lineNotifyActive: active,
        lineGroupUrl: groupUrl,
      });
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!token) {
      setTestStatus("error");
      setTestError("กรุณากรอก LINE Channel Access Token ก่อนทดสอบ");
      return;
    }

    if (sendType === "push" && !targetId) {
      setTestStatus("error");
      setTestError("กรุณากรอก User ID / Group ID สำหรับการส่งข้อความแบบระบุเป้าหมาย");
      return;
    }

    setTestStatus("loading");
    setTestError("");

    try {
      const response = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineChannelAccessToken: token,
          lineSendType: sendType,
          lineTargetId: targetId,
        }),
      });

      if (response.ok) {
        setTestStatus("success");
        setTimeout(() => setTestStatus("idle"), 5000);
      } else {
        let errMsg = "ไม่สามารถเชื่อมต่อ LINE Official Account ได้";
        try {
          const errText = await response.text();
          try {
            const errData = JSON.parse(errText);
            errMsg = errData.error || errMsg;
          } catch {
            errMsg = errText || errMsg;
          }
        } catch {}
        setTestStatus("error");
        setTestError(errMsg);
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="settings-modal-backdrop">
      <div className={`border rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-up transition-all duration-300 ${
        theme === "dark" 
          ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
          : "bg-white border-zinc-200 text-zinc-800"
      }`} id="settings-modal-container">
        
        {/* Modal Header */}
        <div className={`p-6 border-b flex justify-between items-center transition-colors duration-300 ${
          theme === "dark" 
            ? "border-zinc-800 bg-zinc-900/20" 
            : "border-zinc-200 bg-zinc-50/50"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 border rounded-xl ${
              theme === "dark" 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${theme === 'dark' ? "text-zinc-100" : "text-zinc-900"}`}>ตั้งค่า LINE Official Account</h2>
              <p className={`text-xs ${theme === 'dark' ? "text-zinc-400" : "text-zinc-550"}`}>จัดการการเชื่อมต่อ LINE Messaging API เพื่อส่งการแจ้งเตือนแทน LINE Notify ที่ยุติบริการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              theme === 'dark' 
                ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" 
                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Supabase Database Status Info Card */}
          {dbStatus && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
              dbStatus.supabaseEnabled
                ? (theme === "dark" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-150 text-emerald-900")
                : dbStatus.supabaseTableMissing
                  ? (theme === "dark" ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-150 text-amber-900")
                  : (theme === "dark" ? "bg-zinc-800/20 border-zinc-700/30 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-850")
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className={`h-4.5 w-4.5 ${
                    dbStatus.supabaseEnabled 
                      ? "text-emerald-500" 
                      : dbStatus.supabaseTableMissing 
                        ? "text-amber-500 animate-pulse" 
                        : "text-zinc-500"
                  }`} />
                  <span className="text-xs font-bold">
                    ระบบจัดเก็บข้อมูล (Database Storage)
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  dbStatus.supabaseEnabled
                    ? "bg-emerald-500/10 text-emerald-400"
                    : dbStatus.supabaseTableMissing
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-zinc-500/10 text-zinc-500"
                }`}>
                  {dbStatus.supabaseEnabled 
                    ? "Supabase Active" 
                    : dbStatus.supabaseTableMissing 
                      ? "Migration Required" 
                      : "Local Database"}
                </span>
              </div>

              <div className="text-[11px] leading-relaxed space-y-1.5 opacity-90">
                {dbStatus.supabaseEnabled ? (
                  <>
                    <p>✅ <strong>เชื่อมต่อ Supabase สำเร็จ:</strong> ระบบจัดเก็บข้อมูลถาวรบนระบบคลาวด์เปิดใช้งานแล้ว ข้อมูลของคุณจะปลอดภัยและซิงค์แบบ Realtime</p>
                    <p className="font-mono text-[10px] opacity-75">Host Project: {dbStatus.supabaseUrl}</p>
                  </>
                ) : dbStatus.supabaseTableMissing ? (
                  <>
                    <p>⚠️ <strong>ตรวจพบการตั้งค่า Supabase แต่ยังไม่พบตารางข้อมูล:</strong> ตรวจพบ credentials ครบถ้วน แต่ยังไม่ได้รันสคริปต์สร้างตาราง <code className="font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">eqa_store</code> ในโปรเจกต์ของคุณ</p>
                    <p className="font-bold text-amber-500">👉 กรุณานำคำสั่ง SQL ด้านล่างไปรันในช่อง SQL Editor ของหลังบ้าน Supabase เพื่อเริ่มใช้งาน:</p>
                    
                    <div className="mt-2 p-2.5 rounded-xl bg-zinc-950 text-[10px] font-mono text-zinc-400 space-y-1.5 border border-zinc-850">
                      <div className="text-zinc-500 flex items-center justify-between">
                        <span>สคริปต์สร้างตาราง (SQL Editor):</span>
                      </div>
                      <pre className="overflow-x-auto text-[10px] leading-normal text-amber-400 select-all p-1.5 bg-black/30 rounded-lg">
{`CREATE TABLE IF NOT EXISTS eqa_store (
  id TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                      </pre>
                    </div>
                    <p className="text-[10px] opacity-75 text-zinc-400 mt-1">ระหว่างรอการสร้างตาราง ระบบจะเซฟข้อมูลลงสู่ Local Database <code className="font-mono">data/db.json</code> อัตโนมัติ เพื่อป้องกันข้อมูลสูญหาย</p>
                  </>
                ) : (
                  <>
                    <p>ℹ️ <strong>รันด้วยฐานข้อมูลภายในตัวเครื่อง (Local Fallback):</strong> ปัจจุบันข้อมูลเก็บอยู่ในไฟล์จำลอง <code className="font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">data/db.json</code> บนเครื่องเซิร์ฟเวอร์ ข้อมูลนี้ปลอดภัย แต่อาจถูกรีเซ็ตหากแอปปิดตัวลง</p>
                    <p>💡 <strong>วิธีอัปเกรดเป็น Supabase:</strong></p>
                    <div className="pl-3.5 space-y-1 text-zinc-500 dark:text-zinc-400">
                      <div>1. ไปที่ Supabase Dashboard แล้วสร้างตารางด้วยสคริปต์ SQL ด้านล่าง</div>
                      <div>2. ตั้งค่าตัวแปรระบบ <code className="font-mono text-[10px] bg-zinc-850 text-indigo-400 px-1 py-0.5 rounded">SUPABASE_URL</code> และ <code className="font-mono text-[10px] bg-zinc-850 text-indigo-400 px-1 py-0.5 rounded">SUPABASE_KEY</code> ในเมนูการตั้งค่า API Keys</div>
                    </div>
                    
                    <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-950 text-[10px] font-mono text-zinc-400 space-y-1.5 border border-zinc-850">
                      <div className="text-zinc-500 flex items-center justify-between">
                        <span>สคริปต์ SQL สำหรับสร้างตาราง:</span>
                      </div>
                      <pre className="overflow-x-auto text-[10px] leading-normal text-indigo-400 select-all p-1.5 bg-black/30 rounded-lg">
{`CREATE TABLE IF NOT EXISTS eqa_store (
  id TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Warning about LINE Notify closure */}
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
              theme === 'dark' 
                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" 
                : "bg-indigo-50 text-indigo-850 border-indigo-150"
            }`}>
              <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>ย้ายระบบไปยัง LINE Official Account:</strong> เนื่องจาก LINE Notify ยุติการให้บริการถาวร ระบบจึงเปลี่ยนมาใช้ <strong>LINE Messaging API</strong> ผ่าน LINE Official Account (บอตแชทส่วนตัว) แทน ซึ่งช่วยให้แจ้งเตือนได้รวดเร็ว มั่นคง และเป็นส่วนตัวมากขึ้น
              </p>
            </div>

            {/* Token field */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold block ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>
                LINE Channel Access Token (Long-lived) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="วาง Channel Access Token ของคุณที่นี่..."
                  className={`w-full pl-3 pr-10 py-2.5 border rounded-xl text-xs font-mono transition-colors placeholder-zinc-650 ${
                    theme === "dark" 
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500" 
                      : "bg-white border-zinc-250 text-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                  }`}
                  id="input-line-token"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className={`absolute right-3 p-1 rounded-md ${
                    theme === 'dark' ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Send Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold block ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>รูปแบบการส่งข้อความแจ้งเตือน</label>
                <select
                  value={sendType}
                  onChange={(e: any) => setSendType(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 ${
                    theme === "dark" 
                      ? "bg-zinc-950 border-zinc-800 text-zinc-150" 
                      : "bg-white border-zinc-250 text-zinc-700"
                  }`}
                >
                  <option value="broadcast">📣 บรอดแคสต์ (ส่งหาผู้ติดตามทุกคน)</option>
                  <option value="push">🎯 ระบุเป้าหมาย (ส่งเฉพาะคน/กลุ่มแชท)</option>
                </select>
              </div>

              {sendType === "push" && (
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold block ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>
                    User ID / Group ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="เช่น U1234567890abcdef..."
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono transition-colors placeholder-zinc-650 ${
                      theme === "dark" 
                        ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500" 
                        : "bg-white border-zinc-250 text-zinc-800 focus:border-indigo-500"
                    }`}
                    required
                  />
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              theme === 'dark' ? "bg-zinc-950 border-zinc-850" : "bg-zinc-50 border-zinc-200"
            }`}>
              <div>
                <span className={`text-xs font-bold block ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>เปิดใช้งานการส่งข้อความแจ้งเตือน</span>
                <span className={`text-[10px] ${theme === 'dark' ? "text-zinc-500" : "text-zinc-450"}`}>
                  เปิดใช้งานการแจ้งเตือนเมื่อเกิดกิจกรรมที่ตั้งค่าไว้
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  active ? "bg-indigo-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* LINE Group Link */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold block ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>
                ลิงก์เชิญเข้าร่วมกลุ่ม LINE (LINE Group Invite Link)
              </label>
              <input
                type="url"
                value={groupUrl}
                onChange={(e) => setGroupUrl(e.target.value)}
                placeholder="https://line.me/R/ti/g/..."
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono transition-colors placeholder-zinc-650 ${
                  theme === "dark" 
                    ? "bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500" 
                    : "bg-white border-zinc-250 text-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                }`}
              />
              <p className={`text-[10px] ${theme === 'dark' ? "text-zinc-500" : "text-zinc-500"}`}>
                ลิงก์หรือ QR Code เชิญเข้ากลุ่ม EQAAlert สำหรับผู้ใช้งานท่านอื่นเพื่อสแกนเข้าร่วมกลุ่มรับการแจ้งเตือน
              </p>
            </div>

            {/* Test & Action buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={testStatus === "loading"}
                className={`flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-850 text-zinc-200 hover:bg-zinc-800 border border-zinc-750"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200"
                }`}
              >
                <Send className="h-4 w-4 text-indigo-500" />
                <span>{testStatus === "loading" ? "กำลังทดสอบ..." : "ทดสอบส่งการแจ้งเตือน"}</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
              </button>
            </div>
          </form>

          {/* Test Status feedback */}
          {testStatus === "success" && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2 animate-fade-in ${
              theme === 'dark' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-800 border-emerald-150"
            }`}>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">ส่งข้อความทดสอบสำเร็จ!</p>
                <p>โปรดตรวจสอบแอปพลิเคชัน LINE เพื่อตรวจเช็คข้อความจาก LINE Official Account ของคุณ</p>
              </div>
            </div>
          )}

          {testStatus === "error" && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2 animate-fade-in ${
              theme === 'dark' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-800 border-rose-150"
            }`}>
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">เกิดข้อผิดพลาดในการส่ง!</p>
                <p className="font-mono mt-0.5 text-[11px] leading-relaxed break-all">{testError}</p>
              </div>
            </div>
          )}

          <hr className={theme === 'dark' ? "border-zinc-800" : "border-zinc-200"} />

          {/* Guidelines Tutorial */}
          <div className={`space-y-3 p-4 rounded-xl border transition-colors ${
            theme === 'dark' ? "bg-zinc-950 border-zinc-850" : "bg-zinc-50 border-zinc-200"
          }`}>
            <h3 className={`text-xs font-bold flex items-center space-x-1.5 ${theme === 'dark' ? "text-zinc-250" : "text-zinc-700"}`}>
              <HelpCircle className="h-4.5 w-4.5 text-zinc-500" />
              <span>ขั้นตอนการสร้างบอตแจ้งเตือนด้วย LINE Official Account (ภาษาไทย)</span>
            </h3>
            <ol className={`text-[11px] space-y-2 list-decimal list-inside pl-1 leading-relaxed ${
              theme === 'dark' ? "text-zinc-400" : "text-zinc-650"
            }`}>
              <li>
                เปิดเว็บไซต์{" "}
                <a
                  href="https://developers.line.biz"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-500 hover:underline font-bold"
                >
                  LINE Developers Console
                </a>{" "}
                แล้วเข้าสู่ระบบด้วยบัญชี LINE ของท่าน
              </li>
              <li>
                สร้าง <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>Provider</strong> ใหม่ (หากยังไม่มี) และสร้างแชนเนลใหม่ประเภท <strong className="text-indigo-600 font-bold">Messaging API</strong>
              </li>
              <li>
                ตั้งชื่อบอตและกรอกข้อมูลให้เสร็จสิ้น จากนั้นเปิดเข้าไปในแชนเนลที่สร้างขึ้น ไปที่แท็บ <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>Messaging API</strong>
              </li>
              <li>
                สแกน <strong className="text-emerald-500 font-semibold">QR code</strong> ของบอตเพื่อกดเพิ่มบอตเป็นเพื่อนในแอป LINE ของคุณ
              </li>
              <li>
                เลื่อนลงไปด้านล่างสุดของแท็บ Messaging API ค้นหาหัวข้อ <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>Channel access token</strong> กดปุ่ม <strong className="text-indigo-600 font-bold">Issue</strong> เพื่อสร้างโทเคน จากนั้นคัดลอกค่าโทเคนทั้งหมดมาใส่ในฟอร์มด้านบน
              </li>
              <li>
                <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>การตั้งค่าการส่ง:</strong>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-zinc-500 text-[10px]">
                  <li>หากต้องการส่งให้ผู้ติดตามบอตทุกคน ให้เลือกรูปแบบ <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>บรอดแคสต์</strong></li>
                  <li>หากต้องการระบุตัวบุคคล ให้เลือกรูปแบบ <strong className={theme === 'dark' ? "text-zinc-200" : "text-zinc-900"}>ระบุเป้าหมาย</strong> และนำค่า <strong className="text-emerald-600 font-bold font-mono">Your user ID</strong> ของท่าน (ที่แสดงอยู่ที่ด้านล่างของแท็บ Basic settings) มาใส่ในช่อง User ID</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
