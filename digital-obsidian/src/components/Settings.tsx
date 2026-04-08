import React from "react";
import { 
  User, 
  Shield, 
  Key, 
  Bell, 
  Globe, 
  CreditCard, 
  ChevronRight,
  Camera,
  Check,
  Moon,
  Sun,
  Languages
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../contexts/AppContext";

export const Settings: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  
  const sections = [
    { id: "general", icon: Globe, label: t("general"), description: "Configure global app behavior and defaults." },
    { id: "environments", icon: Shield, label: t("envConfig"), description: "Manage cloud provider connections and regions." },
    { id: "api", icon: Key, label: t("api"), description: "Manage your Access and Secret keys for cloud providers." },
    { id: "notifications", icon: Bell, label: t("systemAlerts"), description: "Configure how you receive system notifications." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline">{t("settings")}</h1>
        <p className="text-on-surface-variant text-lg">Configure your offline cloud management workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Navigation */}
        <div className="md:col-span-4 space-y-2">
          {sections.map((section) => (
            <button 
              key={section.id}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group ${
                section.id === 'general' 
                  ? "bg-surface-container-lowest shadow-sm border border-outline-variant/10" 
                  : "hover:bg-surface-container-low"
              }`}
            >
              <div className={`p-2 rounded-lg ${section.id === 'general' ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                <section.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-on-surface">{section.label}</div>
                <div className="text-[10px] text-on-surface-variant truncate">{section.description}</div>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 space-y-8">
          {/* General Section */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-8 shadow-sm space-y-8">
            <h3 className="text-xl font-bold font-headline">{t("general")}</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Default Download Path</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    defaultValue="/Users/gollwang/Downloads/CloudArch"
                    className="flex-1 bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none transition-all"
                  />
                  <button className="px-4 bg-surface-container-low border border-outline-variant/10 rounded-xl text-xs font-bold hover:bg-surface-container-lowest transition-all">Browse</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Concurrent Transfers</label>
                <select className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none transition-all appearance-none">
                  <option>3 (Recommended)</option>
                  <option>5 (High Performance)</option>
                  <option>1 (Low Bandwidth)</option>
                </select>
              </div>

              {/* Theme Toggle in Settings */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container-lowest rounded-lg text-primary">
                    {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t("darkMode")}</div>
                    <div className="text-[10px] text-on-surface-variant">Switch between light and dark themes</div>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-outline-variant'}`}
                >
                  <motion.div 
                    animate={{ x: theme === 'dark' ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* Language Toggle in Settings */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-container-lowest rounded-lg text-primary">
                    <Languages size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t("language")}</div>
                    <div className="text-[10px] text-on-surface-variant">Select your preferred language</div>
                  </div>
                </div>
                <div className="flex bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/10">
                  <button 
                    onClick={() => setLanguage("zh")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'zh' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                  >
                    {t("chinese")}
                  </button>
                  <button 
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                  >
                    {t("english")}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button className="px-6 py-2.5 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-all">{t("discard")}</button>
              <button className="px-6 py-2.5 rounded-xl signature-gradient text-white font-bold text-sm shadow-md hover:opacity-90 transition-all">{t("saveChanges")}</button>
            </div>
          </div>

          {/* API Keys Preview */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                <Key size={20} className="text-primary" />
                Active API Keys
              </h3>
              <button className="text-primary text-xs font-bold hover:underline">Revoke All</button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-on-surface">Production Key</div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-1">AKIA********************</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Created 12 days ago</span>
                  <button className="p-2 hover:bg-surface-container-lowest rounded-lg transition-colors text-on-surface-variant">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
