import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { QrCode, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Scanner() {
  const navigate = useNavigate();
  const { equipment } = useStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1.0 },
      /* verbose= */ false
    );
    
    scanner.render((decodedText) => {
      // Success callback
      scanner.clear();
      // Look up equipment
      const eq = equipment.find(e => e.id === decodedText);
      if (eq) {
        // We could route to a detail view or just alert for now, 
        // since Equipment.tsx handles its own modal. 
        // A better architecture would be /equipment/:id route.
        // For simplicity, we'll navigate to equipment page with a search param, 
        // but wait, we can just change state. 
        // Let's navigate to /equipment and let the user search, or we pass state.
        navigate('/equipment', { state: { scannedId: decodedText } });
      } else {
        setError(`No equipment found matching ID: ${decodedText}`);
        setTimeout(() => scanner.render(()=>{}, ()=>{}), 2000); // restart scanner
      }
    }, () => {
      // Ignore routine scan errors
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [equipment, navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 pt-safe absolute top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
        <h2 className="text-white font-bold text-lg flex items-center gap-2 shadow-sm"><QrCode className="w-5 h-5"/> Scan Asset QR</h2>
        <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full backdrop-blur text-white tap-effect">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div id="reader" className="w-full max-w-sm overflow-hidden rounded-3xl border-4 border-white/20"></div>
        {error && (
          <div className="absolute bottom-20 mx-4 p-4 bg-red-500 text-white rounded-xl font-bold shadow-xl animate-in slide-in-from-bottom-4">
            {error}
          </div>
        )}
      </div>
      <style>{`
        #reader button {
          background-color: #8b5cf6 !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-weight: bold !important;
          margin: 10px !important;
        }
        #reader__dashboard_section_csr span {
          color: white !important;
        }
      `}</style>
    </div>
  );
}
