export const SERVICES = {
  passports: {
    id: 'passports',
    name: 'الجوازات',
    icon: 'Passport',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    services: [
      { id: 'issue_passport', name: 'إصدار جواز سفر جديد', description: 'إصدار جواز سفر لأول مرة' },
      { id: 'renew_passport', name: 'تجديد جواز السفر', description: 'تجديد الجواز المنتهي أو قريب الانتهاء' },
      { id: 'track_passport', name: 'متابعة طلب جواز', description: 'تتبع حالة طلب الجواز' },
    ],
  },
  traffic: {
    id: 'traffic',
    name: 'المرور',
    icon: 'Car',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    services: [
      { id: 'check_fines', name: 'استعلام المخالفات', description: 'الاستعلام عن المخالفات المرورية' },
      { id: 'pay_fine', name: 'دفع مخالفة', description: 'سداد المخالفات المرورية' },
      { id: 'renew_license', name: 'تجديد رخصة القيادة', description: 'تجديد الرخصة المنتهية' },
      { id: 'book_driving_test', name: 'حجز موعد فحص', description: 'حجز موعد لفحص القيادة' },
    ],
  },
  civil_affairs: {
    id: 'civil_affairs',
    name: 'الأحوال المدنية',
    icon: 'IdCard',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    services: [
      { id: 'renew_id', name: 'تجديد الهوية الوطنية', description: 'تجديد الهوية المنتهية' },
      { id: 'birth_certificate', name: 'شهادة الميلاد', description: 'إصدار أو استخراج شهادة ميلاد' },
      { id: 'marriage_certificate', name: 'شهادة الزواج', description: 'إصدار أو استخراج شهادة زواج' },
    ],
  },
  visas: {
    id: 'visas',
    name: 'التأشيرات',
    icon: 'Plane',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    services: [
      { id: 'family_visit_visa', name: 'تأشيرة زيارة عائلية', description: 'إصدار تأشيرة لزيارة الأقارب' },
      { id: 'exit_reentry_visa', name: 'تأشيرة خروج وعودة', description: 'إصدار تأشيرة للسفر والعودة' },
      { id: 'check_visa_status', name: 'حالة التأشيرة', description: 'الاستعلام عن حالة التأشيرة' },
    ],
  },
} as const;

export const QUICK_SUGGESTIONS = [
  'ما هي متطلبات تجديد الجواز؟',
  'استعلم عن مخالفاتي المرورية',
  'أريد تجديد رخصة القيادة',
  'كيف أجدد الهوية الوطنية؟',
  'ما هي رسوم تأشيرة الزيارة العائلية؟',
  'حجز موعد في الجوازات',
];
