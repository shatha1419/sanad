export type ServiceActionType = 'chat' | 'direct' | 'view';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  actionType: ServiceActionType;
  agentTool?: string;
  subServices?: ServiceItem[];
}

export interface ServiceCategoryType {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  services: ServiceItem[];
}

export const SERVICES: Record<string, ServiceCategoryType> = {
  traffic: {
    id: 'traffic',
    name: 'المرور',
    icon: 'Car',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    services: [
      { id: 'traffic_contact', name: 'تواصل', description: 'التواصل مع إدارة المرور', actionType: 'chat' },
      { id: 'plate_auction', name: 'خدمة مزاد اللوحات الإلكتروني', description: 'المشاركة في مزاد اللوحات المميزة', actionType: 'chat' },
      { id: 'accident_objection', name: 'الاعتراض أو التنازل عن حادث', description: 'تقديم اعتراض أو تنازل عن حادث مروري', actionType: 'chat' },
      { id: 'renew_license', name: 'تجديد رخصة القيادة', description: 'تجديد الرخصة المنتهية أو قريبة الانتهاء', actionType: 'direct', agentTool: 'renew_license' },
      { id: 'issue_license', name: 'إصدار رخصة قيادة', description: 'إصدار رخصة قيادة جديدة', actionType: 'chat' },
      { id: 'customs_cards', name: 'البطائق الجمركية', description: 'إدارة البطائق الجمركية للمركبات', actionType: 'chat' },
      { 
        id: 'traffic_violations', 
        name: 'المخالفات المرورية', 
        description: 'إدارة المخالفات المرورية',
        actionType: 'view',
        subServices: [
          { id: 'violation_objection', name: 'الاعتراض على المخالفات المرورية', description: 'تقديم اعتراض على مخالفة', actionType: 'chat' },
          { id: 'check_violations', name: 'الاستعلام الشامل عن المخالفات المرورية', description: 'عرض جميع المخالفات', actionType: 'direct', agentTool: 'check_fines' },
          { id: 'extend_payment', name: 'تمديد مهلة سداد المخالفات المرورية', description: 'طلب تمديد مهلة السداد', actionType: 'chat' },
        ]
      },
      { id: 'accident_report', name: 'تقرير الحادث', description: 'عرض تقارير الحوادث', actionType: 'chat' },
      { id: 'renew_license_abroad', name: 'تجديد رخصة القيادة لمن هم بالخارج', description: 'تجديد الرخصة للمقيمين خارج المملكة', actionType: 'chat' },
    ],
  },
  civil_affairs: {
    id: 'civil_affairs',
    name: 'الأحوال المدنية',
    icon: 'IdCard',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    services: [
      { id: 'national_id_services', name: 'خدمات الهوية الوطنية', description: 'إصدار وتجديد الهوية الوطنية', actionType: 'chat' },
      { id: 'family_record_services', name: 'خدمات سجل الأسرة', description: 'إدارة سجل الأسرة', actionType: 'chat' },
      { id: 'birth_registration', name: 'خدمة تسجيل المواليد', description: 'تسجيل مولود جديد', actionType: 'chat' },
      { id: 'birth_certificate_services', name: 'خدمات شهادة الميلاد', description: 'إصدار واستخراج شهادة الميلاد', actionType: 'chat' },
      { id: 'death_certificate_services', name: 'خدمات شهادة الوفاة', description: 'إصدار شهادة وفاة', actionType: 'chat' },
      { id: 'civil_contact', name: 'تواصل', description: 'التواصل مع الأحوال المدنية', actionType: 'chat' },
      { id: 'advanced_data', name: 'بياناتي المطورة', description: 'عرض البيانات الشخصية المطورة', actionType: 'direct', agentTool: 'get_advanced_data' },
      { id: 'taqdir', name: 'تقدير', description: 'خدمة تقدير', actionType: 'chat' },
      { id: 'martyr_service', name: 'خدمة شهيد الواجب', description: 'خدمات ذوي الشهداء', actionType: 'chat' },
      { id: 'tahsin', name: 'خدمة تحسين', description: 'خدمة تحسين البيانات', actionType: 'chat' },
      { id: 'personal_info', name: 'المعلومات الشخصية', description: 'عرض المعلومات الشخصية', actionType: 'view' },
      { id: 'my_data', name: 'بيـانـاتـي', description: 'عرض بياناتي الكاملة', actionType: 'direct', agentTool: 'get_my_data' },
      { id: 'virtual_office', name: 'المكتب الافتراضي', description: 'خدمات المكتب الافتراضي', actionType: 'chat' },
      { id: 'update_qualification', name: 'تحديث المؤهل الدراسي', description: 'تحديث بيانات المؤهل الدراسي', actionType: 'chat' },
      { id: 'name_modification', name: 'خدمات تعديل خانات الاسم', description: 'تعديل الاسم في السجلات', actionType: 'chat' },
      { id: 'profession_modification', name: 'تعديل مهنة مواطن', description: 'تعديل المهنة المسجلة', actionType: 'chat' },
      { id: 'marital_status_correction', name: 'خدمة تصحيح الحالة الاجتماعية', description: 'تصحيح الحالة الاجتماعية', actionType: 'chat' },
      { id: 'physical_attributes', name: 'التعديل في العلامة الفارقة والطول ولون الوجه والعينين', description: 'تعديل الصفات الجسدية', actionType: 'chat' },
      { id: 'link_children_records', name: 'ربط سجلات الأبناء بسجلات والديهم', description: 'ربط سجلات الأبناء', actionType: 'chat' },
    ],
  },
  passports: {
    id: 'passports',
    name: 'الجوازات',
    icon: 'BookOpen',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    services: [
      { id: 'military_travel_inquiry', name: 'الاستفسار عن تصاريح السفر للعسكريين', description: 'استعلام عن تصاريح السفر للعسكريين', actionType: 'chat' },
      { id: 'passport_contact', name: 'تواصل', description: 'التواصل مع الجوازات', actionType: 'chat' },
      { id: 'parents_consent', name: 'اشتراطات الوالدين بشأن أخذ موافقتهم', description: 'إدارة موافقات الوالدين للسفر', actionType: 'chat' },
      { id: 'foster_family_travel', name: 'تصاريح السفر للأسر الحاضنة', description: 'إصدار تصاريح سفر للأسر الحاضنة', actionType: 'chat' },
      { id: 'passport_services', name: 'خدمات جواز السفر السعودي', description: 'إصدار وتجديد جواز السفر', actionType: 'chat' },
      { id: 'visitor_services', name: 'خدمات الزوار', description: 'خدمات متعلقة بالزوار', actionType: 'chat' },
      { id: 'final_exit_report', name: 'تقرير إثبات خروج نهائي', description: 'إصدار تقرير الخروج النهائي', actionType: 'direct', agentTool: 'final_exit_report' },
      { id: 'resident_stay_report', name: 'تقرير مدة بقاء مقيم', description: 'استعلام عن مدة بقاء المقيم', actionType: 'direct', agentTool: 'resident_stay_report' },
    ],
  },
};

