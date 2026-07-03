import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parsing with increased size limit for images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Supabase client if credentials are provided
let supabase: any = null;
let supabaseTableMissing = false;

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log("Supabase client initialized successfully with URL:", process.env.SUPABASE_URL);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// Database file path setup (Vercel has read-only filesystems, so we fallback to /tmp if needed)
let DB_DIR = path.join(process.cwd(), "data");
let DB_PATH = path.join(DB_DIR, "db.json");

function ensureDbDirectory() {
  try {
    if (process.env.VERCEL) {
      DB_DIR = "/tmp";
      DB_PATH = path.join(DB_DIR, "db.json");
    }
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create database directory, falling back to /tmp:", err);
    DB_DIR = "/tmp";
    DB_PATH = path.join(DB_DIR, "db.json");
  }
}

// Initial DB template
const defaultDb = {
  settings: {
    lineChannelAccessToken: "",
    lineSendType: "broadcast",
    lineTargetId: "",
    lineNotifyActive: true,
    enableSoundAlerts: true,
    lineGroupUrl: "https://line.me/ti/g/Opx608h97X",
  },
  records: [] as any[],
  logs: [] as any[],
};

// Database helper functions
function normalizeDb(data: any) {
  if (!data) data = {};
  if (!data.settings) {
    data.settings = { ...defaultDb.settings };
  } else {
    if (data.settings.lineChannelAccessToken === undefined) {
      data.settings.lineChannelAccessToken = data.settings.lineNotifyToken || "";
    }
    if (data.settings.lineSendType === undefined) {
      data.settings.lineSendType = "broadcast";
    }
    if (data.settings.lineTargetId === undefined) {
      data.settings.lineTargetId = "";
    }
    if (data.settings.lineGroupUrl === undefined) {
      data.settings.lineGroupUrl = "https://line.me/ti/g/Opx608h97X";
    }
    if (data.settings.lineNotifyActive === undefined) {
      data.settings.lineNotifyActive = true;
    }
    if (data.settings.enableSoundAlerts === undefined) {
      data.settings.enableSoundAlerts = true;
    }
  }
  if (!data.records || !Array.isArray(data.records)) {
    data.records = [];
  }
  if (!data.logs || !Array.isArray(data.logs)) {
    data.logs = [];
  }
  return data;
}

async function readDb() {
  if (supabase && !supabaseTableMissing) {
    try {
      const { data, error } = await supabase
        .from("eqa_store")
        .select("data")
        .eq("id", "main")
        .maybeSingle();

      if (error) {
        const isTableMissing = 
          error.code === "42P01" || 
          error.code === "PGRST205" ||
          (error.message && (
            error.message.includes("relation") || 
            error.message.includes("does not exist") || 
            error.message.includes("Could not find the table")
          ));

        if (isTableMissing) {
          supabaseTableMissing = true;
          console.warn("Table 'eqa_store' does not exist in Supabase. Falling back to local storage (data/db.json) for now. Run the SQL schema script in your Supabase SQL Editor to enable persistent cloud storage.");
        } else {
          console.error("Supabase read error (falling back to local):", error);
        }
      } else if (data && data.data) {
        return normalizeDb(data.data);
      } else {
        // Row doesn't exist yet, seed it with local data if exists, otherwise defaultDb
        let seedData = defaultDb;
        try {
          ensureDbDirectory();
          if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, "utf-8");
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.records || parsed.settings)) {
              seedData = normalizeDb(parsed);
              console.log("Found existing local data. Seeding Supabase with local database content!");
            }
          }
        } catch (e) {
          console.error("Failed to read local db for Supabase seeding:", e);
        }

        console.log("Seeding data in Supabase...");
        const { error: insertError } = await supabase
          .from("eqa_store")
          .upsert({ id: "main", data: seedData });
        if (insertError) {
          const isTableMissing = 
            insertError.code === "42P01" || 
            insertError.code === "PGRST205" ||
            (insertError.message && (
              insertError.message.includes("relation") || 
              insertError.message.includes("does not exist") || 
              insertError.message.includes("Could not find the table")
            ));
          if (isTableMissing) {
            supabaseTableMissing = true;
            console.warn("Table 'eqa_store' does not exist in Supabase during seed. Falling back to local storage.");
          } else {
            console.error("Failed to seed default data in Supabase:", insertError);
          }
        }
        return seedData;
      }
    } catch (err) {
      console.error("Unexpected error reading from Supabase (falling back to local):", err);
    }
  }

  // Local fallback
  try {
    ensureDbDirectory();
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    return normalizeDb(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return defaultDb;
  }
}

