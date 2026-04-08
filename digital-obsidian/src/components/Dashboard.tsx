import React, { useState } from "react";
import { 
  TrendingUp, 
  Database, 
  Zap, 
  PlusCircle, 
  FileUp, 
  History, 
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  X,
  Globe,
  Shield,
  Zap as ZapIcon
} from "lucide-react";
import { MOCK_BUCKETS, MOCK_ACTIVITY } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../contexts/AppContext";

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useApp();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs font-bold tracking-widest uppercase">{t("systemStatus")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline">{t("overview")}</h1>
          <p className="text-on-surface-variant text-lg">{t("overviewSub")}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 signature-gradient rounded-xl text-white font-bold flex items-center gap-3 shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
        >
          <PlusCircle size={20} />
          <span>{t("createBucket")}</span>
        </button>
      </div>

      {/* Create Bucket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black font-headline text-on-surface">{t("newBucketTitle")}</h2>
                    <p className="text-sm text-on-surface-variant">{t("newBucketSub")}</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">{t("bucketName")}</label>
                    <input 
                      type="text" 
                      placeholder="例如: my-assets-bucket"
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">{t("region")}</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                        <select className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none transition-all appearance-none">
                          <option>US East (N. Virginia)</option>
                          <option>EU West (Ireland)</option>
                          <option>Asia Pacific (Tokyo)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">{t("storageClass")}</label>
                      <div className="relative">
                        <ZapIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                        <select className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest outline-none transition-all appearance-none">
                          <option>{t("standard")}</option>
                          <option>Intelligent-Tiering</option>
                          <option>{t("archive")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-4">
                    <Shield className="text-primary shrink-0" size={20} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">安全建议</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">默认情况下，我们将启用服务器端加密 (SSE-S3) 并阻止所有公共访问，以确保您的数据安全。</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl text-on-surface font-bold text-sm hover:bg-surface-container-low transition-all"
                  >
                    {t("cancel")}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-[2] py-3.5 rounded-xl signature-gradient text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    {t("create")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {/* Large Metric Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-surface-container-lowest border border-outline-variant/10 p-8 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database size={200} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{t("totalStorage")}</span>
            <span className="text-primary bg-primary/10 px-2 py-1 rounded text-xs font-bold">+12.5%</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-6xl font-black text-on-surface tracking-tighter font-headline">42.8</span>
            <span className="text-2xl font-bold text-on-surface-variant">TB</span>
          </div>
          <div className="mt-8 w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
            <div className="signature-gradient h-full w-[65%]"></div>
          </div>
        </div>

        {/* Secondary Metric */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-surface-container-lowest border border-outline-variant/10 p-8 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{t("activeBuckets")}</span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Database size={20} />
            </div>
          </div>
          <div className="text-5xl font-extrabold tracking-tight text-on-surface mb-8 font-headline">24 <span className="text-lg font-medium text-on-surface-variant">/ 30</span></div>
          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
            <div className="signature-gradient h-full w-[80%] rounded-full"></div>
          </div>
        </div>

        {/* Small Grid Items */}
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("requests")}</span>
          <div className="mt-4">
            <div className="text-3xl font-bold text-on-surface font-headline">1.2M</div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("egress")}</span>
          <div className="mt-4">
            <div className="text-3xl font-bold text-on-surface font-headline">856 <span className="text-sm font-medium">GB</span></div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("latency")}</span>
          <div className="mt-4">
            <div className="text-3xl font-bold text-on-surface font-headline">18 <span className="text-sm font-medium">ms</span></div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight font-headline">{t("recentActivity")}</h3>
            <button className="text-primary text-sm font-bold hover:underline">{t("viewAllLogs")}</button>
          </div>
          <div className="space-y-4">
            {MOCK_ACTIVITY.map((item) => (
              <div key={item.id} className="group flex items-center gap-6 p-4 rounded-xl transition-all hover:bg-surface-container-lowest hover:shadow-sm border border-transparent hover:border-outline-variant/10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  item.type === 'upload' ? 'bg-cyan-50 text-cyan-600' : 
                  item.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {item.type === 'upload' ? <FileUp size={20} /> : 
                   item.type === 'delete' ? <AlertTriangle size={20} /> : <Sparkles size={20} />}
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-on-surface">{item.action} {item.target}</h4>
                  <p className="text-sm text-on-surface-variant">
                    {item.meta ? `Bucket: ${item.meta}` : 'System operation'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">{item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          <div className="signature-gradient text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-2 font-headline">{t("optimization")}</h4>
              <p className="text-white/80 text-sm mb-6">{t("optimizationSub")}</p>
              <button className="bg-white text-primary px-4 py-2 rounded font-bold text-xs hover:bg-surface-container-low transition-colors">
                {t("optimizeNow")}
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 font-headline">
              <BarChart3 className="text-primary" size={20} />
              {t("stats")}
            </h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-on-surface-variant">{t("standard")}</span>
                <span className="font-bold">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-on-surface-variant">{t("ia")}</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-on-surface-variant">{t("archive")}</span>
                <span className="font-bold">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
