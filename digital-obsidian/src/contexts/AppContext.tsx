import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "zh";
type Theme = "light" | "dark";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: "Dashboard",
    buckets: "Buckets",
    transfers: "Transfers",
    settings: "Settings",
    searchPlaceholder: "Search files, buckets...",
    systemStatus: "System Status: Operational",
    overview: "Storage Overview",
    overviewSub: "Manage your global storage nodes and data distribution.",
    createBucket: "Create New Bucket",
    totalStorage: "Total Storage",
    activeBuckets: "Active Buckets",
    requests: "Monthly Requests",
    egress: "Egress Traffic",
    latency: "Avg Latency",
    recentActivity: "Recent Activity",
    viewAllLogs: "View All Logs",
    optimization: "Optimization Suggestions",
    optimizationSub: "We detected 3 unused buckets that can be converted to archive tier to save ~15% cost.",
    optimizeNow: "Optimize Now",
    stats: "Bucket Stats",
    standard: "Standard",
    ia: "Infrequent Access",
    archive: "Archive",
    offlineManager: "Offline Manager",
    environment: "Environment",
    addEnvironment: "Add Environment",
    profile: "Profile Settings",
    security: "Security & Privacy",
    api: "API Credentials",
    notifications: "Notifications",
    general: "General Settings",
    envConfig: "Environment Config",
    systemAlerts: "System Alerts",
    saveChanges: "Save Changes",
    discard: "Discard",
    darkMode: "Dark Mode",
    language: "Language",
    chinese: "Chinese",
    english: "English",
    logout: "Log Out",
    newBucketTitle: "Create New Bucket",
    newBucketSub: "A bucket is a container for objects stored in Cloud Arch.",
    bucketName: "Bucket Name",
    region: "Region",
    storageClass: "Storage Class",
    cancel: "Cancel",
    create: "Create",
    success: "Success",
    failed: "Failed",
    running: "Running",
    paused: "Paused",
  },
  zh: {
    dashboard: "仪表盘",
    buckets: "存储桶",
    transfers: "传输列表",
    settings: "设置",
    searchPlaceholder: "搜索文件、存储桶...",
    systemStatus: "系统状态: 正常运行",
    overview: "存储空间概览",
    overviewSub: "管理您的全球存储节点与数据分布。",
    createBucket: "创建新存储桶",
    totalStorage: "总存储量",
    activeBuckets: "活跃存储桶",
    requests: "本月请求数",
    egress: "出口流量",
    latency: "平均延迟",
    recentActivity: "近期操作",
    viewAllLogs: "查看全部日志",
    optimization: "优化建议",
    optimizationSub: "我们检测到 3 个不常用的存储桶可以转换为归档层以节省约 15% 的成本。",
    optimizeNow: "立即优化",
    stats: "存储桶状态统计",
    standard: "标准型",
    ia: "低频访问",
    archive: "归档型",
    offlineManager: "离线管理器",
    environment: "运行环境",
    addEnvironment: "添加环境",
    profile: "个人资料",
    security: "安全与隐私",
    api: "API 凭证",
    notifications: "通知设置",
    general: "常规设置",
    envConfig: "环境配置",
    systemAlerts: "系统告警",
    saveChanges: "保存更改",
    discard: "放弃",
    darkMode: "深色模式",
    language: "语言",
    chinese: "中文",
    english: "英文",
    logout: "退出登录",
    newBucketTitle: "创建新存储桶",
    newBucketSub: "存储桶是用于存储对象的容器。",
    bucketName: "存储桶名称",
    region: "区域",
    storageClass: "存储类型",
    cancel: "取消",
    create: "立即创建",
    success: "成功",
    failed: "失败",
    running: "运行中",
    paused: "已暂停",
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations["en"]] || key;
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, toggleTheme, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
