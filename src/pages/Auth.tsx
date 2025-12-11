import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, IdCard } from 'lucide-react';
import { z } from 'zod';
import { DEMO_USERS } from '@/lib/constants';

const nationalIdSchema = z.object({
  nationalId: z.string()
    .length(10, 'رقم الهوية يجب أن يكون 10 أرقام')
    .regex(/^\d+$/, 'رقم الهوية يجب أن يحتوي على أرقام فقط'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signInWithNationalId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = nationalIdSchema.safeParse({ nationalId });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signInWithNationalId(nationalId);
    setLoading(false);

    if (error) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-sanad mb-4">
            <span className="text-primary-foreground font-bold text-4xl">س</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">سَنَد</h1>
          <p className="text-muted-foreground mt-2">مساعدك الذكي للخدمات الحكومية</p>
        </div>

        <Card className="shadow-sanad">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <IdCard className="w-6 h-6" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription>
              أدخل رقم الهوية الوطنية للدخول
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="national-id">رقم الهوية الوطنية</Label>
                <Input
                  id="national-id"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  placeholder="1100000001"
                  dir="ltr"
                  className="text-center text-lg tracking-widest"
                />
                {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId}</p>}
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'دخول'}
              </Button>
            </form>

            {/* Demo accounts info */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-3">
                للتجربة، استخدم أحد أرقام الهوية التالية:
              </p>
              <div className="space-y-2">
                {Object.entries(DEMO_USERS).map(([id, userData]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setNationalId(id)}
                    className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-right"
                  >
                    <p className="font-medium text-foreground">{userData.fullName}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{id}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
