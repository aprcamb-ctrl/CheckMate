import { Mic } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (val: string) => void;
}

export default function VoiceInput({ onValueChange, className = '', value, ...props }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      // Using en-US or en-GB. Since user wanted UK date format, we'll use en-GB.
      recognitionRef.current.lang = 'en-GB'; 

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentVal = value ? value + ' ' : '';
        onValueChange(currentVal + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onValueChange, value]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input 
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full pr-14 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={toggleListening}
        className={`absolute right-2 p-2 rounded-xl transition-all tap-effect ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
            : 'text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        title="Click to speak"
      >
        <Mic className="w-5 h-5" />
      </button>
    </div>
  );
}
