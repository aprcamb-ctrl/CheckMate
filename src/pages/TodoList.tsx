import { Calendar, Clock, PlayCircle, MoreVertical, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState } from 'react';

export default function TodoList() {
  const navigate = useNavigate();
  const { jobs, addJob, startJob, isDeletingJobs, toggleDeletingJobs, deleteJobs } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [reminder, setReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleJobClick = (id: string) => {
    if (isDeletingJobs) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      navigate(`/job/${id}`);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedIds.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} job(s)?`)) {
        deleteJobs(selectedIds);
        setSelectedIds([]);
      }
    }
  };

  const handleCancelDelete = () => {
    toggleDeletingJobs(false);
    setSelectedIds([]);
  };

  const handleAdd = () => {
    if (newTitle.trim()) {
      addJob(newTitle.trim(), reminder, reminder ? reminderDate : undefined);
      setNewTitle('');
      setReminder(false);
      setReminderDate('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4 relative pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Job List</h2>
        <button className="text-primary-600 font-medium text-sm">Filter</button>
      </div>

      {isAdding && (
        <div className="glass-panel p-4 flex flex-col gap-3 mb-4 border-primary-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary-700">New Job</h3>
            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <input 
            type="text" 
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Fix lobby lights" 
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white"
          />
          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" id="reminderCheck" checked={reminder} onChange={e => setReminder(e.target.checked)} className="w-4 h-4 text-primary-600 rounded border-slate-300" />
            <label htmlFor="reminderCheck" className="text-sm font-medium text-slate-700">Set Reminder</label>
          </div>
          {reminder && (
            <input 
              type="datetime-local" 
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white text-sm"
            />
          )}
          <button 
            onClick={handleAdd}
            className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700"
          >
            Create Job
          </button>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div 
            key={job.id} 
            className={`glass-panel p-4 flex flex-col gap-3 hover-lift cursor-pointer relative overflow-hidden ${isDeletingJobs && selectedIds.includes(job.id) ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
            onClick={() => handleJobClick(job.id)}
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              job.status === 'IN_PROGRESS' ? 'bg-amber-500' : 
              job.status === 'COMPLETED' ? 'bg-emerald-500' : 
              job.status === 'PAUSED' ? 'bg-slate-500' : 'bg-slate-300'
            }`}></div>
            
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 text-lg leading-tight pr-4">{job.title}</h3>
              {isDeletingJobs ? (
                <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${selectedIds.includes(job.id) ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                  {selectedIds.includes(job.id) && <X className="w-4 h-4 text-white" />}
                </div>
              ) : (
                <MoreVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{new Date(job.createdAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              {job.reminder && (
                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {job.reminderDate ? new Date(job.reminderDate).toLocaleString('en-GB', {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'}) : 'Reminder set'}
                  </span>
                </div>
              )}
            </div>
            
            {job.status === 'PENDING' && (
              <div className="mt-2 pt-3 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startJob(job.id);
                    navigate(`/job/${job.id}`);
                  }}
                  className="flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Job
                </button>
              </div>
            )}
          </div>
        ))}
        {jobs.length === 0 && !isAdding && (
          <div className="text-center text-slate-400 py-10">No jobs yet. Tap + to add one.</div>
        )}
      </div>

      {/* Bulk Delete Actions or FAB */}
      {isDeletingJobs ? (
        <div className="fixed bottom-20 left-4 right-4 z-20 flex gap-2">
          <button 
            onClick={handleCancelDelete}
            className="flex-1 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 tap-effect"
          >
            Cancel
          </button>
          <button 
            onClick={handleDeleteConfirm}
            disabled={selectedIds.length === 0}
            className={`flex-1 font-bold py-3 rounded-xl tap-effect ${selectedIds.length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-300 text-white cursor-not-allowed'}`}
          >
            Delete ({selectedIds.length})
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-700 hover:scale-105 transition-all tap-effect z-20"
        >
          <Plus strokeWidth={2.5} className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
