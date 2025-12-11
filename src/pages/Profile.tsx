import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, Users, Briefcase, AlertTriangle, Plane, 
  Car, CreditCard, FileText, ChevronLeft, MapPin
} from 'lucide-react';

interface ProfileData {
  full_name: string | null;
  national_id: string | null;
  birth_date_gregorian: string | null;
  birth_date_hijri: string | null;
  nationality: string | null;
  city: string | null;
  occupation: string | null;
  marital_status: string | null;
  travel_status: string | null;
  last_travel_destination: string | null;
  last_travel_date: string | null;
  national_id_expiry: string | null;
}

interface StatsData {
  familyInside: number;
  familyOutside: number;
  workersInside: number;
  workersOutside: number;
  unpaidViolations: number;
  violationsAmount: number;
  lastViolationDate: string | null;
  visaRequests: number;
  visasIssued: number;
  visaBalance: number;
  licensesTotal: number;
  licensesExpired: number;
  licensesExpiring: number;
  vehiclesTotal: number;
  vehiclesExpired: number;
  vehiclesExpiring: number;
}

function StatCard({ 
  icon, 
  title, 
  stats, 
  onViewMore 
}: { 
  icon: React.ReactNode; 
  title: string; 
  stats: { label: string; value: string | number }[];
  onViewMore?: () => void;
}) {
  return (
    <Card className="hover:shadow-sanad transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
        {onViewMore && (
          <Button variant="ghost" size="sm" className="w-full mt-4 gap-2" onClick={onViewMore}>
            تفاصيل أكثر
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      // Fetch stats in parallel
      const [
        familyResult,
        workersResult,
        violationsResult,
        visasResult,
        licensesResult,
        vehiclesResult,
      ] = await Promise.all([
        supabase.from('family_members').select('is_inside_kingdom').eq('user_id', user.id),
        supabase.from('workers').select('is_inside_kingdom').eq('user_id', user.id),
        supabase.from('traffic_violations').select('*').eq('user_id', user.id),
        supabase.from('visas').select('status').eq('user_id', user.id),
        supabase.from('driving_licenses').select('status').eq('user_id', user.id),
        supabase.from('vehicles').select('status').eq('user_id', user.id),
      ]);

      const familyMembers = familyResult.data || [];
      const workers = workersResult.data || [];
      const violations = violationsResult.data || [];
      const visas = visasResult.data || [];
      const licenses = licensesResult.data || [];
      const vehicles = vehiclesResult.data || [];

      const unpaidViolations = violations.filter(v => !v.is_paid);
      const lastViolation = violations.sort((a, b) => 
        new Date(b.violation_date).getTime() - new Date(a.violation_date).getTime()
      )[0];

      setStats({
        familyInside: familyMembers.filter(f => f.is_inside_kingdom).length,
        familyOutside: familyMembers.filter(f => !f.is_inside_kingdom).length,
        workersInside: workers.filter(w => w.is_inside_kingdom).length,
        workersOutside: workers.filter(w => !w.is_inside_kingdom).length,
        unpaidViolations: unpaidViolations.length,
        violationsAmount: unpaidViolations.reduce((sum, v) => sum + Number(v.amount), 0),
        lastViolationDate: lastViolation?.violation_date || null,
        visaRequests: visas.filter(v => v.status === 'active').length,
        visasIssued: visas.length,
        visaBalance: 0,
        licensesTotal: licenses.length,
        licensesExpired: licenses.filter(l => l.status === 'expired').length,
        licensesExpiring: licenses.filter(l => l.status === 'expiring_soon').length,
        vehiclesTotal: vehicles.length,
        vehiclesExpired: vehicles.filter(v => v.status === 'expired').length,
        vehiclesExpiring: vehicles.filter(v => v.status === 'expiring_soon').length,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskId = (id: string | null) => {
    if (!id) return '—';
    return id.slice(0, 2) + '*'.repeat(id.length - 4) + id.slice(-2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Personal Info Card */}
        <Card className="mb-8 bg-gradient-to-l from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">البيانات الشخصية</CardTitle>
                <p className="text-muted-foreground">معلوماتك الأساسية</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                <p className="font-semibold text-lg">{profile?.full_name || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <p className="font-semibold text-lg font-mono">{maskId(profile?.national_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجنسية</p>
                <p className="font-semibold">{profile?.nationality || 'العربية السعودية'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المدينة</p>
                <p className="font-semibold">{profile?.city || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المهنة</p>
                <p className="font-semibold">{profile?.occupation || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة الاجتماعية</p>
                <Badge variant="secondary">{profile?.marital_status || 'غير محدد'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الميلاد (ميلادي)</p>
                <p className="font-semibold">{profile?.birth_date_gregorian || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الميلاد (هجري)</p>
                <p className="font-semibold">{profile?.birth_date_hijri || 'غير محدد'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="أفراد الأسرة"
            stats={[
              { label: 'داخل المملكة', value: stats?.familyInside || 0 },
              { label: 'خارج المملكة', value: stats?.familyOutside || 0 },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            title="العمالة"
            stats={[
              { label: 'داخل المملكة', value: stats?.workersInside || 0 },
              { label: 'خارج المملكة', value: stats?.workersOutside || 0 },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title="المخالفات المرورية"
            stats={[
              { label: 'مخالفات غير مدفوعة', value: stats?.unpaidViolations || 0 },
              { label: 'قيمة المخالفات', value: `${stats?.violationsAmount || 0} ر.س` },
              { label: 'تاريخ آخر مخالفة', value: stats?.lastViolationDate || '—' },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<Plane className="w-5 h-5" />}
            title="الاستخدام (التأشيرات)"
            stats={[
              { label: 'عدد الطلبات', value: stats?.visaRequests || 0 },
              { label: 'عدد التأشيرات', value: stats?.visasIssued || 0 },
              { label: 'الرصيد المتوفر', value: stats?.visaBalance || 0 },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            title="سجل السفر"
            stats={[
              { label: 'حالة السفر', value: profile?.travel_status || 'داخل المملكة' },
              { label: 'وجهة آخر سفر', value: profile?.last_travel_destination || '—' },
              { label: 'تاريخ آخر سفر', value: profile?.last_travel_date || '—' },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<CreditCard className="w-5 h-5" />}
            title="رخصة القيادة"
            stats={[
              { label: 'عدد الرخص', value: stats?.licensesTotal || 0 },
              { label: 'انتهت', value: stats?.licensesExpired || 0 },
              { label: 'على وشك الانتهاء', value: stats?.licensesExpiring || 0 },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<Car className="w-5 h-5" />}
            title="رخصة سير"
            stats={[
              { label: 'عدد المركبات', value: stats?.vehiclesTotal || 0 },
              { label: 'انتهت', value: stats?.vehiclesExpired || 0 },
              { label: 'على وشك الانتهاء', value: stats?.vehiclesExpiring || 0 },
            ]}
            onViewMore={() => {}}
          />

          <StatCard
            icon={<FileText className="w-5 h-5" />}
            title="الهوية الوطنية"
            stats={[
              { label: 'رقم الهوية', value: maskId(profile?.national_id) },
              { label: 'تاريخ الانتهاء', value: profile?.national_id_expiry || '—' },
            ]}
            onViewMore={() => {}}
          />
        </div>
      </div>
    </Layout>
  );
}
