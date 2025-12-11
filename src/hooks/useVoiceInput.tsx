import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Type declarations for Web Speech API
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Live speech recognition (real-time)
  const startLiveRecognition = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        toast.error('المتصفح لا يدعم التعرف على الصوت');
        resolve(null);
        return;
      }

      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setIsRecording(true);
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        setIsProcessing(false);
        onTranscript?.(transcript);
        resolve(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event);
        setIsRecording(false);
        setIsProcessing(false);
        
        if (event.error === 'not-allowed') {
          toast.error('يرجى السماح بالوصول للميكروفون');
        } else if (event.error === 'no-speech') {
          toast.error('لم يتم اكتشاف صوت. حاول مرة أخرى.');
        } else {
          toast.error('حدث خطأ في التعرف على الصوت');
        }
        resolve(null);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
      };

      try {
        recognition.start();
        toast.info('جاري الاستماع... تحدث الآن', { duration: 2000 });
      } catch (error) {
        setIsRecording(false);
        toast.error('فشل في بدء التسجيل');
        resolve(null);
      }
    });
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    startLiveRecognition,
    stopRecording,
  };
}