async function writeDb(data: any) {
  if (supabase && !supabaseTableMissing) {
    try {
      const { error } = await supabase
        .from("eqa_store")
        .upsert({ id: "main", data: data, updated_at: new Date().toISOString() });
      if (!error) {
        return true;
      }
      
      const isTableMissing = 
        error.code === "42P01" || 
        error.code === "PGRST205" ||
        (error.message && (
          error.message.includes("relation") || 
          error.message.includes("does not exist") || 
          error.message.includes("Could not find the table")
        ));
      if (isTableMissing) {
        supabaseTableMissing = true;
        console.warn("Table 'eqa_store' does not exist in Supabase during write. Falling back to local storage.");
      } else {
        console.error("Supabase write error (falling back to local):", error);
      }
    } catch (err) {
      console.error("Unexpected error writing to Supabase (falling back to local):", err);
    }
  }

  // Local fallback
  try {
    ensureDbDirectory();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Helper to format date nicely for LINE messages
function formatThaiDate(dateStr: string) {
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
    const year = date.getFullYear() + 543; // convert to Buddhist Era
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

// Function to send message to LINE Official Account (Messaging API)
async function sendLineOAMessage(
  token: string,
  message: string,
  sendType: string = "broadcast",
  targetId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: "Missing LINE Channel Access Token" };
  }

  const cleanToken = token.trim().replace(/[\r\n\t]/g, "");

  return new Promise((resolve) => {
    let path = "/v2/bot/message/broadcast";
    const body: any = {
      messages: [
        {
          type: "text",
          text: message.trim(),
        },
      ],
    };

    if (sendType === "push" && targetId) {
      path = "/v2/bot/message/push";
      body.to = targetId.trim();
    }

    const postData = JSON.stringify(body);

    const options = {
      hostname: "api.line.me",
      port: 443,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cleanToken}`,
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 8000, // 8 seconds timeout
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const statusCode = res.statusCode || 0;
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ success: true });
        } else {
          let errorDetail = data;
          try {
            const errJson = JSON.parse(data);
            if (errJson.message) {
              errorDetail = errJson.message + (errJson.details ? `: ${JSON.stringify(errJson.details)}` : "");
            }
          } catch {}
          resolve({ success: false, error: `LINE API Error (${statusCode}): ${errorDetail}` });
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        error: "การเชื่อมต่อไปยัง LINE API ใช้เวลานานเกินไป (Request timed out 8s) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของระบบเซิร์ฟเวอร์",
      });
    });

    req.on("error", (e) => {
      resolve({ success: false, error: e.message || "Network error sending to LINE" });
    });

    req.write(postData);
    req.end();
  });
}

// Background Alert Checker Engine
async function checkAndTriggerAlerts() {
  try {
    const db = await readDb();
    let dbModified = false;
    const now = new Date();

    for (const record of db.records) {
      if (!record.alerts || !Array.isArray(record.alerts)) continue;

      for (const alert of record.alerts) {
        if (alert.status !== "pending") continue;

        const remindTime = new Date(alert.remindAt);
        if (remindTime <= now) {
          // Time to trigger this alert!
          console.log(`Triggering alert ID ${alert.id} for EQA record [${record.round}] ${record.branch}`);

          let lineSuccess = false;
          let lineError = "";
          let lineTried = false;

          const topicName = alert.topicType === "deadline_warning" ? "⚠️ แจ้งเตือนครบกำหนดส่งผล" :
                            alert.topicType === "sample_received" ? "📦 แจ้งเตือนได้รับตัวอย่าง" :
                            alert.topicType === "results_received" ? "📑 แจ้งเตือนได้รับผลการประเมิน" :
                            alert.customTopic || "🔔 แจ้งเตือนทั่วไป";

          // Build notification message text
          const message = `
\n📢 [EQA Alert Memo]
📌 เรื่อง: ${topicName}
🧬 งาน: ${record.branch}
🏫 แหล่งที่มา: ${record.fromDept}
🔢 ครั้งที่/รอบ: ${record.round}
📅 กำหนดส่ง: ${formatThaiDate(record.deadlineDate)}
👤 ผู้รับผิดชอบ: ${record.responsiblePerson || "-"}
📝 โน้ต: ${record.notes || "-"}
⏱️ สถานะปัจจุบัน: ${record.status === "pending" ? "🔴 รอดำเนินการ" : record.status === "submitted" ? "🟡 ส่งผลแล้ว" : "🟢 เสร็จสิ้น"}
`;

          if (alert.notifyLine && db.settings.lineChannelAccessToken && db.settings.lineNotifyActive) {
            lineTried = true;
            const result = await sendLineOAMessage(
              db.settings.lineChannelAccessToken,
              message,
              db.settings.lineSendType || "broadcast",
              db.settings.lineTargetId
            );
            lineSuccess = result.success;
            lineError = result.error || "";
          }

          // Update alert status
          alert.status = (lineTried && !lineSuccess) ? "failed" : "sent";
          alert.sentAt = now.toISOString();
          if (lineError) {
            alert.errorMessage = lineError;
          }

          // Add log entry
          const logId = "log_" + Math.random().toString(36).substring(2, 11);
          db.logs.unshift({
            id: logId,
            recordId: record.id,
            recordTitle: `ครั้งที่ ${record.round} (${record.branch})`,
            message: message.trim(),
            type: alert.topicType,
            timestamp: now.toISOString(),
            channel: alert.notifyLine ? (alert.notifyWeb ? "both" : "line") : "web",
            status: (alert.status === "failed") ? "failed" : "success",
            error: lineError || undefined,
          });

          dbModified = true;
        }
      }
    }

    if (dbModified) {
      await writeDb(db);
    }
  } catch (err) {
    console.error("Error running background checkAndTriggerAlerts check:", err);
  }
}

// Start background checker (every 10 seconds, disabled on Vercel serverless)
if (!process.env.VERCEL) {
  setInterval(checkAndTriggerAlerts, 10000);
}

// Initialize Gemini API
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/* --- API Endpoints --- */

// Get Database Status
app.get("/api/db-status", (req, res) => {
  res.json({
    supabaseEnabled: !!supabase && !supabaseTableMissing,
    supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/https:\/\/(.*)\.supabase\.co.*/, "$1.supabase.co") : null,
    supabaseTableMissing: supabaseTableMissing,
    fallbackLocal: !supabase || supabaseTableMissing,
  });
});

// Get Settings
app.get("/api/settings", async (req, res) => {
  const db = await readDb();
  res.json(db.settings);
});

// Update Settings
app.post("/api/settings", async (req, res) => {
  const db = await readDb();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  await writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Get Records
app.get("/api/records", async (req, res) => {
  const db = await readDb();
  res.json(db.records);
});

// Create Record
app.post("/api/records", async (req, res) => {
  const db = await readDb();
  const newRecord = {
    id: "rec_" + Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    alerts: [],
    ...req.body,
  };
  db.records.unshift(newRecord);

  // Send immediate "ได้รับตัวอย่าง (Sample Received)" notification
  const topicName = "📦 แจ้งเตือนได้รับตัวอย่าง";
  const statusText = newRecord.status === "pending" ? "🔴 รอดำเนินการ" : newRecord.status === "submitted" ? "🟡 ส่งผลแล้ว" : "🟢 เสร็จสิ้น";
  
  const message = `📢 [EQA Alert Memo]
📌 เรื่อง: ${topicName}
🧬 งาน: ${newRecord.branch}
🏫 แหล่งที่มา: ${newRecord.fromDept}
🔢 ครั้งที่/รอบ: ${newRecord.round}
📅 กำหนดส่ง: ${formatThaiDate(newRecord.deadlineDate)}
👤 ผู้รับผิดชอบ: ${newRecord.responsiblePerson || "-"}
📝 โน้ต: ${newRecord.notes || "-"}
⏱️ สถานะปัจจุบัน: ${statusText}`;

  const hasLineToken = !!db.settings.lineChannelAccessToken;
  const isLineActive = !!db.settings.lineNotifyActive;

  if (hasLineToken && isLineActive) {
    const result = await sendLineOAMessage(
      db.settings.lineChannelAccessToken,
      message,
      db.settings.lineSendType || "broadcast",
      db.settings.lineTargetId
    );

    // If there is any 'sample_received' alert in the new record's alerts, mark it as sent
    if (newRecord.alerts && Array.isArray(newRecord.alerts)) {
      for (const alert of newRecord.alerts) {
        if (alert.topicType === "sample_received") {
          alert.status = result.success ? "sent" : "failed";
          alert.sentAt = new Date().toISOString();
          if (!result.success && result.error) {
            alert.errorMessage = result.error;
          }
        }
      }
    }

    // Add log entry
    const logId = "log_" + Math.random().toString(36).substring(2, 11);
    db.logs.unshift({
      id: logId,
      recordId: newRecord.id,
      recordTitle: `ครั้งที่ ${newRecord.round} (${newRecord.branch})`,
      message: message.trim(),
      type: "sample_received",
      timestamp: new Date().toISOString(),
      channel: "both",
      status: result.success ? "success" : "failed",
      error: result.error || undefined,
    });
  } else {
    // If LINE is not configured or disabled, mark matching alerts as sent for web and log locally
    if (newRecord.alerts && Array.isArray(newRecord.alerts)) {
      for (const alert of newRecord.alerts) {
        if (alert.topicType === "sample_received" && alert.notifyWeb) {
          alert.status = "sent";
          alert.sentAt = new Date().toISOString();
        }
      }
    }

    const logId = "log_" + Math.random().toString(36).substring(2, 11);
    db.logs.unshift({
      id: logId,
      recordId: newRecord.id,
      recordTitle: `ครั้งที่ ${newRecord.round} (${newRecord.branch})`,
      message: message.trim(),
      type: "sample_received",
      timestamp: new Date().toISOString(),
      channel: "web",
      status: "success",
    });
  }

  await writeDb(db);
  res.status(201).json(newRecord);
});

// Update Record
app.put("/api/records/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.records.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Record not found" });
  }

  db.records[index] = {
    ...db.records[index],
    ...req.body,
  };
  await writeDb(db);
  res.json(db.records[index]);
});

// Delete Record
app.delete("/api/records/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.records.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Record not found" });
  }

  db.records.splice(index, 1);
  await writeDb(db);
  res.json({ success: true });
});

// Get Logs
app.get("/api/logs", async (req, res) => {
  const db = await readDb();
  res.json(db.logs);
});

// Clear Logs
app.delete("/api/logs", async (req, res) => {
  const db = await readDb();
  db.logs = [];
  await writeDb(db);
  res.json({ success: true });
});

// Test LINE Official Account
app.post("/api/line/test", async (req, res) => {
  try {
    const { lineChannelAccessToken, lineSendType, lineTargetId, message } = req.body;
    if (!lineChannelAccessToken) {
      return res.status(400).json({ error: "Channel Access Token is required" });
    }

    const testMessage = message || "🔔 ทดสอบระบบการแจ้งเตือนจาก EQA Alert Memo! ระบบส่งการแจ้งเตือน LINE Official Account ของคุณพร้อมใช้งานแล้ว";
    const result = await sendLineOAMessage(
      lineChannelAccessToken,
      testMessage,
      lineSendType || "broadcast",
      lineTargetId
    );

    if (result.success) {
      // Save to logs as success
      const db = await readDb();
      const logId = "log_" + Math.random().toString(36).substring(2, 11);
      db.logs.unshift({
        id: logId,
        recordTitle: "ทดสอบ LINE OA",
        message: testMessage,
        type: "custom",
        timestamp: new Date().toISOString(),
        channel: "line",
        status: "success",
      });
      await writeDb(db);

      res.json({ success: true });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err: any) {
    console.error("Error in /api/line/test:", err);
    res.status(500).json({ error: err.message || "An unexpected server error occurred" });
  }
});

// OCR scan via Gemini
app.post("/api/ocr/eqa", async (req, res) => {
  const { base64Image, mimeType } = req.body;
  if (!base64Image || !mimeType) {
    return res.status(400).json({ error: "Missing base64Image or mimeType" });
  }

  try {
    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };

    const promptString = `
คุณคือผู้ช่วยจัดการระบบคุณภาพห้องปฏิบัติการทางการแพทย์ โปรดช่วยสแกนตารางบันทึกการรับ-ส่ง EQA จากเอกสารที่อัปโหลดนี้
วิเคราะห์ตารางและสกัดข้อมูลทุกแถวที่กรอกข้อมูลแล้วออกมาเป็น JSON อาเรย์ โดยมีฟิลด์ดังนี้:
1. receiveDate (วันที่รับตัวอย่างในรูปแบบ YYYY-MM-DD เช่น หากระบุ 1/7/69 ให้แปลผลเป็น พ.ศ. 2569 / ค.ศ. 2026 วันที่ 01 กรกฎาคม คือ '2026-07-01')
2. fromDept (ชื่อหน่วยงานต้นทาง เช่น ศูนย์วิทยาศาสตร์การแพทย์, กรมวิทยาศาสตร์การแพทย์)
3. branch (สาขางานที่เกี่ยวข้อง เช่น เคมี, ธนาคารเลือด, จุลชีววิทยา, โลหิตวิทยา)
4. deadlineDate (วันที่กำหนดส่งผล รูปแบบ YYYY-MM-DD เช่น หากเขียน 20/7/69 ให้แปลงเป็น ค.ศ. รูปแบบ '2026-07-20')
5. round (ครั้งที่ เช่น '3/69', '2/69')
6. responsiblePerson (ชื่อผู้รับผิดชอบหรือผู้กรอกข้อมูล)

คำเตือนที่สำคัญ: 
- ปีพ.ศ. ในตารางจะเป็นเลขย่อ 2 หลัก เช่น '69' หมายถึง ปีพ.ศ. 2569 ซึ่งตรงกับปีค.ศ. 2026 โปรดแปลงเป็น ค.ศ. (YYYY-MM-DD) ให้ถูกต้องเสมอ!
- คืนค่ากลับมาในรูปแบบ JSON ตรงตาม Schema เท่านั้น อย่าใส่คำบรรยายอื่นใดนอกเหนือจากผลลัพธ์ JSON
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptString }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "รายการแถวข้อมูลทะเบียนรับ-ส่ง EQA ที่ถอดความได้",
          items: {
            type: Type.OBJECT,
            properties: {
              receiveDate: {
                type: Type.STRING,
                description: "วันที่รับตัวอย่าง (รูปแบบ YYYY-MM-DD เช่น 2026-07-01)",
              },
              fromDept: {
                type: Type.STRING,
                description: "จากหน่วยงานที่ส่งตัวอย่าง EQA",
              },
              branch: {
                type: Type.STRING,
                description: "สาขางาน เช่น เคมี, ธนาคารเลือด, แบคทีเรีย",
              },
              deadlineDate: {
                type: Type.STRING,
                description: "วันกำหนดส่งผลประเมิน (รูปแบบ YYYY-MM-DD เช่น 2026-07-20)",
              },
              round: {
                type: Type.STRING,
                description: "ครั้งที่/รอบการประเมิน เช่น 3/69 หรือ 2/69",
              },
              responsiblePerson: {
                type: Type.STRING,
                description: "ผู้รับผิดชอบ (ถ้ามี)",
              },
            },
            required: ["fromDept", "branch", "deadlineDate", "round"],
          },
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text from Gemini API");
    }

    const jsonResult = JSON.parse(textOutput.trim());
    res.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    res.status(500).json({ error: error.message || "Failed to scan image with Gemini API" });
  }
});

// Trigger immediate check endpoint (for testing/realtime action)
app.post("/api/alerts/trigger-check", async (req, res) => {
  await checkAndTriggerAlerts();
  res.json({ success: true });
});

// Setup Vite Dev server middleware or serve production assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from:", distPath);
  }

  if (process.env.VERCEL) {
    console.log("Running in Vercel Serverless mode - listening skipped.");
    return;
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();

export default app;
