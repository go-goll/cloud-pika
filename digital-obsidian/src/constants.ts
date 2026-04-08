import { Bucket, TransferTask, ActivityLog } from "./types";

export const MOCK_BUCKETS: Bucket[] = [
  {
    id: "1",
    name: "media-assets-prod",
    region: "US-East-1",
    storageUsed: "4.2 TB",
    fileCount: 128492,
    type: "Standard",
    status: "Nominal",
  },
  {
    id: "2",
    name: "backup-db-archive",
    region: "EU-West-2",
    storageUsed: "12.8 TB",
    fileCount: 4201,
    type: "Archive",
    status: "Nominal",
  },
  {
    id: "3",
    name: "client-delivery-cdn",
    region: "AP-Southeast-1",
    storageUsed: "840 GB",
    fileCount: 89112,
    type: "IA",
    status: "Nominal",
  },
];

export const MOCK_TRANSFERS: TransferTask[] = [
  {
    id: "t1",
    fileName: "Raw_Footage_8K_Master.mxf",
    bucketName: "production-assets-west-1",
    progress: 74,
    speed: "42.5 MB/s",
    remainingTime: "12m 45s",
    status: "uploading",
    type: "video",
  },
  {
    id: "t2",
    fileName: "Database_Backup_2023_Q4.zip",
    bucketName: "security-vault-cold",
    progress: 12,
    speed: "8.2 MB/s",
    remainingTime: "2h 14m",
    status: "downloading",
    type: "archive",
  },
];

export const MOCK_ACTIVITY: ActivityLog[] = [
  {
    id: "a1",
    action: "Uploaded",
    target: "production_db_dump.sql",
    timestamp: "2 mins ago",
    type: "upload",
    meta: "backup-db-archive",
  },
  {
    id: "a2",
    action: "Deleted",
    target: "temp_cache_01.bin",
    timestamp: "14 mins ago",
    type: "delete",
    meta: "media-assets-prod",
  },
  {
    id: "a3",
    action: "Shared",
    target: "marketing_assets_q4.zip",
    timestamp: "1 hour ago",
    type: "share",
  },
];
