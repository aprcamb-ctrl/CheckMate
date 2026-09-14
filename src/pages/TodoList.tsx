import { Calendar, Clock, PlayCircle, MoreVertical, Plus, X, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { RecurringSchedule } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import VoiceInput from '../components/ui/VoiceInput';

export default function TodoList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobs, addJob, startJob, isDeletingJobs, toggleDeletingJobs, deleteJobs, equipment, events } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [reminder, setReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [recurring, setRecurring] = useState<RecurringSchedule>('NONE');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Completed' | 'ToDo'>('All');
  const [equipmentId, setEquipmentId] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');

  useEffect(() => {
    const state = location.state as any;
    if (state?.prefillEquipmentId) {
      setEquipmentId(state.prefillEquipmentId);
      setIsAdding(true);
      window.history.replaceState({}, document.title);
    }
    if (state?.prefillEventId) {
      setEventId(state.prefillEventId);
      setIsAdding(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const filteredJobs = useMemo(() => {
    // Only show unassigned jobs in the main Todo list
    let unassignedJobs = jobs.filter(j => !j.equipmentId && !j.eventId);

    if (filter === 'Completed') {
      unassignedJobs = unassignedJobs.filter(j => j.status === 'COMPLETED');
    } else if (filter === 'ToDo') {
      unassignedJobs = unassignedJobs.filter(j => j.status !== 'COMPLETED');
    }

    // Sort by status (pending first, then completed)
    unassignedJobs = [...unassignedJobs].sort((a, b) => {
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
      if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!search.trim()) return unassignedJobs;
    
    // Siri-style natural language parsing
    const stopWords = ['when', 'did', 'i', 'last', 'change', 'fix', 'repair', 'do', 'the', 'a', 'an', 'show', 'me', 'find', 'what', 'where', 'is'];
    const words = search.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
    
    if (words.length === 0) {
      return unassignedJobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    return unassignedJobs.filter(j => {
      const title = j.title.toLowerCase();
      return words.some(w => {
        if (title.includes(w)) return true;
        if (w === 'completed' && j.status === 'COMPLETED') return true;
        if ((w === 'pending' || w === 'paused' || w === 'todo') && j.status !== 'COMPLETED') return true;
        return false;
      });
    });
  }, [jobs, search, filter]);
  
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
      addJob(newTitle.trim(), reminder, reminder ? reminderDate : undefined, recurring, equipmentId || undefined, eventId || undefined);
      setNewTitle('');
      setReminder(false);
      setReminderDate('');
      setRecurring('NONE');
      setEquipmentId('');
      setEventId('');
      setIsAdding(false);
    }
  };

  return (
    <div className="relative pb-32 animate-fade-in-up">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 p-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Job List</h2>
        </div>

        <div className="filter-btn-container mb-3">
          {(['All', 'Completed', 'ToDo'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={`filter-btn ${filter === tab ? 'filter-btn-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <VoiceInput 
            value={search}
            onValueChange={setSearch}
            placeholder="Search by title, ID or status..." 
            className="bg-transparent border-none outline-none py-1 text-slate-700 placeholder-slate-400 flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full mr-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="glass-panel p-4 flex flex-col gap-3 mb-4 border-primary-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary-700">New Job</h3>
            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <VoiceInput 
            autoFocus
            value={newTitle}
            onValueChange={setNewTitle}
            placeholder="e.g. Fix lobby lights" 
            className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white"
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
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-sm font-medium text-slate-700">Recurring Schedule</label>
            <select 
              value={recurring}
              onChange={e => setRecurring(e.target.value as RecurringSchedule)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white text-sm"
            >
              <option value="NONE">None (One-off Job)</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUALLY">Annually</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-sm font-medium text-slate-700">Assign to Asset (Optional)</label>
            <select 
              value={equipmentId}
              onChange={e => setEquipmentId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white text-sm"
            >
              <option value="">None</option>
              {equipment.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-sm font-medium text-slate-700">Assign to Event (Optional)</label>
            <select 
              value={eventId}
              onChange={e => {
                setEventId(e.target.value);
                if (e.target.value) setEquipmentId(''); // mutually exclusive
              }}
              className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 text-slate-800 bg-white text-sm"
            >
              <option value="">None</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700"
          >
            Create Job
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filteredJobs.map((job) => (
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
              <h3 className={`font-semibold text-lg leading-tight pr-4 ${job.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{job.title}</h3>
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
        {filteredJobs.length === 0 && !isAdding && (
          <div className="text-center text-slate-400 py-10">{search ? "No matches found." : "No jobs yet. Tap + to add one."}</div>
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
          className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-105 transition-all tap-effect z-20"
        >
          <Plus strokeWidth={2.5} className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
