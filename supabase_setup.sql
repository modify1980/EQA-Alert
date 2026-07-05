-- ====================================================================
-- SUPABASE SETUP SCRIPT FOR EQA ALERT MEMO
-- บอร์ดแจ้งเตือน EQA - สคริปต์สำหรับตั้งค่าฐานข้อมูล Supabase
-- ====================================================================
-- วิธีใช้งาน:
-- 1. เข้าไปที่แดชบอร์ด Supabase ของคุณ (https://supabase.com)
-- 2. เลือกโปรเจกต์ของคุณแล้วไปที่เมนู "SQL Editor" จากแถบเมนูด้านซ้าย
-- 3. คลิก "New query"
-- 4. คัดลอกโค้ดทั้งหมดในไฟล์นี้ไปวาง
-- 5. กดปุ่ม "Run" ที่มุมขวาล่าง
-- ====================================================================

-- 1. สร้างตาราง eqa_store สำหรับเก็บข้อมูลหลักทั้งหมดของแอปพลิเคชัน
CREATE TABLE IF NOT EXISTS public.eqa_store (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- คอมเมนต์อธิบายตารางและคอลัมน์
COMMENT ON TABLE public.eqa_store IS 'ตารางสำหรับจัดเก็บสถานะทั้งหมดของ EQA Alert (Settings, Records และ Logs)';
COMMENT ON COLUMN public.eqa_store.id IS 'คีย์หลักสำหรับการดึงข้อมูล (เช่น "main")';
COMMENT ON COLUMN public.eqa_store.data IS 'ข้อมูลที่ถูก Serialize เป็น JSONB (Settings, Records, และ Logs)';

-- 2. เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
ALTER TABLE public.eqa_store ENABLE ROW LEVEL SECURITY;

-- 3. สร้างนโยบายการเข้าถึงข้อมูล (Policies) เพื่อให้แอปพลิเคชันของคุณสามารถใช้งานได้ผ่าน API Key
-- นโยบายในการอ่านข้อมูล (SELECT)
CREATE POLICY "Allow public read access to eqa_store" 
ON public.eqa_store 
FOR SELECT 
USING (true);

-- นโยบายสำหรับการเขียนข้อมูล/บันทึก (INSERT, UPDATE, DELETE, UPSERT)
CREATE POLICY "Allow public write access to eqa_store" 
ON public.eqa_store 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. เพิ่มข้อมูลเริ่มต้น (Seed Data) หากยังไม่มีข้อมูลอยู่
INSERT INTO public.eqa_store (id, data)
VALUES (
    'main',
    '{
        "settings": {
            "lineChannelAccessToken": "",
            "lineSendType": "broadcast",
            "lineTargetId": "",
            "lineNotifyActive": true,
            "enableSoundAlerts": true,
            "lineGroupUrl": "https://line.me/ti/g/Opx608h97X"
        },
        "records": [],
        "logs": []
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
