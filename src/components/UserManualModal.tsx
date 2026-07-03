import React, { useState } from "react";
import { 
  X, BookOpen, Calendar, Table, Camera, Shield, 
  Clock, Download, Sparkles, AlertCircle, CheckCircle2, 
  Settings, ChevronRight, Eye, ShieldCheck, Heart
} from "lucide-react";

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
}

type TabType = "intro" | "navigation" | "admin" | "ai-ocr" | "export";

export default function UserManualModal({
  isOpen,
  onClose,
  theme = "dark",
}: UserManualModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("intro");

  if (!isOpen) return null;

  const tabs = [
    { id: "intro", label: "ภาพรวมระบบ", icon: BookOpen },
    { id: "navigation", label: "ตาราง & ปฏิทิน", icon: Table },
    { id: "admin", label: "แอดมิน & สิทธิ์", icon: Shield },
    { id: "ai-ocr", label: "สแกนด้วย AI", icon: Camera },
    { id: "export", label: "การส่งออก JPG", icon: Download },
  ];

  return (
    <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="manual-modal-backdrop">
      <div 
        className={`border rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] transition-all duration-300 ${
          theme === "dark" 
            ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
            : "bg-white border-zinc-200 text-zinc-800"
        }`} 
        id="manual-modal-container"
      >
        {/* Left Sidebar - Tabs (Desktop) */}
        <div className={`w-full md:w-64 flex flex-col border-r shrink-0 ${
          theme === "dark" 
            ? "bg-zinc-950/45 border-zinc-800" 
            : "bg-zinc-50 border-zinc-200"
        }`}>
          {/* Logo Title */}
          <div className={`p-5 border-b flex items-center space-x-2.5 ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-150"
          }`}>
            <div className="p-2 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">คู่มือการใช้งาน</h2>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>EQA Alert Memo v1.2</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-3 flex-1 overflow-y-auto space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all w-auto md:w-full text-left cursor-pointer border ${
                    isActive 
                      ? theme === "dark"
                        ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400"
                        : "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-3xs"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-500" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer of Sidebar */}
          <div className={`p-4 border-t text-[10px] hidden md:block ${
            theme === "dark" ? "border-zinc-800 text-zinc-500" : "border-zinc-150 text-zinc-400"
          }`}>
            <div className="flex items-center space-x-1 justify-center">
              <span>พัฒนาสำหรับงานห้องแล็บ</span>
              <Heart className="h-2.5 w-2.5 text-rose-500 fill-rose-500" />
            </div>
            <div className="text-center mt-0.5">รพ.สมเด็จพระยุพราชเดชอุดม</div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <div className={`p-5 border-b flex justify-between items-center ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-150"
          }`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
              <span>{tabs.find(t => t.id === activeTab)?.label}</span>
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === "dark" 
                  ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" 
                  : "border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800"
              }`}
              id="btn-close-manual"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm" id="manual-tab-content">
            
            {activeTab === "intro" && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-500 text-base">ระบบ EQA Alert Memo คืออะไร?</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    ระบบควบคุมเอกสารการประเมินคุณภาพ (External Quality Assessment - EQA) 
                    ออกแบบขึ้นมาเฉพาะเพื่อเพิ่มประสิทธิภาพให้กับนักเทคนิคการแพทย์และบุคลากรห้องปฏิบัติการวิจัยทางการแพทย์ 
                    <strong> โรงพยาบาลสมเด็จพระยุพราชเดชอุดม</strong> 
                    โดยทำหน้าที่ควบคุมสถานะ กำหนดส่ง และจัดทำสมุดบันทึกดิจิทัลในการประเมินประสิทธิภาพทางวิทยาศาสตร์การแพทย์
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <h5 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>วัตถุประสงค์หลักของระบบ:</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs list-disc pl-4 text-zinc-500 dark:text-zinc-400">
                    <li>ป้องกันการลืมส่งผลการควบคุมคุณภาพ (EQA) ซึ่งอาจกระทบต่อการรับรองมาตรฐานห้องแล็บ</li>
                    <li>ช่วยติดตามกำหนดส่งด้วยรหัสแถบสีสากล (เขียว, ส้ม, แดง) อย่างชัดเจนและทันที</li>
                    <li>ลดภาระการพิมพ์ข้อมูลด้วยระบบ AI OCR ปัญญาประดิษฐ์อ่านผลจากภาพสแกน</li>
                    <li>อำนวยความสะดวกในการจัดเก็บไฟล์ประวัติและส่งต่อข้อมูลในรูปแบบรูปภาพความละเอียดสูง</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">คำอธิบายสถานะและการแจ้งเตือนความเร่งด่วน</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-xl border text-center ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-zinc-150 shadow-2xs'
                    }`}>
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mx-auto mb-2" />
                      <div className="font-bold text-xs text-emerald-500">สีเขียว = ปกติ</div>
                      <p className="text-[10px] text-zinc-400 mt-1">เหลือเวลามากกว่า 3 วัน หรือจัดส่งผลการทดสอบเรียบร้อยแล้ว</p>
                    </div>

                    <div className={`p-3 rounded-xl border text-center ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-zinc-150 shadow-2xs'
                    }`}>
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500 mx-auto mb-2" />
                      <div className="font-bold text-xs text-amber-500">สีส้ม = เร่งด่วน</div>
                      <p className="text-[10px] text-zinc-400 mt-1">จะครบกำหนดส่งงานภายในช่วงเวลา 1-3 วันข้างหน้านี้</p>
                    </div>

                    <div className={`p-3 rounded-xl border text-center ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-zinc-150 shadow-2xs'
                    }`}>
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500 mx-auto mb-2" />
                      <div className="font-bold text-xs text-rose-500">สีแดง = วิกฤต</div>
                      <p className="text-[10px] text-zinc-400 mt-1">ถึงกำหนดส่งในวันนี้ หรือเลยกำหนดส่ง (ยังไม่ได้รายงานผล)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "navigation" && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-500 text-base">การนำเสนอข้อมูลหลัก 3 มิติ</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    ท่านสามารถสลับแท็บเมนูการทำงานหลักด้านล่าง เพื่อเข้าถึงมุมมองที่ตอบโจทย์ความต้องการเฉพาะหน้า ดังนี้:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 border border-indigo-500/20">
                      <Table className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">1. มุมมองแบบตารางราชการ (Table View)</h5>
                      <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        แสดงรายการเอกสารทั้งหมดในรูปแบบแถวที่ค้นหาได้ง่าย มีคอลัมน์สำคัญ เช่น รอบปี, ประเภทการตรวจ, สถาบัน EQA, 
                        วันที่ทดสอบ/กำหนดส่ง และลิงก์ตรวจเอกสารด่วน มีปุ่มตัวกรองคำค้นหาและการจำแนกสถานะโดยละเอียด
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 shrink-0 border border-violet-500/20">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">2. มุมมองปฏิทินอัจฉริยะ (Calendar View)</h5>
                      <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        พล็อตวันที่ส่งงาน EQA ลงในตารางปฏิทินรายเดือนอย่างชัดเจน โดยใช้รหัสสีแจ้งเตือนความเร่งด่วน 
                        ช่วยให้นักเทคนิคการแพทย์ตรวจตารางเวลางานแล็บประจำสัปดาห์/เดือนได้อย่างสะดวกและรวดเร็ว
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 items-start">
                    <div className="p-2.5 rounded-xl bg-zinc-500/10 text-zinc-400 shrink-0 border border-zinc-500/20">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">3. บันทึกประวัติกิจกรรมระบบ (Notification Logs)</h5>
                      <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        หน้าต่างเก็บบันทึกประวัติการเพิ่ม แก้ไข หรือส่งออกภาพ เพื่อความโปร่งใสและตรวจสอบได้ว่ามีการแก้ไขสถานะโดยผู้ใดในห้องแล็บ
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                  theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-150 text-indigo-800'
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0 text-indigo-500 animate-bounce" />
                  <span className="text-[11px] font-medium">คำแนะนำ: กดปุ่ม "ค้นหา" หรือเลือกประเภทสถานะ "ปกติ/เร่งด่วน/วิกฤต" เพื่อจำกัดผลลัพธ์ข้อมูลเฉพาะกลุ่มได้อย่างรวดเร็ว</span>
                </div>
              </div>
            )}

            {activeTab === "admin" && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-500 text-base">ระบบควบคุมสิทธิ์และป้องกันความปลอดภัย</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    เนื่องจากข้อมูลวิชาการควบคุมคุณภาพและกำหนดส่งมีความสำคัญเป็นอย่างยิ่ง ระบบจึงมีระบบความปลอดภัยล็อกการดัดแปลงข้อมูลที่ไม่พึงประสงค์
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <h5 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-amber-500">
                      <Shield className="h-4 w-4" />
                      <span>สิทธิ์ผู้ดูแลระบบ (Admin)</span>
                    </h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      ผู้ดูแลระบบสามารถ <strong>เพิ่ม แก้ไข ลบ และดำเนินการพิเศษ</strong> ได้ทั้งหมดอย่างเต็มประสิทธิภาพ 
                      โดยการเปลี่ยนเป็นโหมดแอดมินจะต้องระบุรหัสผ่าน (PIN)
                    </p>
                    <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10.5px] font-semibold">
                      <span>รหัสผ่านเริ่มต้น: 1234</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <h5 className="font-bold text-xs mb-2 flex items-center gap-1.5 text-zinc-400">
                      <Eye className="h-4 w-4 text-zinc-500" />
                      <span>สิทธิ์ผู้เยี่ยมชม (Reader Mode)</span>
                    </h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      ผู้ใช้งานทั่วไปสามารถเปิดดู ปฏิทิน ตาราง ค้นหา และกดส่งออกรูปภาพไปส่งไลน์ได้ตามปกติ 
                      แต่หากกดปุ่มแก้ไขหรือลบ ระบบจะแสดงหน้าต่างให้กรอกรหัสผ่าน (PIN) แอดมินก่อนทำงานเพื่อความปลอดภัย
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                  theme === 'dark' ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-150 text-amber-800'
                }`}>
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                  <span className="text-[11px] font-medium">ความสะดวก: เมื่อกรอกรหัสถูกต้องแล้ว ระบบจะจำสถานะแอดมินไว้ (เซสชันความปลอดภัย) จนกว่าคุณจะกดออกจากแอดมิน</span>
                </div>
              </div>
            )}

            {activeTab === "ai-ocr" && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-500 text-base">ระบบสแกนเอกสารด้วยปัญญาประดิษฐ์ AI OCR</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    ระบบปัญญาประดิษฐ์สัญชาติไทยร่วมพัฒนาโดย Gemini 3.5 AI พร้อมช่วยประมวลภาพสแกนเอกสารวิชาการ EQA 
                    เพื่อสกัดข้อมูลเป็นแบบบันทึกให้อัตโนมัติในคลิกเดียว
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">ขั้นตอนการสแกนอัจฉริยะ:</h5>
                  <div className="space-y-3">
                    <div className="flex space-x-3 items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">1</div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-300">กดปุ่ม <strong>"สแกนตารางด้วย AI"</strong> บนเมนูด้านขวาบนของแอป</span>
                    </div>

                    <div className="flex space-x-3 items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-300">อัปโหลดภาพรายงานกำหนดส่ง EQA หรือภาพถ่ายเอกสารรายงานวิชาการผลลัพธ์</span>
                    </div>

                    <div className="flex space-x-3 items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">3</div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-300">กดปุ่มวิเคราะห์ ระบบ AI จะอ่านวิเคราะห์ คัดแยกรายการข้อมูลพร้อมระบุสถานะด่วนให้อัตโนมัติ</span>
                    </div>

                    <div className="flex space-x-3 items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">4</div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-300">กดยืนยันบันทึก เพื่อนำผลการวิเคราะห์เข้าเก็บในฐานข้อมูลตารางและปฏิทินในเสี้ยววินาที</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-500 text-base">ระบบดาวน์โหลดและส่งออกรูปภาพ JPG</h4>
                  <p className={`leading-relaxed text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    เพื่อให้ตอบสนองต่อวัฒนธรรมการประสานงานภายในทีมแพทย์และพยาบาล ระบบจึงมีระบบดาวน์โหลดภาพหน้าจอความคมชัดสูงในรูปแบบไฟล์ JPG
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">ข้อมูลเด่นที่คุณจะได้รับบนรูปภาพส่งออก:</h5>
                  <ul className="space-y-2 list-disc pl-5 text-xs text-zinc-500 dark:text-zinc-400">
                    <li>
                      <strong>ตราประทับเวลาปรับปรุงข้อมูลล่าสุด (Last Updated Time):</strong> 
                      ระบุวันที่และเวลาที่ได้รับการอัปเดตข้อมูลจริงในระบบอย่างละเอียดรอบคอบแบบนาทีต่อวินาที
                    </li>
                    <li>
                      <strong>ตารางรายงานและปฏิทินที่เลือก:</strong> 
                      พล็อตแผนภาพตาราง EQA และการคำนวณสถานะเร่งด่วนตามเฉดสีอย่างสวยงาม
                    </li>
                    <li>
                      <strong>สถิติภาพรวม (EQA Stats Summary):</strong> 
                      พล็อตสรุปสถิติเอกสาร กำหนดส่งที่ค้าง รวบรวมให้ครบครันในไฟล์เดียว
                    </li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-150 text-emerald-800'
                }`}>
                  <h5 className="font-bold text-xs mb-1 flex items-center gap-1.5 text-emerald-500">
                    <Download className="h-4 w-4" />
                    <span>วิธีดาวน์โหลดง่ายๆ:</span>
                  </h5>
                  <p className="text-[11px] leading-relaxed">
                    เพียงคุณกดปุ่ม <span className="font-bold">"ส่งออกหน้านี้เป็น JPG"</span> ทางแถบด้านบนของหน้าจอแสดงผล ระบบจะซิงค์เวลาปัจจุบันและเรนเดอร์เอกสารออกมาเป็นไฟล์รูปภาพบันทึกลงในเครื่องคอมพิวเตอร์หรือสมาร์ทโฟนของท่านในทันที! พร้อมสำหรับส่งมอบต่อในกลุ่ม Line รพ. ได้อย่างราบรื่น
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Bottom actions */}
          <div className={`p-4 border-t flex justify-end ${
            theme === "dark" ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-150 bg-zinc-50/50"
          }`}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              id="btn-close-manual-bottom"
            >
              เข้าใจและปิดคู่มือ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
