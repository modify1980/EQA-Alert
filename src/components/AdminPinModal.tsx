import React, { useState, useEffect, useRef } from "react";
import { Shield, X, AlertCircle, Check } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme?: "light" | "dark";
  title?: string;
  description?: string;
}

export default function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  theme = "dark",
  title = "ยืนยันตัวตนผู้ดูแลระบบ",
  description = "กรุณากรอกรหัสผ่านผู้ดูแลระบบ (PIN) เพื่อลบหรือแก้ไขข้อมูล",
}: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      // Auto focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      onSuccess();
      onClose();
    } else {
      setError("รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
      setPin("");
      inputRef.current?.focus();
    }
  };

  const handleDigitClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");
      if (newPin === "1234") {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 300);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setError("รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
          setPin("");
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="admin-modal-backdrop">
      <div 
        className={`border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col animate-scale-up transition-all duration-300 ${
          theme === "dark" 
            ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
            : "bg-white border-zinc-200 text-zinc-800"
        }`} 
        id="admin-modal-container"
      >
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${
          theme === "dark" ? "border-zinc-800" : "border-zinc-100"
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg border ${
              theme === "dark"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}>
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm">{title}</span>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" 
                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          <p className={`text-center text-xs mb-5 px-2 ${
            theme === 'dark' ? "text-zinc-400" : "text-zinc-500"
          }`}>
            {description}
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-4">
            {/* Dots Display */}
            <div className="flex space-x-3.5 mb-2 justify-center" id="pin-dots-display">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 ${
                    pin.length > index
                      ? "bg-amber-500 border-amber-500 scale-110 shadow-sm"
                      : theme === "dark"
                      ? "border-zinc-700 bg-zinc-950"
                      : "border-zinc-300 bg-zinc-50"
                  }`}
                />
              ))}
            </div>

            {/* Hidden Input for Keyboard Typing */}
            <input
              ref={inputRef}
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setPin(val);
                setError("");
                if (val === "1234") {
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 300);
                } else if (val.length === 4) {
                  setTimeout(() => {
                    setError("รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
                    setPin("");
                  }, 200);
                }
              }}
              className="sr-only"
              id="admin-pin-hidden-input"
            />

            {/* Visual keypad */}
            <div className="grid grid-cols-3 gap-3 w-48 mx-auto" id="pin-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num)}
                  className={`h-11 w-11 rounded-full font-bold text-sm transition-all flex items-center justify-center border ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800 active:scale-95"
                      : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 active:scale-95 shadow-2xs"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin("")}
                className={`text-[10px] font-bold h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                  theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick(0)}
                className={`h-11 w-11 rounded-full font-bold text-sm transition-all flex items-center justify-center border ${
                  theme === "dark"
                    ? "bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800 active:scale-95"
                    : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 active:scale-95 shadow-2xs"
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className={`text-[10px] font-bold h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                  theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                ลบ
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-2.5 rounded-xl border flex items-center space-x-1.5 w-full text-xs animate-shake ${
                theme === "dark"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-rose-50 text-rose-750 border-rose-100"
              }`}>
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-semibold leading-none">{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
