import React from "react";
import { Bell, Camera, Plus, Settings, ShieldAlert, CheckCircle2, Sun, Moon, Shield, Lock, BookOpen } from "lucide-react";
import { AppSettings } from "../types";

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenAddRecord: () => void;
  onOpenOcr: () => void;
  onOpenManual: () => void;
  timeString: string;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export default function Header({
  settings,
  onOpenSettings,
  onOpenAddRecord,
  onOpenOcr,
  onOpenManual,
  timeString,
  theme = "dark",
  onToggleTheme,
  isAdmin,
  onToggleAdmin,
}: HeaderProps) {
  return (
    <header className={`backdrop-blur-md border-b sticky top-0 z-40 transition-colors duration-300 ${
      theme === 'dark' 
        ? "bg-zinc-950/80 border-zinc-900 text-zinc-100" 
        : "bg-white/90 border-zinc-200 text-zinc-900 shadow-xs"
    }`} id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between min-h-16 py-2 sm:py-3 items-center">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl flex items-center justify-center border transition-all ${
              theme === 'dark'
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              <Bell className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight flex items-center gap-1.5 flex-wrap">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
                  EQA Alert Memo
                </span>
                <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                  theme === 'dark'
                    ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                    : "bg-indigo-50 text-indigo-600 border-indigo-200"
                }`}>
                  v1.2
                </span>
              </h1>
              <div className={`text-[9.5px] sm:text-[11px] font-medium ${theme === 'dark' ? "text-zinc-400" : "text-zinc-500"} leading-normal mt-0.5`}>
                <div className="whitespace-nowrap">ระบบควบคุมเอกสารการประเมินคุณภาพ (EQA)</div>
                <div className="opacity-95 pl-1 text-[8.5px] sm:text-[10px] whitespace-nowrap">โรงพยาบาลสมเด็จพระยุพราชเดชอุดม</div>
              </div>
            </div>
          </div>

          {/* Clock and Active Status Badge */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className={`text-xs ${theme === 'dark' ? "text-zinc-500" : "text-zinc-400"}`}>เวลาปัจจุบัน (พ.ศ.)</p>
              <p className={`text-xs font-semibold font-mono ${theme === 'dark' ? "text-zinc-300" : "text-zinc-700"}`}>{timeString}</p>
            </div>
            
            <div className={`h-8 w-[1px] ${theme === 'dark' ? "bg-zinc-800" : "bg-zinc-200"}`}></div>

            {/* LINE OA Status Badge */}
            <div 
              onClick={onOpenSettings}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                settings.lineChannelAccessToken && settings.lineNotifyActive
                  ? theme === 'dark'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50"
                  : theme === 'dark'
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/50"
              }`}
            >
              {settings.lineChannelAccessToken && settings.lineNotifyActive ? (
                <>
                  <CheckCircle2 className={`h-4 w-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <span>LINE OA Connected</span>
                </>
              ) : (
                <>
                  <ShieldAlert className={`h-4 w-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} />
                  <span>Setup LINE OA</span>
                </>
              )}
            </div>

            {/* Admin Status Badge */}
            <div 
              onClick={onToggleAdmin}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                isAdmin
                  ? theme === 'dark'
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/55"
                  : theme === 'dark'
                    ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                    : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 shadow-2xs"
              }`}
              title={isAdmin ? "คลิกเพื่อออกจากระบบผู้ดูแลระบบ" : "คลิกเพื่อเข้าสู่ระบบผู้ดูแลระบบ (รหัสผ่าน 1234)"}
            >
              {isAdmin ? (
                <>
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-amber-500">แอดมิน (Admin)</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-zinc-400" />
                  <span>เข้าสู่ระบบแอดมิน</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                theme === 'dark'
                  ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-850 border-transparent"
                  : "text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50 border-zinc-200 shadow-2xs"
              }`}
              title={theme === 'dark' ? "เปิดโหมดสว่าง" : "เปิดโหมดมืด"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            {/* User Manual Button */}
            <button
              id="btn-open-manual"
              onClick={onOpenManual}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                theme === 'dark'
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 shadow-2xs"
              }`}
              title="เปิดคู่มือการทำงานอย่างละเอียด"
            >
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </button>

            <button
              id="btn-scan-ocr"
              onClick={onOpenOcr}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                theme === 'dark'
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 shadow-2xs"
              }`}
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">สแกนตารางด้วย AI</span>
            </button>

            <button
              id="btn-add-record"
              onClick={onOpenAddRecord}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
              title="บันทึก EQA"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">บันทึก EQA</span>
            </button>

            <button
              id="btn-settings"
              onClick={onOpenSettings}
              className={`p-2 rounded-xl transition-colors border ${
                theme === 'dark'
                  ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 border-transparent"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200 shadow-2xs"
              }`}
              title="ตั้งค่า"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
