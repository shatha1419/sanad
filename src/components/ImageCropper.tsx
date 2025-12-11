import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Passport photo aspect ratio (3:4)
    setCrop(centerAspectCrop(width, height, 3 / 4));
  }, []);

  const rotateLeft = () => {
    setRotation((r) => r - 90);
  };

  const rotateRight = () => {
    setRotation((r) => r + 90);
  };

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Handle rotation
    const centerX = canvas.width / 2 / pixelRatio;
    const centerY = canvas.height / 2 / pixelRatio;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );

    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    onCropComplete(base64);
  }, [completedCrop, rotation, scale, onCropComplete]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-white font-medium">تعديل الصورة</h2>
        <Button variant="ghost" size="icon" onClick={getCroppedImg} className="text-primary hover:bg-primary/10">
          <Check className="w-5 h-5" />
        </Button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={3 / 4}
          className="max-h-[60vh]"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="صورة للتعديل"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              maxHeight: '60vh',
              transition: 'transform 0.2s ease',
            }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 bg-black/50" dir="rtl">
        {/* Zoom Control */}
        <div className="flex items-center gap-4">
          <ZoomOut className="w-5 h-5 text-white/70" />
          <Slider
            value={[scale]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={([v]) => setScale(v)}
            className="flex-1"
          />
          <ZoomIn className="w-5 h-5 text-white/70" />
        </div>

        {/* Rotation Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="outline"
            size="lg"
            onClick={rotateLeft}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="w-5 h-5 ml-2" />
            تدوير لليسار
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={rotateRight}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCw className="w-5 h-5 ml-2" />
            تدوير لليمين
          </Button>
        </div>

        {/* Apply Button */}
        <Button
          onClick={getCroppedImg}
          className="w-full bg-primary text-primary-foreground"
          size="lg"
        >
          <Check className="w-5 h-5 ml-2" />
          تطبيق التعديلات
        </Button>
      </div>
    </div>
  );
}
