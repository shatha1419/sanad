export type ServiceActionType = 'chat' | 'direct' | 'view';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  actionType: ServiceActionType;
  agentTool?: string;
  conditions?: string[];
  fees?: string;
  beneficiary?: string;
  howToAccess?: string;
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
      { 
        id: 'renew_vehicle_registration', 
        name: 'تجديد رخصة سير (الاستمارة)', 
        description: 'تجديد رخصة سير المركبة ليستمر استخدامها بشكل نظامي داخل المملكة',
        actionType: 'direct', 
        agentTool: 'renew_vehicle_registration',
        conditions: ['وجود فحص دوري ساري', 'وجود تأمين ساري للمركبة', 'سداد رسوم التجديد', 'عدم وجود مخالفات مرورية'],
        fees: '100 ريال لكل سنة',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← خدمات المركبات ← تجديد رخصة سير'
      },
      { 
        id: 'transfer_vehicle_ownership', 
        name: 'نقل ملكية مركبة (مبايعة)', 
        description: 'نقل ملكية السيارة بين البائع والمشتري بشكل إلكتروني',
        actionType: 'direct', 
        agentTool: 'transfer_vehicle_ownership',
        conditions: ['فحص دوري ساري', 'تأمين للمركبة', 'سداد رسوم النقل', 'رخصة سير سارية'],
        fees: '230 ريال',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← مبايعة المركبات ← نقل ملكية مركبة'
      },
      { 
        id: 'add_vehicle_user', 
        name: 'إضافة مستخدم فعلي للمركبة', 
        description: 'تمكين شخص آخر من استخدام المركبة بشكل رسمي',
        actionType: 'direct', 
        agentTool: 'add_vehicle_user',
        conditions: ['موافقة المالك', 'أن يمتلك المستخدم رخصة قيادة مناسبة'],
        fees: 'مجاني',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← إدارة المركبات ← إضافة مستخدم فعلي'
      },
      { 
        id: 'remove_vehicle_user', 
        name: 'إزالة مستخدم فعلي للمركبة', 
        description: 'إلغاء تسجيل شخص كمستخدم فعلي للمركبة',
        actionType: 'direct', 
        agentTool: 'remove_vehicle_user',
        conditions: ['موافقة المالك', 'عدم وجود مخالفات معلقة'],
        fees: 'مجاني',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← إدارة المركبات ← إزالة مستخدم فعلي'
      },
      { 
        id: 'renew_license', 
        name: 'تجديد رخصة القيادة', 
        description: 'تجديد رخص القيادة الخاصة والعامة',
        actionType: 'direct', 
        agentTool: 'renew_license',
        conditions: ['فحص طبي', 'سداد رسوم التجديد', 'عدم وجود مخالفات'],
        fees: '40 ريال لكل سنة',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← خدمات رخص القيادة ← تجديد رخصة قيادة'
      },
      { 
        id: 'issue_license', 
        name: 'إصدار رخصة قيادة', 
        description: 'إصدار رخصة قيادة جديدة بعد اجتياز التدريب',
        actionType: 'direct', 
        agentTool: 'issue_license',
        conditions: ['اجتياز الفحص العملي', 'اجتياز الفحص النظري', 'فحص طبي', 'إتمام الساعات التدريبية'],
        fees: '100 – 400 ريال حسب نوع الرخصة',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← خدمات رخص القيادة ← إصدار رخصة قيادة'
      },
      { 
        id: 'check_violations', 
        name: 'الاستعلام عن المخالفات المرورية', 
        description: 'معرفة تفاصيل المخالفات المسجلة على المستخدم أو المركبات',
        actionType: 'direct', 
        agentTool: 'check_fines',
        conditions: [],
        fees: 'مجاني',
        beneficiary: 'الجميع',
        howToAccess: 'خدماتي ← المرور ← المخالفات ← الاستعلام عن المخالفات'
      },
      { 
        id: 'violation_objection', 
        name: 'الاعتراض على المخالفات', 
        description: 'رفع اعتراض رسمي على مخالفة رصد آلي',
        actionType: 'direct', 
        agentTool: 'violation_objection',
        conditions: ['التقديم خلال 30 يوم من تسجيل المخالفة', 'أن تكون مخالفة رصد آلي'],
        fees: 'مجاني',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← المرور ← المخالفات ← الاعتراض على المخالفات'
      },
      { 
        id: 'book_traffic_appointment', 
        name: 'حجز موعد مرور', 
        description: 'حجز موعد لزيارة أحد فروع المرور لإتمام خدمة تتطلب حضور',
        actionType: 'direct', 
        agentTool: 'book_appointment',
        conditions: [],
        fees: 'مجاني',
        beneficiary: 'الجميع',
        howToAccess: 'خدماتي ← المواعيد ← المرور ← حجز موعد'
      },
    ],
  },
  civil_affairs: {
    id: 'civil_affairs',
    name: 'الأحوال المدنية',
    icon: 'IdCard',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    services: [
      { 
        id: 'renew_id', 
        name: 'تجديد الهوية الوطنية', 
        description: 'تجديد بطاقة الهوية الوطنية عند انتهاء صلاحيتها',
        actionType: 'direct', 
        agentTool: 'renew_id',
        conditions: ['رفع صورة حديثة', 'سداد رسوم التوصيل (إن تم طلب توصيل)', 'حجز موعد (إن اخترت استلام من الفرع)'],
        fees: 'مجاني',
        beneficiary: 'المواطن فقط',
        howToAccess: 'خدماتي ← الأحوال المدنية ← الهوية الوطنية ← تجديد الهوية'
      },
      { 
        id: 'issue_new_id', 
        name: 'إصدار هوية وطنية جديدة', 
        description: 'إصدار بطاقة هوية لأول مرة عند بلوغ السن القانونية',
        actionType: 'direct', 
        agentTool: 'issue_new_id',
        conditions: ['السن 15+', 'صورة شخصية', 'شهادة ميلاد', 'حضور ولي الأمر'],
        fees: 'مجاني',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الأحوال المدنية ← الهوية الوطنية ← إصدار هوية جديدة'
      },
      { 
        id: 'issue_family_record', 
        name: 'إصدار سجل الأسرة', 
        description: 'إصدار سجل الأسرة للأب أو الأم',
        actionType: 'direct', 
        agentTool: 'issue_family_record',
        conditions: ['وجود زواج مسجل', 'وجود أبناء'],
        fees: 'مجاني',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الأحوال المدنية ← سجل الأسرة ← إصدار سجل الأسرة'
      },
      { 
        id: 'register_newborn', 
        name: 'تسجيل مولود', 
        description: 'إضافة مولود جديد إلى السجلات الرسمية',
        actionType: 'direct', 
        agentTool: 'register_newborn',
        conditions: ['بلاغ مستشفى', 'عقد الزواج'],
        fees: 'مجاني',
        beneficiary: 'مواطن – مقيم',
        howToAccess: 'خدماتي ← الأحوال المدنية ← المواليد ← تسجيل مولود'
      },
      { 
        id: 'update_qualification', 
        name: 'تعديل المؤهل الدراسي', 
        description: 'تحديث أو تصحيح المؤهل الدراسي في السجلات المدنية',
        actionType: 'direct', 
        agentTool: 'update_qualification',
        conditions: ['رفع شهادة المؤهل', 'مطابقة البيانات'],
        fees: 'مجاني',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الأحوال المدنية ← تعديل البيانات ← تعديل المؤهل الدراسي'
      },
      { 
        id: 'update_english_name', 
        name: 'تعديل الاسم باللغة الإنجليزية', 
        description: 'تصحيح أو تحديث الاسم باللغة الإنجليزية في السجل المدني',
        actionType: 'direct', 
        agentTool: 'update_english_name',
        conditions: ['مطابقة الاسم مع جواز السفر', 'إرفاق المستندات المطلوبة'],
        fees: 'مجاني',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الأحوال المدنية ← تعديل البيانات ← تعديل الاسم بالإنجليزية'
      },
    ],
  },
  passports: {
    id: 'passports',
    name: 'الجوازات',
    icon: 'BookOpen',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    services: [
      { 
        id: 'renew_passport', 
        name: 'تجديد جواز السفر السعودي', 
        description: 'تجديد جواز السفر السعودي إلكترونيًا بالكامل',
        actionType: 'direct', 
        agentTool: 'renew_passport',
        conditions: ['هوية وطنية سارية', 'وجود صورة بالنظام', 'سداد الرسوم'],
        fees: '300 ريال (5 سنوات) / 600 ريال (10 سنوات)',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الجوازات ← الجواز السعودي ← تجديد جواز'
      },
      { 
        id: 'issue_passport', 
        name: 'إصدار جواز سفر سعودي', 
        description: 'إصدار جواز سفر لأول مرة',
        actionType: 'direct', 
        agentTool: 'issue_passport',
        conditions: ['موافقة ولي الأمر تحت سن 21', 'صورة حديثة'],
        fees: '300 أو 600 ريال حسب مدة الجواز',
        beneficiary: 'المواطن',
        howToAccess: 'خدماتي ← الجوازات ← الجواز السعودي ← إصدار جواز'
      },
      { 
        id: 'renew_iqama', 
        name: 'تجديد إقامة للمقيم', 
        description: 'تجديد إقامة العمالة المنزلية أو المقيمين للعمل',
        actionType: 'direct', 
        agentTool: 'renew_iqama',
        conditions: ['تأمين طبي', 'سداد رسوم الإقامة', 'عدم وجود مخالفات'],
        fees: '650 ريال – حسب المهنة والقطاع',
        beneficiary: 'المقيم – صاحب العمل',
        howToAccess: 'خدماتي ← الجوازات ← خدمات المقيمين ← تجديد إقامة'
      },
      { 
        id: 'transfer_passport_info', 
        name: 'نقل معلومات جواز', 
        description: 'تحديث بيانات الجواز الجديد للعامل أو التابع',
        actionType: 'direct', 
        agentTool: 'transfer_passport_info',
        conditions: ['جواز جديد', 'إقامة سارية'],
        fees: 'مجاني',
        beneficiary: 'المقيم',
        howToAccess: 'خدماتي ← الجوازات ← خدمات المقيمين ← نقل معلومات جواز'
      },
      { 
        id: 'exit_reentry_visa', 
        name: 'إصدار تأشيرة خروج وعودة', 
        description: 'إصدار تأشيرة تسمح بالسفر والعودة للمملكة',
        actionType: 'direct', 
        agentTool: 'exit_reentry_visa',
        conditions: ['إقامة سارية', 'جواز ساري', 'سداد الرسوم'],
        fees: '200 ريال لشهرين + 100 ريال لكل شهر إضافي',
        beneficiary: 'المقيم',
        howToAccess: 'خدماتي ← الجوازات ← التأشيرات ← إصدار خروج وعودة'
      },
      { 
        id: 'final_exit_visa', 
        name: 'إصدار تأشيرة خروج نهائي', 
        description: 'إنهاء الإقامة ومغادرة المملكة بشكل نهائي',
        actionType: 'direct', 
        agentTool: 'final_exit_visa',
        conditions: ['عدم وجود مخالفات', 'جواز ساري'],
        fees: 'مجاني',
        beneficiary: 'المقيم',
        howToAccess: 'خدماتي ← الجوازات ← التأشيرات ← خروج نهائي'
      },
      { 
        id: 'transfer_sponsorship', 
        name: 'نقل كفالة (نقل خدمات)', 
        description: 'نقل العامل من منشأة إلى منشأة أخرى',
        actionType: 'direct', 
        agentTool: 'transfer_sponsorship',
        conditions: ['موافقة الكفيلين', 'سداد رسوم النقل', 'عدم وجود بلاغات أو مخالفات'],
        fees: '2000 – 4000 ريال حسب النقل',
        beneficiary: 'المقيم – صاحب العمل',
        howToAccess: 'خدماتي ← الجوازات ← خدمات المقيمين ← نقل خدمات'
      },
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
  violations?: Array<{
    id: string;
    number: string;
    type: string;
    amount: number;
    date: string;
    location: string;
  }>;
}> = {
  '1111111111': {
    nationalId: '1111111111',
    fullName: 'عبدالله محمد العتيبي',
    birthDateGregorian: '1995-05-20',
    birthDateHijri: '1415/12/20',
    nationality: 'العربية السعودية',
    city: 'الرياض',
    occupation: 'موظف حكومي',
    maritalStatus: 'متزوج',
    nationalIdExpiry: '1450/01/15',
    phone: '0551111111',
    violations: [
      { id: 'V001', number: 'MV-2024-001', type: 'تجاوز السرعة المحددة', amount: 150, date: '2024-01-15', location: 'طريق الملك فهد' },
      { id: 'V002', number: 'MV-2024-002', type: 'قطع إشارة حمراء', amount: 500, date: '2024-02-20', location: 'تقاطع العليا' },
      { id: 'V003', number: 'MV-2024-003', type: 'عدم ربط حزام الأمان', amount: 150, date: '2024-03-05', location: 'شارع التحلية' },
      { id: 'V004', number: 'MV-2024-004', type: 'الوقوف الخاطئ', amount: 100, date: '2024-04-10', location: 'شارع الأمير سلطان' },
    ],
  },
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
    violations: [
      { id: 'V005', number: 'MV-2024-005', type: 'تجاوز السرعة بـ 30 كم/س', amount: 300, date: '2024-05-01', location: 'طريق الملك عبدالله' },
    ],
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
    violations: [],
  },
};