export const QUICK_SUGGESTIONS = [
  'ما هي متطلبات تجديد الجواز؟',
  'استعلم عن مخالفاتي المرورية',
  'أريد تجديد رخصة القيادة',
  'كيف أجدد الهوية الوطنية؟',
  'ما هي رسوم إصدار جواز السفر؟',
  'حجز موعد في الأحوال المدنية',
];

// Demo users data for national ID login
export const DEMO_USERS: Record<string, {
  nationalId: string;
  fullName: string;
  birthDateGregorian: string;
  birthDateHijri: string;
  nationality: string;
  city: string;
  occupation: string;
  maritalStatus: string;
  nationalIdExpiry: string;
  phone: string;
}> = {
  '1100000001': {
    nationalId: '1100000001',
    fullName: 'محمد سعد بن محمد الدوسري',
    birthDateGregorian: '2002-07-17',
    birthDateHijri: '1423/05/07',
    nationality: 'العربية السعودية',
    city: 'الرياض',
    occupation: 'طالب',
    maritalStatus: 'أعزب',
    nationalIdExpiry: '1449/05/24',
    phone: '0500000001',
  },
  '1100000002': {
    nationalId: '1100000002',
    fullName: 'أحمد عبدالله السالم',
    birthDateGregorian: '1990-03-15',
    birthDateHijri: '1410/08/18',
    nationality: 'العربية السعودية',
    city: 'جدة',
    occupation: 'مهندس',
    maritalStatus: 'متزوج',
    nationalIdExpiry: '1448/02/10',
    phone: '0500000002',
  },
};
