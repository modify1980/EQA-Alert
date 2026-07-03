import React, { useState, useRef } from "react";
import { X, Upload, FileImage, Sparkles, CheckCircle2, AlertCircle, Calendar, Plus, Edit2, ChevronRight } from "lucide-react";
import { OcrResult } from "../types";

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (records: any[]) => void;
  theme?: "light" | "dark";
}

const LOADING_STEPS = [
  "กำลังอัปโหลดรูปภาพไปยังระบบหลังบ้าน...",
  "กำลังวิเคราะห์เค้าโครงตารางด้วย Gemini 3.5-Flash...",
  "กำลังดึงข้อมูลคอลัมน์ (วันที่รับ, หน่วยงาน, สาขางาน, ผู้รับผิดชอบ)...",
  "กำลังวิเคราะห์ตัวเลขปี พ.ศ. (เช่น 69) และแปลงเป็น ปี ค.ศ. (2026-07-01)...",
  "กำลังจัดเรียงความสัมพันธ์ของแถวข้อมูลให้อยู่ในโครงสร้าง JSON...",
  "เสร็จสิ้น! กำลังจัดทำตารางเพื่อเตรียมให้คุณอนุมัตินำเข้า..."
];

export default function OcrModal({ isOpen, onClose, onImportRecords, theme = "dark" }: OcrModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scanResults, setScanResults] = useState<OcrResult[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interval timer for rotating reassuring loading comments
  const stepTimerRef = useRef<any>(null);

  if (!isOpen) return null;

  const resetOcrState = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setScanResults([]);
    setSelectedIndices([]);
    setError("");
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("โปรดอัปโหลดไฟล์รูปภาพเท่านั้น (.png, .jpg, .jpeg)");
      return;
    }
    setError("");
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startOcrScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setLoadingStep(0);
    setError("");

    // Cycle through steps for high-quality loading screen feedback
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      if (step < LOADING_STEPS.length - 1) {
        step++;
        setLoadingStep(step);
      }
    }, 2500);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const mimeType = file.type;
        // Strip data:image/...;base64,
        const base64Clean = base64data.split(",")[1];

        try {
          const response = await fetch("/api/ocr/eqa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Image: base64Clean,
              mimeType: mimeType,
            }),
          });

          if (!response.ok) {
            let errMsg = "สแกนล้มเหลว";
            try {
              const errText = await response.text();
              try {
                const errData = JSON.parse(errText);
                errMsg = errData.error || errMsg;
              } catch {
                errMsg = errText || errMsg;
              }
            } catch {}
            throw new Error(errMsg);
          }

          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            setScanResults(resData.data);
            // Select all rows by default
            setSelectedIndices(resData.data.map((_, i) => i));
          } else {
            throw new Error("โครงสร้างข้อมูลที่ได้รับไม่ถูกต้อง");
          }
        } catch (err: any) {
          setError(err.message || "เกิดข้อผิดพลาดในการสแกนด้วย AI");
        } finally {
          setIsScanning(false);
          if (stepTimerRef.current) clearInterval(stepTimerRef.current);
        }
      };
    } catch (err: any) {
      setError(err.message || "ไม่สามารถอ่านไฟล์ได้");
      setIsScanning(false);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
  };

  // Modify individual cell value in review table before importing
  const handleResultChange = (index: number, key: keyof OcrResult, value: string) => {
    setScanResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };

  const toggleRowSelection = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const toggleAllSelection = () => {
    if (selectedIndices.length === scanResults.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(scanResults.map((_, i) => i));
    }
  };

  const handleImport = () => {
    const recordsToImport = scanResults.filter((_, i) => selectedIndices.includes(i));
    onImportRecords(recordsToImport);
    resetOcrState();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="ocr-modal-backdrop">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-up" id="ocr-modal-container">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">สแกนทะเบียนรับ-ส่ง EQA ด้วย Gemini AI</h2>
              <p className="text-xs text-zinc-400">
                ถ่ายรูปตารางหรืออัปโหลดรูปภาพทะเบียน EQA เพื่อให้ AI สกัดกรอกข้อมูลให้แบบอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetOcrState();
              onClose();
            }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0 bg-zinc-950/20">
          {error && (
            <div className="mb-4 p-4 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">เกิดข้อผิดพลาด</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Uploading File */}
          {!file && !isScanning && scanResults.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl aspect-video border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                  accept="image/*"
                />
                <div className="p-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="font-bold text-zinc-300 mb-1">ลากและวางรูปภาพใบลงทะเบียน EQA</h3>
                <p className="text-xs text-zinc-500 max-w-xs mb-4">
                  หรือคลิกเพื่อเลือกไฟล์จากอุปกรณ์ รองรับไฟล์ภาพ .png, .jpg, .jpeg
                </p>
                <div className="text-xs px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-450 font-medium">
                  แนะนำถ่ายรูปที่มีแสงสว่างเพียงพอและตั้งตรงให้เห็นทั้งตาราง
                </div>
              </div>
            </div>
          )}

          {/* Preview of file to trigger scan */}
          {file && !isScanning && scanResults.length === 0 && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 shadow-xs flex items-center justify-center">
                <img
                  src={previewUrl || ""}
                  alt="EQA table preview"
                  className="max-h-[300px] rounded-xl object-contain animate-fade-in"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-4">
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl">
                  <h4 className="font-bold text-indigo-400 text-sm flex items-center space-x-1.5 mb-1">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>พร้อมสแกนเอกสารด้วย Gemini AI</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    ระบบ AI จะทำการประมวลผลตาราง ตรวจจับหัวข้อ ค้นหาวันที่รับและส่งผลของ EQA รอบนั้นๆ 
                    รวมถึงแปลงรอบพ.ศ. (69) เป็น ค.ศ. (2026) เพื่อความสะดวกในการตั้งระบบแจ้งเตือนโดยอัตโนมัติ
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs text-zinc-400">
                  <FileImage className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span>({(file.size / 1024).toFixed(1)} KB)</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetOcrState}
                    className="flex-1 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors"
                  >
                    เปลี่ยนรูปภาพ
                  </button>
                  <button
                    onClick={startOcrScan}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    id="btn-trigger-ai-scan"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>เริ่มสแกนด้วย AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scanning Loading State */}
          {isScanning && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-950 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="font-bold text-zinc-300 mb-1">กำลังประมวลผลด้วย AI...</h3>
              <p className="text-xs text-indigo-400 font-medium font-mono animate-pulse max-w-sm text-center">
                {LOADING_STEPS[loadingStep]}
              </p>
              <div className="w-48 h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Step 3: Scan Results Table View */}
          {scanResults.length > 0 && !isScanning && (
            <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
              <div className="mb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-300">
                  ตรวจพบตารางข้อมูลทั้งสิ้น {scanResults.length} แถว (โปรดตรวจสอบข้อมูลก่อนนำเข้า)
                </h3>
                <button
                  onClick={toggleAllSelection}
                  className="text-xs text-indigo-400 font-semibold hover:underline"
                >
                  {selectedIndices.length === scanResults.length ? "ยกเลิกการเลือกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>

              {/* Responsive Review Table */}
              <div className="flex-1 overflow-auto border border-zinc-850 rounded-xl bg-zinc-950 min-h-[250px]">
                <table className="w-full text-left border-collapse" id="ocr-review-table">
                  <thead className="bg-zinc-900 text-xs font-bold text-zinc-400 uppercase tracking-wider sticky top-0 border-b border-zinc-850 z-10">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectedIndices.length === scanResults.length}
                          onChange={toggleAllSelection}
                          className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                        />
                      </th>
                      <th className="px-4 py-3 min-w-[120px]">วันที่รับ</th>
                      <th className="px-4 py-3 min-w-[150px]">จากหน่วยงาน</th>
                      <th className="px-4 py-3 min-w-[120px]">สาขางาน</th>
                      <th className="px-4 py-3 min-w-[100px]">ครั้งที่/รอบ</th>
                      <th className="px-4 py-3 min-w-[120px]">กำหนดส่ง</th>
                      <th className="px-4 py-3 min-w-[120px]">ผู้รับผิดชอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs text-zinc-300">
                    {scanResults.map((row, index) => {
                      const isSelected = selectedIndices.includes(index);
                      return (
                        <tr
                          key={index}
                          className={`transition-colors hover:bg-zinc-900/40 ${isSelected ? "bg-indigo-500/5 text-zinc-100" : "opacity-50 text-zinc-400"}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(index)}
                              className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={row.receiveDate || ""}
                              onChange={(e) => handleResultChange(index, "receiveDate", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 text-zinc-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.fromDept || ""}
                              onChange={(e) => handleResultChange(index, "fromDept", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 text-zinc-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.branch || ""}
                              onChange={(e) => handleResultChange(index, "branch", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 text-zinc-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.round || ""}
                              onChange={(e) => handleResultChange(index, "round", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 text-zinc-250 rounded-lg text-xs font-mono font-medium"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={row.deadlineDate || ""}
                              onChange={(e) => handleResultChange(index, "deadlineDate", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 rounded-lg text-xs font-semibold text-rose-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.responsiblePerson || ""}
                              onChange={(e) => handleResultChange(index, "responsiblePerson", e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 text-zinc-200 rounded-lg text-xs"
                              placeholder="ยังไม่ระบุ"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Actions */}
              <div className="mt-4 flex flex-col sm:flex-row sm:justify-between items-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-500">
                  * ข้อมูลที่สแกนสำเร็จจะบันทึกเป็น แผนงานรอดำเนินการ (Pending) เพื่อให้สามารถตั้งระบบเตือนได้
                </p>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={resetOcrState}
                    className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded-xl border border-zinc-800 transition-colors"
                  >
                    ยกเลิกและทำใหม่
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedIndices.length === 0}
                    className="flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    id="btn-confirm-ocr-import"
                  >
                    <Plus className="h-4 w-4" />
                    <span>นำเข้าข้อมูล ({selectedIndices.length} รายการ)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
