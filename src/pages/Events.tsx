import { CalendarDays, Plus, Search, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import VoiceInput from '../components/ui/VoiceInput';
import { useNavigate } from 'react-router-dom';

export default function Events() {
  const { events, addEvent, deleteEvent, jobs } = useStore();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const handleSave = () => {
    if (newName.trim()) {
      addEvent(newName.trim(), newDate || undefined);
      setIsFormOpen(false);
      setNewName('');
      setNewDate('');
    }
  };

  const eventJobs = useMemo(() => {
    if (!selectedEvent) return [];
    return jobs.filter(j => j.eventId === selectedEvent.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedEvent, jobs]);

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Events</h2>
      </div>

      <div className="glass-panel p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <VoiceInput 
          value={search}
          onValueChange={setSearch}
          placeholder="Search events..." 
          className="bg-transparent border-none outline-none py-1 text-slate-700 placeholder-slate-400 flex-1"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full mr-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="glass-panel p-4 flex flex-col gap-3 border-indigo-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-indigo-700">Add New Event</h3>
            <button onClick={() => setIsFormOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <VoiceInput value={newName} onValueChange={setNewName} placeholder="Event Name (e.g. Torbay Open)" className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Event Date (Optional)</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white" />
          </div>
          <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 mt-2">
            Create Event
          </button>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 tap-effect">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedEvent.name}</h2>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">{selectedEvent.id}</span>
                  {selectedEvent.date && <span>📅 {new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                  Event Jobs
                  <button onClick={() => {
                    navigate('/todo', { state: { prefillEventId: selectedEvent.id } });
                  }} className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full normal-case text-xs font-bold hover:bg-indigo-100 transition-colors">Add Job</button>
                </label>
                <div className="space-y-2 mt-3">
                  {eventJobs.length > 0 ? eventJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{job.title}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString('en-GB')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <p className="text-sm text-slate-500 font-medium">No tasks assigned to this event yet.</p>
                      <button onClick={() => navigate('/todo', { state: { prefillEventId: selectedEvent.id } })} className="mt-2 text-indigo-600 text-sm font-bold">Create the first job</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 mt-auto bg-slate-50">
              <button 
                onClick={() => {
                  if(window.confirm('Delete this event? All associated jobs will be unlinked (but not deleted).')) {
                    deleteEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }
                }}
                className="w-full py-2.5 text-red-600 font-bold bg-white hover:bg-red-50 border border-red-200 rounded-xl transition-colors tap-effect"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(ev => (
          <div 
            key={ev.id} 
            onClick={() => setSelectedEvent(ev)}
            className="glass-panel p-4 flex items-center justify-between hover-lift cursor-pointer border-l-4 border-l-indigo-400"
          >
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-500 p-3 rounded-2xl shadow-inner">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{ev.name}</h3>
                <div className="flex gap-2 text-xs font-medium mt-1">
                  {ev.date ? (
                    <span className="text-slate-500">{new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  ) : (
                    <span className="text-slate-400 italic">No date set</span>
                  )}
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-indigo-600 font-semibold">{jobs.filter(j => j.eventId === ev.id).length} jobs</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isFormOpen && (
          <div className="text-center text-slate-400 py-10 col-span-full font-medium">No events found.</div>
        )}
      </div>

      <button 
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-105 transition-all tap-effect z-20"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}
