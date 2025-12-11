import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Loader2 } from 'lucide-react';

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

// Export function to add appointment from services
export async function addServiceAppointment(
  userId: string,
  serviceType: string,
  title: string,
  appointmentDate: Date,
  time?: string,
  location?: string
) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      title,
      service_type: serviceType,
      appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
      appointment_time: time || null,
      location: location || null,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function AppointmentCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
      setIsAddDialogOpen(false);
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
  
  // Get upcoming appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= today;
  }).slice(0, 3);

  return (
    <>
      {/* Calendar Card - Clickable to open dialog */}
      <Card 
        className="bg-card border-border overflow-hidden cursor-pointer hover:shadow-sanad transition-all"
        onClick={() => setIsCalendarOpen(true)}
      >
        <CardContent className="p-5 flex flex-col items-center">
          <div className="text-primary mb-3">
            <CalendarIcon className="w-12 h-12" />
          </div>
          <div className="w-full h-px bg-border mb-3"></div>
          <h3 className="text-base font-semibold text-foreground mb-2">التقويم</h3>
          
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : upcomingAppointments.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              لديك {upcomingAppointments.length} موعد قادم
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">لا توجد مواعيد قادمة</p>
          )}
        </CardContent>
      </Card>

      {/* Calendar Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end">
              <CalendarIcon className="w-5 h-5 text-primary" />
              التقويم والمواعيد
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
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
                {selectedDate && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Button 
                        size="sm" 
                        className="gradient-primary text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة
                      </Button>
                      <p className="text-sm font-medium text-right">
                        {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                    
                    {selectedDateAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDateAppointments.map((apt) => (
                          <div 
                            key={apt.id} 
                            className="bg-primary/5 rounded-lg p-3 text-right"
                          >
                            <div className="flex items-start gap-2 justify-end">
                              {apt.service_type && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                  {apt.service_type}
                                </span>
                              )}
                              <p className="font-medium text-sm text-foreground">{apt.title}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-row-reverse mt-2 text-xs text-muted-foreground">
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
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد مواعيد في هذا اليوم
                      </p>
                    )}
                  </div>
                )}

                {/* Upcoming Appointments Summary */}
                {upcomingAppointments.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm font-medium text-right mb-3">المواعيد القادمة</p>
                    <div className="space-y-2">
                      {upcomingAppointments.map((apt) => (
                        <div 
                          key={apt.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                          onClick={() => setSelectedDate(new Date(apt.appointment_date))}
                        >
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(apt.appointment_date), 'd MMM', { locale: ar })}
                          </span>
                          <span className="text-sm font-medium text-foreground">{apt.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
    </>
  );
}
