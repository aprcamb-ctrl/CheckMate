import { Clock, Calendar, Download, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useMemo, useState } from 'react';

export default function Timesheets() {
  const { jobs, materials } = useStore();
  const [filter, setFilter] = useState<'All Time' | 'Weekly' | 'Monthly'>('All Time');

  const completedJobs = useMemo(() => {
    let filtered = jobs.filter(j => j.status === 'COMPLETED');
    
    // Safely deduplicate by ID in case strict-mode caused double-injection in localStorage
    filtered = Array.from(new Map(filtered.map(j => [j.id, j])).values());

    const now = Date.now();
    if (filter === 'Weekly') {
      filtered = filtered.filter(j => j.completedAt && (now - new Date(j.completedAt).getTime() <= 7 * 24 * 60 * 60 * 1000));
    } else if (filter === 'Monthly') {
      filtered = filtered.filter(j => j.completedAt && (now - new Date(j.completedAt).getTime() <= 30 * 24 * 60 * 60 * 1000));
    }
    
    // Sort by most recently completed
    return filtered.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
  }, [jobs, filter]);

  const calculateElapsedSeconds = (timeLogs: any[]) => {
    return timeLogs.reduce((total, log) => {
      if (!log.endedAt) return total;
      return total + (new Date(log.endedAt).getTime() - new Date(log.startedAt).getTime()) / 1000;
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const totalSeconds = completedJobs.reduce((sum, job) => sum + calculateElapsedSeconds(job.timeLogs), 0);

  const exportTimesheets = () => {
    let csv = '\uFEFF' + "Job Title,Status,Created At,Completed At,Total Hours\n";
    completedJobs.forEach(job => {
      const hours = (calculateElapsedSeconds(job.timeLogs) / 3600).toFixed(2);
      csv += `"${job.title}","${job.status}","${new Date(job.createdAt).toLocaleString('en-GB')}","${job.completedAt ? new Date(job.completedAt).toLocaleString('en-GB') : ''}","${hours}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "timesheets_export.csv";
    link.click();
  };

  const exportWorksheet = (job: any) => {
    let csv = '\uFEFF' + `Worksheet: ${job.title}\n`;
    csv += `Status: ${job.status}\n`;
    csv += `Completed: ${job.completedAt ? new Date(job.completedAt).toLocaleString('en-GB') : ''}\n\n`;
    
    csv += `Time Logs\n`;
    csv += `Start Time,End Time,Duration (Hours)\n`;
    job.timeLogs.forEach((log: any) => {
      if (log.endedAt) {
        const duration = ((new Date(log.endedAt).getTime() - new Date(log.startedAt).getTime()) / 3600000).toFixed(2);
        csv += `"${new Date(log.startedAt).toLocaleString('en-GB')}","${new Date(log.endedAt).toLocaleString('en-GB')}","${duration}"\n`;
      }
    });
    csv += `Total Time,,"${(calculateElapsedSeconds(job.timeLogs) / 3600).toFixed(2)}"\n\n`;

    csv += `Materials Used\n`;
    csv += `Item,Quantity,Unit Price,Total Cost\n`;
    let totalCost = 0;
    job.materialsUsed?.forEach((m: any) => {
      const mat = materials.find(x => x.id === m.materialId);
      if (mat) {
        const cost = m.quantity * (mat.price || 0);
        totalCost += cost;
        csv += `"${mat.name}","${m.quantity}","£${(mat.price || 0).toFixed(2)}","£${cost.toFixed(2)}"\n`;
      }
    });
    csv += `Total Materials Cost,,,"£${totalCost.toFixed(2)}"\n\n`;

    csv += `Photos\n`;
    csv += `Before Photos,${job.beforePhotos?.length || 0}\n`;
    csv += `After Photos,${job.afterPhotos?.length || 0}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `worksheet_${job.title.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Timesheets</h2>
        <button 
          onClick={exportTimesheets}
          className="text-primary-600 bg-primary-50 p-2.5 rounded-full hover:bg-primary-100 transition-colors tap-effect shadow-sm"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Date Toggle */}
      <div className="glass-panel p-1.5 flex gap-1 bg-white/40">
        {(['All Time', 'Weekly', 'Monthly'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all ${filter === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg shadow-emerald-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Clock className="w-24 h-24" />
        </div>
        <p className="text-emerald-50 font-medium mb-1">Total Hours Tracked</p>
        <h3 className="text-5xl font-light tracking-tight">{formatTime(totalSeconds)}</h3>
        <p className="text-sm text-emerald-100 mt-4">{completedJobs.length} Jobs Completed</p>
      </div>

      {/* Log List */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 px-1 mt-6">Completed Jobs</h4>
        
        {completedJobs.map(job => {
          const seconds = calculateElapsedSeconds(job.timeLogs);
          return (
            <div key={job.id} className="glass-panel p-4 flex flex-col gap-3 hover-lift">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 shadow-sm border border-primary-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-slate-500">{job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB') : 'Unknown'}</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{formatTime(seconds)}</span>
              </div>
              
              <div className="flex justify-end border-t border-slate-100 pt-3 mt-1">
                <button 
                  onClick={() => exportWorksheet(job)}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 tap-effect"
                >
                  <FileText className="w-4 h-4" />
                  Export Worksheet
                </button>
              </div>
            </div>
          );
        })}
        {completedJobs.length === 0 && (
          <div className="text-center text-slate-400 py-10">No completed jobs yet.</div>
        )}
      </div>
    </div>
  );
}
