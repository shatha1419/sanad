import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  appointment_date: string;
  appointment_time?: string;
  service_type?: string;
  location?: string;
  status: string;
}

export function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    time: '',
    location: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedDate || !newAppointment.title || !user) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          title: newAppointment.title,
          description: newAppointment.description || null,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: newAppointment.time || null,
          location: newAppointment.location || null,
          status: 'scheduled',
        });

      if (error) throw error;

      toast.success('تم إضافة الموعد بنجاح');
      setIsDialogOpen(false);
      setNewAppointment({ title: '', description: '', time: '', location: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('حدث خطأ في إضافة الموعد');
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const hasAppointments = (date: Date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 ml-1" />
                إضافة
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة موعد جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-right block">التاريخ المحدد</Label>
                  <p className="text-sm text-muted-foreground text-right">
                    {selectedDate ? format(selectedDate, 'EEEE، d MMMM yyyy', { locale: ar }) : 'اختر تاريخ'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">عنوان الموعد *</Label>
                  <Input
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    placeholder="مثال: موعد تجديد الرخصة"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">الوقت</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">الموقع</Label>
                  <Input
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                    placeholder="مثال: إدارة المرور - الرياض"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">ملاحظات</Label>
                  <Input
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                    className="text-right"
                  />
                </div>
                <Button onClick={handleAddAppointment} className="w-full gradient-primary">
                  حفظ الموعد
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <CardTitle className="text-base font-semibold flex items-center gap-2 flex-row-reverse">
            <CalendarIcon className="w-5 h-5 text-primary" />
            التقويم
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 w-full pointer-events-auto"
              modifiers={{
                hasAppointment: (date) => hasAppointments(date),
              }}
              modifiersStyles={{
                hasAppointment: {
                  backgroundColor: 'hsl(var(--primary) / 0.2)',
                  borderRadius: '50%',
                },
              }}
            />
            
            {/* Selected Date Appointments */}
            {selectedDate && selectedDateAppointments.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm font-medium text-right mb-2">
                  مواعيد {format(selectedDate, 'd MMMM', { locale: ar })}
                </p>
                <div className="space-y-2">
                  {selectedDateAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="bg-primary/5 rounded-lg p-2 text-right"
                    >
                      <p className="font-medium text-sm text-foreground">{apt.title}</p>
                      <div className="flex items-center gap-3 flex-row-reverse mt-1 text-xs text-muted-foreground">
                        {apt.appointment_time && (
                          <span className="flex items-center gap-1 flex-row-reverse">
                            <Clock className="w-3 h-3" />
                            {apt.appointment_time}
                          </span>
                        )}
                        {apt.location && (
                          <span className="flex items-center gap-1 flex-row-reverse">
                            <MapPin className="w-3 h-3" />
                            {apt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}