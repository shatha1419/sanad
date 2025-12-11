import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

// Check if SpeechRecognition is available
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  
  // Try different vendor prefixes
  const SpeechRecognitionAPI = 
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;
  
  return SpeechRecognitionAPI || null;
};

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check support on mount
    const supported = getSpeechRecognition() !== null;
    setIsSupported(supported);
  }, []);

  // Try Web Speech API first (works on most browsers)
  const startLiveRecognition = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SpeechRecognitionAPI = getSpeechRecognition();
      
      if (!SpeechRecognitionAPI) {
        // Fallback to MediaRecorder approach
        console.log('Web Speech API not available, using MediaRecorder fallback');
        startMediaRecording(resolve);
        return;
      }

      // Stop any existing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('Error aborting previous recognition:', e);
        }
      }

      setIsRecording(true);
      
      try {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          setIsProcessing(false);
          onTranscript?.(transcript);
          resolve(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsProcessing(false);
          
          if (event.error === 'not-allowed') {
            toast.error('يرجى السماح بالوصول للميكروفون');
          } else if (event.error === 'no-speech') {
            toast.error('لم يتم اكتشاف صوت. حاول مرة أخرى.');
          } else if (event.error === 'audio-capture') {
            toast.error('لم يتم العثور على ميكروفون');
          } else if (event.error === 'network') {
            toast.error('خطأ في الاتصال بالإنترنت');
          } else {
            // Try fallback
            console.log('Trying MediaRecorder fallback due to error:', event.error);
            startMediaRecording(resolve);
            return;
          }
          resolve(null);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsProcessing(false);
        };

        recognition.start();
        toast.info('جاري الاستماع... تحدث الآن', { duration: 2000 });
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        // Try fallback
        startMediaRecording(resolve);
      }
    });
  }, [onTranscript]);

  // MediaRecorder fallback for browsers without Web Speech API
  const startMediaRecording = async (resolve: (value: string | null) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      setIsRecording(true);
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        
        // For now, just inform user that voice was recorded
        // In production, you'd send this to a speech-to-text API
        toast.info('تم تسجيل الصوت. استخدم الكتابة حالياً.');
        resolve(null);
      };
      
      mediaRecorder.start();
      toast.info('جاري التسجيل... اضغط مرة أخرى للإيقاف', { duration: 3000 });
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error starting media recording:', error);
      setIsRecording(false);
      toast.error('فشل في الوصول للميكروفون. تأكد من إعطاء الإذن.');
      onError?.('فشل في الوصول للميكروفون');
      resolve(null);
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    isSupported,
    startLiveRecognition,
    stopRecording,
  };
}
