import React from "react";
import { 
  Video, 
  Archive, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { MOCK_TRANSFERS } from "../constants";
import { motion } from "motion/react";

export const Transfers: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">Transfers</h2>
          <p className="text-on-surface-variant mt-2 font-medium">Monitor and manage your active data streams across the obsidian mesh.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-bold border border-outline-variant/10 hover:bg-surface-container-low transition-all">
            Clear History
          </button>
          <button className="px-5 py-2.5 rounded-xl signature-gradient text-white text-sm font-bold transition-transform hover:scale-105 active:scale-95">
            New Transfer
          </button>
        </div>
      </div>

      {/* Active Transfers Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2 font-headline">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            Active Transfers
          </h3>
          <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">2 Files Processing</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {MOCK_TRANSFERS.map((task) => (
            <div key={task.id} className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 hover:shadow-sm transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.type === 'video' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-600'}`}>
                  {task.type === 'video' ? <Video size={24} /> : <Archive size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-on-surface truncate">{task.fileName}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">Bucket: {task.bucketName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-on-surface">{task.progress}%</span>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{task.status}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      className="h-full signature-gradient rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        <span className="text-xs font-medium text-on-surface">{task.speed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-on-surface-variant" />
                        <span className="text-xs font-medium text-on-surface">{task.remainingTime} remaining</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-surface-container-low text-on-surface hover:text-primary transition-colors">
                        {task.status === 'paused' ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                      </button>
                      <button className="p-2 rounded-lg bg-surface-container-low text-on-surface hover:text-red-500 transition-colors">
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-headline">Transfer History</h3>
          <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/10">
            <button className="px-4 py-1.5 text-xs font-bold bg-surface-container-lowest rounded-md text-on-surface shadow-sm">All</button>
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface">Uploads</button>
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface">Downloads</button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 text-[10px] uppercase font-black text-on-surface-variant tracking-widest border-b border-outline-variant/10">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Completed At</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              <tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <ArrowUp size={16} className="text-primary" />
                    <span className="text-sm font-bold text-on-surface">Campaign_Photos_Final.tar</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">2.4 GB</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <CheckCircle size={14} />
                    Success
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">Nov 24, 14:22 PM</td>
                <td className="px-6 py-5 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors"><RefreshCw size={16} /></button>
                </td>
              </tr>
              <tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <ArrowDown size={16} className="text-purple-500" />
                    <span className="text-sm font-bold text-on-surface">Legacy_Media_Archive.rar</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant">14.0 GB</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                    <AlertCircle size={14} />
                    Failed
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">Nov 23, 22:45 PM</td>
                <td className="px-6 py-5 text-right">
                  <button className="text-primary font-bold text-xs flex items-center gap-1 ml-auto">
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
