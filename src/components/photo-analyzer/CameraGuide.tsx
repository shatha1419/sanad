import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraGuideProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
}

export function CameraGuide({ onCapture, onClose }: CameraGuideProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن الوصول للكاميرا',
        variant: 'destructive',
      });
      onClose();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas to 4:6 aspect ratio (480x640)
    canvas.width = 480;
    canvas.height = 640;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate crop to fit 4:6 ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 480 / 640; // 0.75
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (videoAspect > targetAspect) {
      // Video is wider, crop sides
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller, crop top/bottom
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Mirror image if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(imageBase64);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={switchCamera}
          className="text-white hover:bg-white/20"
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
      </div>

      {/* Camera View with Guide Overlay */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          className={`h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          autoPlay 
          playsInline 
          muted
        />
        
        {/* Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Semi-transparent overlay */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="guideMask">
                <rect width="100" height="100" fill="white" />
                {/* Main oval for face - positioned for 70-80% face coverage */}
                <ellipse cx="50" cy="35" rx="18" ry="22" fill="black" />
                {/* Shoulder area */}
                <rect x="20" y="65" width="60" height="35" rx="5" fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#guideMask)" />
          </svg>
          
          {/* Guide Frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: '70%', height: '85%' }}>
              {/* Face oval guide */}
              <div 
                className="absolute border-2 border-white/80 rounded-full"
                style={{
                  top: '5%',
                  left: '25%',
                  width: '50%',
                  height: '45%',
                }}
              />
              
              {/* Shoulder guide */}
              <div 
                className="absolute border-2 border-white/60 rounded-lg"
                style={{
                  bottom: '0%',
                  left: '10%',
                  width: '80%',
                  height: '30%',
                }}
              />

              {/* Corner marks */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-24 left-0 right-0 text-center">
          <div className="bg-black/60 backdrop-blur-sm mx-4 rounded-lg p-3">
            <p className="text-white text-sm font-medium mb-1">إرشادات التصوير</p>
            <p className="text-white/80 text-xs">
              ضع وجهك داخل الدائرة • تأكد من ظهور أكتافك • حافظ على رأسك مستقيماً
            </p>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <div className="p-6 flex justify-center bg-black">
        <Button 
          onClick={capturePhoto}
          disabled={!isReady}
          size="lg"
          className="w-16 h-16 rounded-full bg-white hover:bg-white/90 text-black"
        >
          <Camera className="w-8 h-8" />
        </Button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
