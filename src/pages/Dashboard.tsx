import { Plus, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const jobs = useStore(state => state.jobs);
  const navigate = useNavigate();
  
  const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <h2 className="text-3xl font-bold mb-2 tracking-tight">Overview</h2>
        <p className="text-slate-500 font-medium text-lg">You have <span className="text-primary-600 font-bold">{pendingJobs.length} jobs</span> pending today.</p>
      </div>

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
      </div>
    </div>
  );
}
