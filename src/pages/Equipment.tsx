import { Plus, Search, QrCode, X, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import VoiceInput from '../components/ui/VoiceInput';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Equipment() {
  const { equipment, addEquipment, updateEquipmentStatus, deleteEquipment, jobs } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Operational' | 'Repair'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  const [selectedEq, setSelectedEq] = useState<any>(null);
  const navigate = useNavigate();
  const locationState = useLocation().state as any;

  useEffect(() => {
    if (locationState?.scannedId) {
      const eq = equipment.find(e => e.id === locationState.scannedId);
      if (eq) setSelectedEq(eq);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [locationState, equipment]);

  const filtered = useMemo(() => {
    let list = equipment;
    if (filter === 'Operational') list = list.filter(e => e.status === 'Operational');
    else if (filter === 'Repair') list = list.filter(e => e.status !== 'Operational');
    
    if (!search.trim()) return list;

    return list.filter(e => {
      const s = search.toLowerCase().trim();
      if (e.name.toLowerCase().includes(s) || e.id.toLowerCase().includes(s)) return true;
      if (s === 'operational' && e.status === 'Operational') return true;
      if ((s === 'repair' || s === 'broken' || s === 'needs repair') && e.status !== 'Operational') return true;
      return false;
    });
  }, [equipment, search, filter]);

  const handleSave = () => {
    if (newName.trim() && newLocation.trim()) {
      addEquipment(newName.trim(), newLocation.trim());
      setIsFormOpen(false);
      setNewName('');
      setNewLocation('');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Operational': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Needs Repair': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Out of Service': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const recentJobs = useMemo(() => {
    if (!selectedEq) return [];
    return jobs.filter(j => j.equipmentId === selectedEq.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedEq, jobs]);

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Equipment</h2>
      </div>

      <div className="glass-panel p-1.5 flex gap-1 bg-white/40">
        {(['All', 'Operational', 'Repair'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all ${filter === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <VoiceInput 
          value={search}
          onValueChange={setSearch}
          placeholder="Search by name or ID..." 
          className="bg-transparent border-none outline-none py-1 text-slate-700 placeholder-slate-400"
        />
      </div>

      {isFormOpen && (
        <div className="glass-panel p-4 flex flex-col gap-3 border-primary-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary-700">Add Equipment</h3>
            <button onClick={() => setIsFormOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <VoiceInput value={newName} onValueChange={setNewName} placeholder="Equipment Name" className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500" />
          <VoiceInput value={newLocation} onValueChange={setNewLocation} placeholder="Location (e.g. Roof North)" className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500" />
          <button onClick={handleSave} className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700">
            Register Asset
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Asset Profile</h3>
              <button onClick={() => setSelectedEq(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 tap-effect">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedEq.name}</h2>
                  <p className="text-slate-500 flex items-center gap-1.5 mt-1 text-sm font-medium">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{selectedEq.id}</span>
                    &bull; {selectedEq.location}
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                  <QRCodeSVG value={selectedEq.id} size={64} />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                <select 
                  value={selectedEq.status}
                  onChange={(e) => {
                    updateEquipmentStatus(selectedEq.id, e.target.value as any);
                    setSelectedEq({ ...selectedEq, status: e.target.value });
                  }}
                  className={`w-full p-3 rounded-xl border appearance-none font-bold outline-none ${getStatusColor(selectedEq.status)}`}
                >
                  <option value="Operational">Operational</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                  Recent Jobs
                  <button onClick={() => {
                    navigate('/todo', { state: { prefillEquipmentId: selectedEq.id } });
                  }} className="text-primary-600 normal-case text-xs">Add New</button>
                </label>
                <div className="space-y-2">
                  {recentJobs.length > 0 ? recentJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{job.title}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 py-2">No maintenance history for this asset.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => {
                  if(window.confirm('Delete this asset?')) {
                    deleteEquipment(selectedEq.id);
                    setSelectedEq(null);
                  }
                }}
                className="w-full py-2.5 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors tap-effect"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(eq => (
          <div 
            key={eq.id} 
            onClick={() => setSelectedEq(eq)}
            className="glass-panel p-4 flex items-center justify-between hover-lift cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-tr from-slate-200 to-slate-100 p-3 rounded-2xl text-slate-600 shadow-inner">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-lg leading-tight">{eq.name}</h3>
                <div className="flex gap-2 text-xs font-medium mt-1">
                  <span className="text-slate-500">{eq.location}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className={eq.status === 'Operational' ? 'text-emerald-500' : eq.status === 'Needs Repair' ? 'text-amber-500' : 'text-red-500'}>
                    {eq.status}
                  </span>
                </div>
              </div>
            </div>
            <QrCode className="w-5 h-5 text-slate-300" />
          </div>
        ))}
        {filtered.length === 0 && !isFormOpen && (
          <div className="text-center text-slate-400 py-10 col-span-full">No equipment found.</div>
        )}
      </div>

      <button 
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-lg shadow-primary-500/40 flex items-center justify-center hover:scale-105 transition-all tap-effect z-20"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}
