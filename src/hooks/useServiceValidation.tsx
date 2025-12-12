import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Worker {
  id: string;
  name: string;
  visa_number: string | null;
  nationality: string | null;
  occupation: string | null;
  visa_expiry: string | null;
  is_inside_kingdom: boolean | null;
}

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  registration_expiry: string;
  status: string | null;
}

interface Violation {
  id: string;
  violation_number: string;
  violation_type: string;
  amount: number;
  violation_date: string;
  location: string | null;
  is_paid: boolean | null;
}

interface DrivingLicense {
  id: string;
  license_number: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  status: string | null;
}

interface ValidationResult {
  workers: Worker[];
  vehicles: Vehicle[];
  violations: Violation[];
  licenses: DrivingLicense[];
  hasWorkers: boolean;
  hasVehicles: boolean;
  hasUnpaidViolations: boolean;
  hasValidLicense: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useServiceValidation() {
  const { user } = useAuth();
  const [data, setData] = useState<ValidationResult>({
    workers: [],
    vehicles: [],
    violations: [],
    licenses: [],
    hasWorkers: false,
    hasVehicles: false,
    hasUnpaidViolations: false,
    hasValidLicense: false,
    isLoading: false,
    error: null,
  });

  const fetchWorkers = useCallback(async () => {
    if (!user) return [];
    
    const { data: workers, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching workers:', error);
      return [];
    }
    
    return workers || [];
  }, [user]);

  const fetchVehicles = useCallback(async () => {
    if (!user) return [];
    
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
    
    return vehicles || [];
  }, [user]);

  const fetchViolations = useCallback(async () => {
    if (!user) return [];
    
    const { data: violations, error } = await supabase
      .from('traffic_violations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', false);
    
    if (error) {
      console.error('Error fetching violations:', error);
      return [];
    }
    
    return violations || [];
  }, [user]);

  const fetchLicenses = useCallback(async () => {
    if (!user) return [];
    
    const { data: licenses, error } = await supabase
      .from('driving_licenses')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching licenses:', error);
      return [];
    }
    
    return licenses || [];
  }, [user]);

  const validateForService = useCallback(async (agentTool: string) => {
    if (!user) {
      return { valid: false, message: 'يجب تسجيل الدخول أولاً' };
    }

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Services that require workers
      const workerServices = ['renew_iqama', 'exit_reentry_visa', 'final_exit_visa', 'transfer_sponsorship', 'transfer_passport_info'];
      
      // Services that require vehicles
      const vehicleServices = ['renew_vehicle_registration', 'transfer_vehicle_ownership', 'add_vehicle_user', 'remove_vehicle_user'];
      
      // Services that check violations
      const violationServices = ['check_fines', 'violation_objection'];
      
      // Services that require license
      const licenseServices = ['renew_license'];

      let workers: Worker[] = [];
      let vehicles: Vehicle[] = [];
      let violations: Violation[] = [];
      let licenses: DrivingLicense[] = [];

      // Fetch relevant data based on service type
      if (workerServices.includes(agentTool)) {
        workers = await fetchWorkers();
        if (workers.length === 0) {
          setData(prev => ({ ...prev, isLoading: false, workers: [] }));
          return { 
            valid: false, 
            message: 'لا يوجد لديك عمالة مسجلة. يرجى إضافة عمالة أولاً.',
            requiresData: 'workers'
          };
        }
      }

      if (vehicleServices.includes(agentTool)) {
        vehicles = await fetchVehicles();
        if (vehicles.length === 0) {
          setData(prev => ({ ...prev, isLoading: false, vehicles: [] }));
          return { 
            valid: false, 
            message: 'لا توجد لديك مركبات مسجلة. يرجى تسجيل مركبة أولاً.',
            requiresData: 'vehicles'
          };
        }
      }

      if (violationServices.includes(agentTool)) {
        violations = await fetchViolations();
      }

      if (licenseServices.includes(agentTool)) {
        licenses = await fetchLicenses();
        if (licenses.length === 0) {
          setData(prev => ({ ...prev, isLoading: false, licenses: [] }));
          return { 
            valid: false, 
            message: 'لا توجد لديك رخصة قيادة. يرجى إصدار رخصة أولاً.',
            requiresData: 'licenses'
          };
        }
      }

      setData({
        workers,
        vehicles,
        violations,
        licenses,
        hasWorkers: workers.length > 0,
        hasVehicles: vehicles.length > 0,
        hasUnpaidViolations: violations.length > 0,
        hasValidLicense: licenses.some(l => l.status === 'active'),
        isLoading: false,
        error: null,
      });

      return { valid: true, data: { workers, vehicles, violations, licenses } };
    } catch (error) {
      console.error('Validation error:', error);
      setData(prev => ({ ...prev, isLoading: false, error: 'حدث خطأ أثناء التحقق' }));
      return { valid: false, message: 'حدث خطأ أثناء التحقق من البيانات' };
    }
  }, [user, fetchWorkers, fetchVehicles, fetchViolations, fetchLicenses]);

  const getWorkerByIqama = useCallback((iqamaNumber: string) => {
    return data.workers.find(w => w.visa_number === iqamaNumber);
  }, [data.workers]);

  const getVehicleByPlate = useCallback((plateNumber: string) => {
    return data.vehicles.find(v => v.plate_number === plateNumber);
  }, [data.vehicles]);

  return {
    ...data,
    validateForService,
    getWorkerByIqama,
    getVehicleByPlate,
    refetch: validateForService,
  };
}
