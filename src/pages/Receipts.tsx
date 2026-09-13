import { Camera, Search, X, CheckCircle, Circle, Trash2, Image as ImageIcon, Plus, Edit3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useMemo, useRef } from 'react';
import VoiceInput from '../components/ui/VoiceInput';

export default function Receipts() {
  const { receipts, addReceipt, updateReceipt, toggleReceiptPaid, deleteReceipt, jobs } = useStore();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [jobId, setJobId] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return receipts.filter(r => r.description.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receipts, search]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (description.trim() && photoPreview && amount) {
      if (editingReceiptId) {
        updateReceipt(editingReceiptId, description.trim(), parseFloat(amount), jobId || undefined);
        // Optional: Update the photo if changed, but right now updateReceipt doesn't take photoBase64. 
        // We'll just leave the photo as-is for edits.
      } else {
        addReceipt(photoPreview, description.trim(), parseFloat(amount), jobId || undefined);
      }
      setIsFormOpen(false);
      setDescription('');
      setAmount('');
      setJobId('');
      setPhotoPreview(null);
      setEditingReceiptId(null);
    } else {
      alert('Please provide a photo, description, and amount.');
    }
  };

  const openNewForm = () => {
    setEditingReceiptId(null);
    setDescription('');
    setAmount('');
    setJobId('');
    setPhotoPreview(null);
    setIsFormOpen(true);
  };

  const openEditForm = (r: any) => {
    setEditingReceiptId(r.id);
    setDescription(r.description);
    setAmount(r.amount.toString());
    setJobId(r.jobId || '');
    setPhotoPreview(r.photoBase64);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Receipts</h2>
      </div>

      <div className="glass-panel p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <VoiceInput 
          value={search}
          onValueChange={setSearch}
          placeholder="Search receipts..." 
          className="bg-transparent border-none outline-none py-1 text-slate-700 placeholder-slate-400 flex-1"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full mr-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="glass-panel p-4 flex flex-col gap-3 border-rose-400 border-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-rose-700">{editingReceiptId ? 'Edit Receipt' : 'Add New Receipt'}</h3>
            <button onClick={() => setIsFormOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          
          <div className="flex justify-center">
            {!photoPreview ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <Camera className="w-8 h-8 mb-2" />
                <span className="font-medium text-sm">Tap to scan receipt</span>
              </button>
            ) : (
              <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                <img src={photoPreview} alt="Receipt" className="w-full h-full object-cover" />
                {!editingReceiptId && (
                  <button 
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handlePhotoCapture}
            />
          </div>

          <VoiceInput value={description} onValueChange={setDescription} placeholder="Description (e.g. Plumbing parts)" className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 bg-white" />
          
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="Amount (£)" 
            step="0.01"
            className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 bg-white" 
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Link to Job (Optional)</label>
            <select 
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 bg-white text-sm"
            >
              <option value="">None</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <button onClick={handleSave} className="w-full bg-rose-600 text-white font-bold py-2 rounded-lg hover:bg-rose-700 mt-2 tap-effect">
            Save Receipt
          </button>
        </div>
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setViewingPhoto(null)} 
            className="absolute top-4 right-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={viewingPhoto} alt="Receipt Full" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(receipt => (
          <div key={receipt.id} className={`glass-panel p-4 flex gap-4 ${receipt.isPaid ? 'opacity-80' : ''}`}>
            <button 
              onClick={() => toggleReceiptPaid(receipt.id)}
              className="flex-shrink-0 mt-1 focus:outline-none tap-effect"
            >
              {receipt.isPaid ? (
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              ) : (
                <Circle className="w-7 h-7 text-slate-300" />
              )}
            </button>
            
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold text-lg leading-tight ${receipt.isPaid ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {receipt.description}
                  </h3>
                  <div className="text-xl font-black text-rose-600 mt-1">
                    £{receipt.amount.toFixed(2)}
                  </div>
                </div>
                
                <button 
                  onClick={() => setViewingPhoto(receipt.photoBase64)}
                  className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-slate-200 tap-effect border border-slate-200"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-medium">
                <span className="text-slate-500">
                  {new Date(receipt.createdAt).toLocaleDateString('en-GB')}
                </span>
                
                {receipt.isPaid && receipt.paidAt && (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Paid {new Date(receipt.paidAt).toLocaleDateString('en-GB')}
                  </span>
                )}
                
                {receipt.jobId && (
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 max-w-[200px] truncate">
                    Job: {jobs.find(j => j.id === receipt.jobId)?.title || 'Unknown Job'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <button 
                onClick={() => openEditForm(receipt)}
                className="text-indigo-400 hover:text-indigo-600 p-2 tap-effect"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Delete this receipt?')) deleteReceipt(receipt.id);
                }}
                className="text-red-400 hover:text-red-600 p-2 tap-effect"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isFormOpen && (
          <div className="text-center text-slate-400 py-10 font-medium">No receipts found. Tap + to scan one.</div>
        )}
      </div>

      <button 
        onClick={openNewForm}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full shadow-lg shadow-rose-500/40 flex items-center justify-center hover:scale-105 transition-all tap-effect z-20"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}
