import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Database, 
  ArrowLeftRight, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Layers, 
  Cloud,
  Search,
  Bell,
  History,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Languages
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../contexts/AppContext";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  const [isEnvOpen, setIsEnvOpen] = React.useState(false);
  const [currentEnv, setCurrentEnv] = React.useState("Production (AWS)");

  const environments = [
    { name: "Production (AWS)", region: "us-east-1", color: "bg-blue-500" },
    { name: "Staging (Azure)", region: "westeurope", color: "bg-purple-500" },
    { name: "Local Dev (MinIO)", region: "localhost", color: "bg-green-500" },
  ];

  const navItems = [
    { icon: LayoutDashboard, label: t("dashboard"), path: "/" },
    { icon: Database, label: t("buckets"), path: "/buckets" },
    { icon: ArrowLeftRight, label: t("transfers"), path: "/transfers" },
    { icon: SettingsIcon, label: t("settings"), path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-surface text-on-surface transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/10 flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 signature-gradient rounded-lg flex items-center justify-center text-white shadow-sm">
            <Cloud size={24} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-lg font-black text-on-surface font-headline tracking-tighter leading-none">Cloud Arch</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t("offlineManager")}</p>
          </div>
        </div>

        {/* Environment Switcher */}
        <div className="relative mb-8">
          <button 
            onClick={() => setIsEnvOpen(!isEnvOpen)}
            className="w-full flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl hover:bg-surface-container-low transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${environments.find(e => e.name === currentEnv)?.color || 'bg-primary'}`}></div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant leading-none mb-1">{t("environment")}</div>
                <div className="text-xs font-bold text-on-surface truncate max-w-[100px]">{currentEnv}</div>
              </div>
            </div>
            <ChevronDown size={14} className={`text-on-surface-variant transition-transform ${isEnvOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isEnvOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {environments.map((env) => (
                  <button
                    key={env.name}
                    onClick={() => {
                      setCurrentEnv(env.name);
                      setIsEnvOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full ${env.color}`}></div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">{env.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{env.region}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-headline text-sm font-semibold uppercase tracking-wider transition-all group ${
                  isActive 
                    ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/50" 
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/50"
                }`}
              >
                <item.icon size={20} className={`transition-transform group-hover:translate-x-1 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-outline-variant/10">
          <button className="w-full py-3 signature-gradient text-white rounded-lg font-bold text-sm shadow-md hover:opacity-90 transition-all active:scale-95">
            {t("addEnvironment")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 w-full z-40 bg-surface/70 backdrop-blur-xl flex justify-between items-center px-8 py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-12">
            <span className="text-xl font-bold tracking-tighter text-on-surface font-headline">Digital Obsidian</span>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t("searchPlaceholder")} 
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm w-80 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full"
              title={t("darkMode")}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all rounded-lg border border-outline-variant/10"
            >
              <Languages size={16} />
              <span>{language === "en" ? "EN" : "中文"}</span>
            </button>

            <div className="h-px w-4 bg-outline-variant/20 mx-2 rotate-90"></div>

            <div className="flex gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full">
                <Bell size={20} />
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full">
                <HelpCircle size={20} />
              </button>
            </div>
            <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-surface-container-low ring-offset-2 cursor-pointer hover:scale-105 transition-transform">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfsGiD1n12o6gWFimFYxoeZKTcg_xpmPNYHp-hSmjCNm2EILwnhtyWm60pLx6S8MjN5sap45nLXNCPcrsDfafdBOpetD6xKv4QROuOB02qdtwx3eqjP9LFOFBGPvwe0qu5zkv4F57ZecSvL-04JeV5UALTnyZ6nEPSm-w-Rwz2WWfo-dyM33DBOoyNabQVjbEJ5oduzO7v8TgFoTyt1yQzUdx7fKo0-Xnu9gCW7sTBSGDg94L8RMCu9qr1J2AT_uwYc1uHmud6eAY" 
                alt="User" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <main className="p-8 md:p-12 max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
