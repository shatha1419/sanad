import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  X, 
  Camera, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Requirement {
  id: string;
  name: string;
  type: 'file' | 'image' | 'text' | 'select';
  required: boolean;
  description?: string;
  options?: string[];
}

interface ServiceExecutionFormProps {
  serviceName: string;
  requirements: Requirement[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ServiceExecutionForm({
  serviceName,
  requirements,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceExecutionFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (reqId: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [reqId]: file }));
    setErrors(prev => ({ ...prev, [reqId]: '' }));
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({ ...prev, [reqId]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[reqId];
        return newPreviews;
      });
    }
  };

  const handleInputChange = (reqId: string, value: string) => {
    setFormData(prev => ({ ...prev, [reqId]: value }));
    setErrors(prev => ({ ...prev, [reqId]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    requirements.forEach(req => {
      if (req.required) {
        if (req.type === 'file' || req.type === 'image') {
          if (!files[req.id]) {
            newErrors[req.id] = 'هذا الحقل مطلوب';
          }
        } else {
          if (!formData[req.id]) {
            newErrors[req.id] = 'هذا الحقل مطلوب';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      files: Object.entries(files).reduce((acc, [key, file]) => {
        if (file) {
          acc[key] = {
            name: file.name,
            type: file.type,
            size: file.size,
            // In real app, you'd upload to storage and include URL
          };
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    await onSubmit(submitData);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2 justify-end">
          <span>تنفيذ: {serviceName}</span>
          <FileText className="w-5 h-5 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {requirements.map((req) => (
            <div key={req.id} className="space-y-2">
              <Label className="flex items-center gap-2 justify-end text-right">
                {req.required && <span className="text-destructive">*</span>}
                {req.name}
              </Label>
              
              {req.description && (
                <p className="text-xs text-muted-foreground text-right">
                  {req.description}
                </p>
              )}

              {/* Image Upload */}
              {req.type === 'image' && (
                <div className="space-y-2">
                  {previews[req.id] ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={previews[req.id]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileChange(req.id, null)}
                        className="absolute top-2 left-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors",
                      errors[req.id] ? "border-destructive" : "border-border"
                    )}>
                      <div className="flex flex-col items-center justify-center py-6">
                        <Camera className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">اضغط لرفع صورة</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG حتى 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(req.id, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* File Upload */}
              {req.type === 'file' && (
                <div className="space-y-2">
                  {files[req.id] ? (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium truncate">{files[req.id]?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {((files[req.id]?.size || 0) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(req.id, null)}
                        className="p-1 hover:bg-destructive/10 rounded-full"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex items-center justify-center gap-3 w-full p-4 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors",
                      errors[req.id] ? "border-destructive" : "border-border"
                    )}>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">رفع ملف</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(req.id, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Text Input */}
              {req.type === 'text' && (
                <Input
                  value={(formData[req.id] as string) || ''}
                  onChange={(e) => handleInputChange(req.id, e.target.value)}
                  className={cn(
                    "text-right",
                    errors[req.id] && "border-destructive"
                  )}
                  placeholder={`أدخل ${req.name}`}
                />
              )}

              {/* Select */}
              {req.type === 'select' && req.options && (
                <select
                  value={(formData[req.id] as string) || ''}
                  onChange={(e) => handleInputChange(req.id, e.target.value)}
                  className={cn(
                    "w-full p-2 rounded-lg border bg-background text-right",
                    errors[req.id] && "border-destructive"
                  )}
                >
                  <option value="">اختر...</option>
                  {req.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {errors[req.id] && (
                <p className="text-xs text-destructive flex items-center gap-1 justify-end">
                  <span>{errors[req.id]}</span>
                  <AlertCircle className="w-3 h-3" />
                </p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  تنفيذ الخدمة
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
