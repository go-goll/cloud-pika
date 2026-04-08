import { LucideIcon } from "lucide-react";

export interface Bucket {
  id: string;
  name: string;
  region: string;
  storageUsed: string;
  fileCount: number;
  type: "Standard" | "IA" | "Archive";
  status: "Nominal" | "Warning" | "Error";
}

export interface TransferTask {
  id: string;
  fileName: string;
  bucketName: string;
  progress: number;
  speed: string;
  remainingTime: string;
  status: "uploading" | "downloading" | "paused" | "completed" | "failed";
  type: "file" | "video" | "archive";
}

export interface ActivityLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: "upload" | "delete" | "share" | "system";
  meta?: string;
}
