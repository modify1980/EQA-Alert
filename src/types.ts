export interface AlertSchedule {
  id: string;
  topicType: 'deadline_warning' | 'sample_received' | 'results_received' | 'custom';
  customTopic?: string;
  remindAt: string; // ISO datetime string (e.g. 2026-07-15T09:00:00)
  notifyLine: boolean;
  notifyWeb: boolean;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  errorMessage?: string;
}

export interface EqaRecord {
  id: string;
  receiveDate: string; // YYYY-MM-DD
  fromDept: string;
  branch: string; // e.g. เคมี, ธนาคารเลือด, จุลชีววิทยา
  deadlineDate: string; // YYYY-MM-DD
  round: string; // e.g. 3/69, 2/69
  responsiblePerson: string;
  status: 'pending' | 'submitted' | 'completed' | 'overdue';
  submissionDate?: string; // YYYY-MM-DD
  submittedBy?: string;
  resultReceiptDate?: string; // YYYY-MM-DD
  resultReceivedBy?: string;
  notes?: string;
  alerts: AlertSchedule[];
  createdAt: string;
}

export interface AppSettings {
  lineChannelAccessToken: string;
  lineSendType: 'broadcast' | 'push';
  lineTargetId: string;
  lineNotifyActive: boolean;
  enableSoundAlerts: boolean;
  lineGroupUrl?: string;
}

export interface NotificationLog {
  id: string;
  recordId?: string;
  recordTitle: string;
  message: string;
  type: string;
  timestamp: string;
  channel: 'line' | 'web' | 'both';
  status: 'success' | 'failed';
  error?: string;
}

export interface OcrResult {
  receiveDate?: string; // YYYY-MM-DD
  fromDept?: string;
  branch?: string;
  deadlineDate?: string; // YYYY-MM-DD
  round?: string;
  responsiblePerson?: string;
}
