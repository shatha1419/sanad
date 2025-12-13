import { useRef, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, ImageIcon, X, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CameraGuide } from './CameraGuide';

interface ImageUploaderProps {
  onImageSelect: (imageBase64: string) => void;
  onMultipleImagesSelect?: (images: string[]) => void;
  allowMultiple?: boolean;
}

export function ImageUploader({ onImageSelect, onMultipleImagesSelect, allowMultiple = false }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة صالح',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  }, [toast, onImageSelect]);

  const handleMultipleFiles = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملفات صور صالحة',
        variant: 'destructive',
      });
      return;
    }

    if (imageFiles.length > 10) {
      toast({
        title: 'تنبيه',
        description: 'الحد الأقصى 10 صور، سيتم تحليل أول 10 صور فقط',
        variant: 'default',
      });
    }

    const filesToProcess = imageFiles.slice(0, 10);
    const promises = filesToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(results => {
      if (onMultipleImagesSelect) {
        onMultipleImagesSelect(results);
      } else if (results.length > 0) {
        onImageSelect(results[0]);
      }
    });
  }, [toast, onImageSelect, onMultipleImagesSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    
    if (allowMultiple && files.length > 1) {
      handleMultipleFiles(files);
    } else if (files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, handleMultipleFiles, allowMultiple]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const openCamera = () => {
    setShowCamera(true);
  };

  const handleCameraCapture = (imageBase64: string) => {
    setShowCamera(false);
    onImageSelect(imageBase64);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (allowMultiple && files.length > 1) {
      handleMultipleFiles(files);
    } else if (files[0]) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <>
      {/* Camera with Guide */}
      {showCamera && (
        <CameraGuide 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <Card
        className={`border-2 border-dashed transition-all ${
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">رفع الصورة</h3>
              <p className="text-sm text-muted-foreground">
                {allowMultiple 
                  ? 'اسحب وأفلت الصور هنا أو اختر طريقة الرفع (حتى 10 صور)'
                  : 'اسحب وأفلت الصورة هنا أو اختر طريقة الرفع'
                }
              </p>
            </div>

            {/* Absher Requirements Summary */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground w-full max-w-sm">
              <p className="font-medium text-foreground mb-1">متطلبات صور أبشر:</p>
              <ul className="space-y-0.5 text-right">
                <li>• أبعاد 4×6 (480×640 بكسل)</li>
                <li>• الوجه يشغل 70-80% من الارتفاع</li>
                <li>• الأكتاف مرئية، الوجه في المنتصف</li>
                <li>• خلفية بيضاء، إضاءة متساوية</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                اختيار ملف
              </Button>
              {allowMultiple && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Images className="w-4 h-4" />
                  اختيار عدة صور
                </Button>
              )}
              <Button
                variant="outline"
                onClick={openCamera}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                فتح الكاميرا
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={allowMultiple}
            className="hidden"
            onChange={handleFileInputChange}
          />
        </CardContent>
      </Card>
    </>
  );
}
