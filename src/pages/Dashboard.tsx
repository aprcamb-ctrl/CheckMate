import { Clock, Plus, Download, Share, QrCode, Wrench, CalendarDays, ReceiptPoundSterling, Database, DownloadCloud, UploadCloud } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const jobs = useStore(state => state.jobs);
  const navigate = useNavigate();
  
  const pendingJobs = useMemo(() => jobs.filter(j => j.status === 'PENDING'), [jobs]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Standard PWA Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // iOS Detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const exportData = () => {
    const data = localStorage.getItem('checkmate-storage');
    if (!data) return alert("No data found to backup!");
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        JSON.parse(result); // Validate JSON
        if (window.confirm("Are you sure you want to restore from this backup? This will overwrite ALL your current data!")) {
          localStorage.setItem('checkmate-storage', result);
          alert("Backup restored successfully! The app will now reload.");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file. Restoration failed.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-24 relative animate-fade-in-up">
      {/* Header Profile Section */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <h2 className="text-3xl font-bold mb-2 tracking-tight">Overview</h2>
        <p className="text-slate-500 font-medium text-lg">You have <span className="text-primary-600 font-bold">{pendingJobs.length} jobs</span> pending today.</p>
      </div>

      {deferredPrompt && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold">Install App</h3>
            <p className="text-sm text-blue-100">Add CheckMate to your home screen for offline access</p>
          </div>
          <button onClick={handleInstallClick} className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
            <Download className="w-4 h-4 inline-block mr-1" />
            Install
          </button>
        </div>
      )}

      {/* iOS Safari Fallback */}
      {isIos && !isStandalone && !deferredPrompt && (
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-3xl p-5 text-white shadow-lg">
          <h3 className="font-bold flex items-center gap-2 mb-1">
            Install CheckMate
          </h3>
          <p className="text-sm text-slate-300 leading-snug">
            To install this app on your iPhone, tap the <Share className="w-4 h-4 inline-block mx-0.5 text-blue-400" /> Share button in Safari's bottom menu, then scroll down and tap <strong>"Add to Home Screen"</strong>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => navigate('/todo')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Plus strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Jobs List</span>
        </div>
        
        <div 
          onClick={() => navigate('/timesheets')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Clock strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Timesheets</span>
        </div>

        <div 
          onClick={() => navigate('/equipment')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Wrench strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Equipment</span>
        </div>
        
        <div 
          onClick={() => navigate('/scan')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <QrCode strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Scan Asset</span>
        </div>

        <div 
          onClick={() => navigate('/events')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-indigo-400 to-violet-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <CalendarDays strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Events</span>
        </div>

        <div 
          onClick={() => navigate('/receipts')}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group"
        >
          <div className="bg-gradient-to-br from-rose-400 to-red-500 text-white p-3.5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <ReceiptPoundSterling strokeWidth={2.5} className="w-7 h-7" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Receipts</span>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="mt-8 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 px-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-500" />
          Data Backup & Restore
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={exportData}
            className="glass-panel p-4 flex flex-col items-center justify-center text-center hover-lift cursor-pointer tap-effect text-slate-600 hover:text-primary-600"
          >
            <DownloadCloud className="w-6 h-6 mb-2" />
            <span className="font-bold text-sm">Backup Data</span>
          </button>
          
          <label className="glass-panel p-4 flex flex-col items-center justify-center text-center hover-lift cursor-pointer tap-effect text-slate-600 hover:text-emerald-600">
            <UploadCloud className="w-6 h-6 mb-2" />
            <span className="font-bold text-sm">Restore Data</span>
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
      </div>
    </div>
  );
}
