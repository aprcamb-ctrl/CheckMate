import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, CheckCircle2, Image as ImageIcon, Layers, Plus, X, Edit3, ReceiptPoundSterling } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useRef, useEffect } from 'react';

export default function JobExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { jobs, materials, receipts, startJob, pauseJob, completeJob, assignMaterialToJob, addPhotoToJob, overrideJobTime, updateJobReminderInterval } = useStore();
  const job = jobs.find(j => j.id === id);
  const jobReceipts = receipts.filter(r => r.jobId === id);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('0');
  const [elapsed, setElapsed] = useState(0);
  const [reminderMinutes, setReminderMinutes] = useState<number>(job?.reminderInterval || 0);
  const lastReminderRef = useRef<number>(0);
  const [photoTab, setPhotoTab] = useState<'before'|'after'>('before');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addPhotoToJob(job!.id, reader.result as string, photoTab);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!job) {
    return (
      <div className="p-6 text-center text-slate-500">
        Job not found. <button onClick={() => navigate(-1)} className="text-primary-600">Go back</button>
      </div>
    );
  }

  const isRunning = job.status === 'IN_PROGRESS';
  const assignedMaterialsCount = job.materialsUsed?.reduce((sum, m) => sum + m.quantity, 0) || 0;
  
  useEffect(() => {
    if (!job) return;
    
    const calcElapsed = () => {
      let total = 0;
      job.timeLogs.forEach(log => {
        const start = new Date(log.startedAt).getTime();
        const end = log.endedAt ? new Date(log.endedAt).getTime() : Date.now();
        total += (end - start) / 1000;
      });
      return Math.floor(total);
    };

    setElapsed(calcElapsed());

    if (job.reminderInterval) {
      lastReminderRef.current = Math.floor(calcElapsed() / (job.reminderInterval * 60));
    }

    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        const newElapsed = calcElapsed();
        setElapsed(newElapsed);

        if (reminderMinutes > 0) {
          const reminderSeconds = reminderMinutes * 60;
          const intervalsPassed = Math.floor(newElapsed / reminderSeconds);
          
          if (intervalsPassed > 0 && intervalsPassed > lastReminderRef.current) {
            lastReminderRef.current = intervalsPassed;
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('CheckMate Reminder', { 
                body: `Job "${job.title}" has been running for ${intervalsPassed * reminderMinutes} minutes. Don't forget to pause or complete it!`,
                icon: '/icon.jpg'
              });
            } else {
              alert(`Reminder: Job "${job.title}" has been running for ${intervalsPassed * reminderMinutes} minutes. Don't forget to pause or complete it!`);
            }
          }
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [job, isRunning, reminderMinutes]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isRunning) pauseJob(job.id);
    else startJob(job.id);
  };

  const handleComplete = () => {
    completeJob(job.id);
    navigate(-1);
  };

  const openEditTime = () => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    setEditHours(h.toString());
    setEditMinutes(m.toString());
    setShowEditTime(true);
  };

  const handleSaveEditTime = () => {
    const totalSeconds = parseInt(editHours || '0') * 3600 + parseInt(editMinutes || '0') * 60;
    overrideJobTime(job.id, totalSeconds);
    if (reminderMinutes > 0) {
      lastReminderRef.current = Math.floor(totalSeconds / (reminderMinutes * 60));
    }
    setShowEditTime(false);
  };
  
  const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mins = Number(e.target.value);
    setReminderMinutes(mins);
    updateJobReminderInterval(job.id, mins);
    if (mins > 0) {
      lastReminderRef.current = Math.floor(elapsed / (mins * 60));
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };
  
  return (
    <div className="space-y-6 pb-20 relative animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full glass-panel hover-lift text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Job Details</h2>
      </div>

      {/* Main Info Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">{job.title}</h3>
        <p className="text-slate-500 text-sm mb-6">Status: 
          <span className={`font-semibold ml-1 ${
            job.status === 'COMPLETED' ? 'text-emerald-500' :
            job.status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-slate-600'
          }`}>
            {job.status.replace('_', ' ')}
          </span>
        </p>
        
        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-6">
          <div 
            onClick={openEditTime}
            className={`flex items-center justify-center gap-3 cursor-pointer group tap-effect ${isRunning ? 'text-primary-600 animate-pulse-soft' : 'text-slate-700'}`}
          >
            <span className="text-5xl font-light tracking-widest font-mono">
              {formatTime(elapsed)}
            </span>
            <div className="bg-slate-100 p-2 rounded-full text-slate-500 dark:bg-slate-800 dark:text-slate-300 shadow-sm transition-colors">
              <Edit3 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            Elapsed Time
            {job.status === 'COMPLETED' && <span className="text-emerald-500 lowercase">(completed)</span>}
          </span>
          
          {/* Reminder Dropdown */}
          {job.status !== 'COMPLETED' && (
            <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reminder:</label>
              <select 
                value={reminderMinutes} 
                onChange={handleReminderChange}
                className="bg-transparent text-sm font-bold text-primary-600 outline-none border-none cursor-pointer hover:text-primary-700 transition-colors"
              >
                <option value={0} className="text-slate-800">Off</option>
                <option value={15} className="text-slate-800">Every 15 mins</option>
                <option value={30} className="text-slate-800">Every 30 mins</option>
                <option value={45} className="text-slate-800">Every 45 mins</option>
                <option value={60} className="text-slate-800">Every 1 hour</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {job.status !== 'COMPLETED' && (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleToggle}
            className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover-lift text-primary-600 group tap-effect"
          >
            <div className="bg-primary-50 p-3 rounded-full group-hover:bg-primary-100 transition-colors">
              {isRunning ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
            </div>
            <span className="font-semibold text-sm tracking-wide">{isRunning ? 'Pause' : 'Resume'}</span>
          </button>
          
          <button 
            onClick={handleComplete}
            className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover-lift text-emerald-600 group tap-effect"
          >
            <div className="bg-emerald-50 p-3 rounded-full group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="font-semibold text-sm tracking-wide">Complete Job</span>
          </button>
        </div>
      )}

      {/* Utilities */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-lg px-1">Job Utilities</h4>
        
        <button 
          onClick={() => setShowMaterialsModal(true)}
          className="w-full glass-panel p-4 flex items-center justify-between hover-lift tap-effect group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white p-2.5 rounded-xl shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-700">Assign Materials</span>
          </div>
          <span className="text-primary-600 text-sm font-bold bg-primary-50 px-3 py-1 rounded-full group-hover:bg-primary-100 transition-colors">{assignedMaterialsCount} items</span>
        </button>
        
        {/* Hidden File Input for Native Camera/Gallery */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handlePhotoCapture} 
        />
        
        {/* Photos Section */}
        <div className="glass-panel p-4 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white p-2.5 rounded-xl shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-700">Photos</span>
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button 
              onClick={() => setPhotoTab('before')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${photoTab === 'before' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Before ({job.beforePhotos?.length || 0})
            </button>
            <button 
              onClick={() => setPhotoTab('after')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${photoTab === 'after' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              After ({job.afterPhotos?.length || 0})
            </button>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 font-semibold hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 tap-effect"
          >
            <Plus className="w-5 h-5" /> Add {photoTab === 'before' ? 'Before' : 'After'} Photo
          </button>
          
          {/* Gallery */}
          <div className="grid grid-cols-3 gap-2">
            {(photoTab === 'before' ? job.beforePhotos : job.afterPhotos)?.map((photo, i) => (
              <img key={i} src={photo} className="w-full h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" alt={`${photoTab} job attachment ${i+1}`} />
            ))}
          </div>
        </div>

        {/* Receipts Section */}
        {jobReceipts.length > 0 && (
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-rose-400 to-red-500 text-white p-2.5 rounded-xl shadow-md">
                <ReceiptPoundSterling className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700">Receipts</span>
            </div>
            
            <div className="space-y-2">
              {jobReceipts.map(receipt => (
                <div key={receipt.id} className="p-3 border border-slate-100 rounded-xl bg-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={receipt.photoBase64} alt="Receipt Thumbnail" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{receipt.description}</div>
                      <div className="text-xs font-medium text-rose-600 font-mono">£{receipt.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <div>
                    {receipt.isPaid ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">Paid</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">Outstanding</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Materials Modal */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 h-[70vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Add Material to Job</h3>
              <button onClick={() => setShowMaterialsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {materials.map(mat => {
                const usedQty = job.materialsUsed?.find(m => m.materialId === mat.id)?.quantity || 0;
                return (
                  <div key={mat.id} className="glass-panel bg-slate-50 border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{mat.name}</h4>
                      <p className="text-xs text-slate-500">In stock: {mat.qty} | £{(mat.price || 0).toFixed(2)}</p>
                      {usedQty > 0 && <p className="text-xs text-primary-600 font-bold mt-1">Added: {usedQty}</p>}
                    </div>
                    <button 
                      onClick={() => assignMaterialToJob(job.id, mat.id, 1)}
                      className="text-white bg-primary-600 p-2 rounded-xl hover:bg-primary-700 tap-effect"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
              {materials.length === 0 && (
                <div className="text-center text-slate-400 mt-10">No materials available. Go to the Materials tab to add some.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit Time Modal */}
      {showEditTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Edit Logged Time</h3>
              <button onClick={() => setShowEditTime(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hours</label>
                <input 
                  type="number" 
                  min="0"
                  value={editHours}
                  onChange={e => setEditHours(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500 text-center text-2xl font-bold text-slate-700 bg-slate-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Minutes</label>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={editMinutes}
                  onChange={e => setEditMinutes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500 text-center text-2xl font-bold text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveEditTime}
              className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 tap-effect"
            >
              Save Changes
            </button>
            <p className="text-xs text-center text-slate-400 mt-4">
              Note: Editing the time will overwrite all start/stop tracking points for this job.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
