import { Plus, Search, Layers, X, CheckCircle, Circle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import VoiceInput from '../components/ui/VoiceInput';

export default function Materials() {
  const { materials, addMaterial, updateMaterial, isDeletingMaterials, toggleDeletingMaterials, deleteMaterials, toggleMaterialPurchased } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Purchased' | 'Pending'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Add/Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const filteredMaterials = useMemo(() => {
    let filtered = materials;
    if (filter === 'Purchased') {
      filtered = filtered.filter(m => m.isPurchased);
    } else if (filter === 'Pending') {
      filtered = filtered.filter(m => !m.isPurchased);
    }
    
    if (!search.trim()) return filtered;
    
    return filtered.filter(m => {
      const s = search.toLowerCase().trim();
      if (m.name.toLowerCase().includes(s)) return true;
      if (s === 'purchased' && m.isPurchased) return true;
      if (s === 'pending' && !m.isPurchased) return true;
      return false;
    });
  }, [materials, search, filter]);

  const handleOpenForm = (mat?: any) => {
    if (mat) {
      setEditingId(mat.id);
      setNewName(mat.name);
      setNewQty(mat.qty.toString());
      setNewPrice((mat.price || 0).toString());
    } else {
      setEditingId(null);
      setNewName('');
      setNewQty('');
      setNewPrice('');
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (newName.trim() && newQty && newPrice) {
      if (editingId) {
        updateMaterial(editingId, newName.trim(), newQty, parseFloat(newPrice) || 0);
      } else {
        addMaterial(newName.trim(), newQty, parseFloat(newPrice) || 0);
      }
      setIsFormOpen(false);
    }
  };

  const handleMaterialClick = (mat: any) => {
    if (isDeletingMaterials) {
      setSelectedIds(prev => prev.includes(mat.id) ? prev.filter(x => x !== mat.id) : [...prev, mat.id]);
    } else {
      handleOpenForm(mat);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedIds.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} material(s)?`)) {
        deleteMaterials(selectedIds);
        setSelectedIds([]);
      }
    }
  };

  const handleCancelDelete = () => {
    toggleDeletingMaterials(false);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Materials</h2>
      </div>

      <div className="glass-panel p-1.5 flex gap-1 bg-white/40">
        {(['All', 'Purchased', 'Pending'] as const).map((tab) => (
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
          placeholder="Search inventory..." 
          className="bg-transparent border-none outline-none py-1 text-slate-700 placeholder-slate-400"
        />
      </div>

      {isFormOpen && (
        <div className="glass-panel p-4 flex flex-col gap-3 border-primary-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary-700">{editingId ? 'Edit Material' : 'New Material'}</h3>
            <button onClick={() => setIsFormOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <VoiceInput value={newName} onValueChange={setNewName} placeholder="Material Name" className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500" />
          <div className="flex gap-2">
            <input type="text" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty (e.g. 5 or 10m)" className="w-1/2 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500" />
            <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price £" className="w-1/2 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500" />
          </div>
          <button onClick={handleSave} className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700">
            {editingId ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredMaterials.map(mat => (
          <div 
            key={mat.id} 
            onClick={() => handleMaterialClick(mat)}
            className={`glass-panel p-4 flex items-center justify-between hover-lift cursor-pointer ${isDeletingMaterials && selectedIds.includes(mat.id) ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
          >
            <div className="flex items-center gap-3">
              {!isDeletingMaterials && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMaterialPurchased(mat.id);
                  }}
                  className="flex-shrink-0 focus:outline-none tap-effect"
                >
                  {mat.isPurchased ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </button>
              )}
              <div className="bg-gradient-to-tr from-slate-200 to-slate-100 p-2.5 rounded-xl text-slate-500 shadow-inner hidden sm:block">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-semibold text-slate-800 ${mat.isPurchased ? 'line-through text-slate-500' : ''}`}>{mat.name}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium mt-0.5">
                  <span>Stock: <span className="text-slate-700">{mat.qty}</span></span>
                  <span>Price: <span className="text-emerald-600">£{(mat.price || 0).toFixed(2)}</span></span>
                  {mat.isPurchased && (
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[10px] uppercase tracking-wider font-bold">
                      Purchased
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {isDeletingMaterials && (
              <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${selectedIds.includes(mat.id) ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                {selectedIds.includes(mat.id) && <X className="w-4 h-4 text-white" />}
              </div>
            )}
          </div>
        ))}
        {filteredMaterials.length === 0 && !isFormOpen && (
          <div className="text-center text-slate-400 py-10">No materials found.</div>
        )}
      </div>

      {/* Bulk Delete Actions or FAB */}
      {isDeletingMaterials ? (
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
          onClick={() => handleOpenForm()}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-lg shadow-primary-500/40 flex items-center justify-center hover:scale-105 transition-all tap-effect z-20"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
