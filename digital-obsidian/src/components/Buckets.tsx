import React from "react";
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  MoreVertical, 
  ChevronRight, 
  Upload, 
  FolderPlus, 
  Download, 
  Move, 
  Trash2, 
  RefreshCw,
  Filter,
  ArrowUpDown,
  Maximize2,
  Share2,
  Lock
} from "lucide-react";
import { motion } from "motion/react";

export const Buckets: React.FC = () => {
  const files = [
    { name: "Marketing_Assets_2024", type: "Directory", size: "--", modified: "2 mins ago", icon: Folder, color: "text-primary" },
    { name: "hero_banner_dark.png", type: "PNG Image", size: "12.4 MB", modified: "Oct 24, 2023", icon: ImageIcon, color: "text-primary", selected: true },
    { name: "deployment_guide.pdf", type: "PDF Document", size: "4.2 MB", modified: "Oct 22, 2023", icon: FileText, color: "text-amber-500" },
    { name: "brand_reveal_final.mp4", type: "MPEG-4 Video", size: "248.0 MB", modified: "Oct 15, 2023", icon: Video, color: "text-red-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Context Header & Toolbar */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm font-medium">
            <span className="text-on-surface-variant">Buckets</span>
            <ChevronRight size={16} className="text-on-surface-variant/50" />
            <span className="text-on-surface font-headline font-bold text-lg">my-images-bucket</span>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Public Access</span>
          </nav>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 signature-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              <Upload size={16} />
              <span>Upload</span>
            </button>
            <button className="p-2 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-lowest transition-colors border border-outline-variant/10">
              <FolderPlus size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
          <div className="flex items-center gap-1">
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest rounded-lg transition-all" title="Download">
              <Download size={18} />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest rounded-lg transition-all" title="Move">
              <Move size={18} />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
              <Trash2 size={18} />
            </button>
            <div className="w-px h-6 bg-outline-variant/20 mx-2"></div>
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest rounded-lg transition-all" title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg text-xs font-medium text-on-surface-variant cursor-pointer hover:bg-surface-container-low transition-colors border border-outline-variant/10">
              <Filter size={14} />
              <span>Filter</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg text-xs font-medium text-on-surface-variant cursor-pointer hover:bg-surface-container-low transition-colors border border-outline-variant/10">
              <ArrowUpDown size={14} />
              <span>Sort by: Name</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex gap-8 items-start">
        {/* File Table Container */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 border-b border-outline-variant/10">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" /></th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Last Modified</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {files.map((file, idx) => (
                <tr key={idx} className={`group hover:bg-surface-container-low transition-all cursor-pointer ${file.selected ? "bg-primary/5" : ""}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={file.selected} className="rounded border-outline-variant text-primary focus:ring-primary" readOnly /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <file.icon size={20} className={file.color} />
                      <span className="font-medium text-on-surface">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{file.type}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{file.size}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{file.modified}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-on-surface transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Info Panel */}
        <aside className="w-80 flex flex-col gap-6 sticky top-24">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 flex flex-col shadow-sm">
            <div className="h-48 bg-surface-container-low relative group">
              <img 
                src="https://picsum.photos/seed/obsidian/800/600" 
                alt="Preview" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
              <button className="absolute top-3 right-3 p-2 bg-white/50 backdrop-blur rounded-lg text-on-surface hover:bg-primary hover:text-white transition-colors">
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface leading-tight">hero_banner_dark.png</h3>
                <p className="text-xs text-on-surface-variant mt-1">Uploaded Oct 24, 2023 • 12.4 MB</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Format</span>
                  <span className="text-sm font-medium text-on-surface">PNG</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg">
                  <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Resolution</span>
                  <span className="text-sm font-medium text-on-surface">3840x2160</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Permissions</span>
                  <span className="text-primary font-medium">Read/Write</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Storage Class</span>
                  <span className="text-on-surface font-medium">Standard</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Encryption</span>
                  <span className="flex items-center gap-1 text-on-surface font-medium">
                    <Lock size={12} className="text-primary" />
                    AES-256
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-surface-container-low hover:bg-surface-container-lowest text-on-surface text-sm font-bold rounded-lg transition-colors border border-outline-variant/10">Edit Tags</button>
                <button className="px-3 py-2 bg-surface-container-low hover:bg-surface-container-lowest text-on-surface rounded-lg transition-colors border border-outline-variant/10">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bucket Capacity</span>
              <span className="text-xs font-bold text-primary">64%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="signature-gradient h-full w-[64%]"></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3 text-center">12.8 GB of 20 GB used in this bucket</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
