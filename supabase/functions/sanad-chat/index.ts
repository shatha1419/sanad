import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Full services data for RAG
const SERVICES_KNOWLEDGE = [
  // المرور
  { name: 'تجديد رخصة سير (الاستمارة)', category: 'المرور', fees: '100 ريال لكل سنة', conditions: 'فحص دوري ساري، تأمين ساري، سداد الرسوم، عدم وجود مخالفات' },
  { name: 'نقل ملكية مركبة (مبايعة)', category: 'المرور', fees: '230 ريال', conditions: 'فحص دوري ساري، تأمين، رخصة سير سارية' },
  { name: 'تجديد رخصة القيادة', category: 'المرور', fees: '40 ريال لكل سنة', conditions: 'فحص طبي، سداد الرسوم' },
  { name: 'إصدار رخصة قيادة', category: 'المرور', fees: '100-400 ريال', conditions: 'اجتياز الفحص العملي والنظري، فحص طبي' },
  { name: 'الاستعلام عن المخالفات', category: 'المرور', fees: 'مجاني', conditions: 'لا يوجد' },
  { name: 'الاعتراض على المخالفات', category: 'المرور', fees: 'مجاني', conditions: 'خلال 30 يوم، مخالفة رصد آلي' },
  // الأحوال المدنية
  { name: 'تجديد الهوية الوطنية', category: 'الأحوال المدنية', fees: 'مجاني', conditions: 'صورة حديثة' },
  { name: 'إصدار هوية وطنية جديدة', category: 'الأحوال المدنية', fees: 'مجاني', conditions: 'السن 15+، صورة، شهادة ميلاد' },
  { name: 'إصدار سجل الأسرة', category: 'الأحوال المدنية', fees: 'مجاني', conditions: 'زواج مسجل، وجود أبناء' },
  { name: 'تسجيل مولود', category: 'الأحوال المدنية', fees: 'مجاني', conditions: 'بلاغ مستشفى، عقد الزواج' },
  // الجوازات
  { name: 'تجديد جواز السفر السعودي', category: 'الجوازات', fees: '300 ريال (5 سنوات) / 600 ريال (10 سنوات)', conditions: 'هوية سارية، صورة، سداد الرسوم' },
  { name: 'إصدار جواز سفر سعودي', category: 'الجوازات', fees: '300 أو 600 ريال', conditions: 'موافقة ولي الأمر لمن تحت 21' },
  { name: 'تجديد إقامة', category: 'الجوازات', fees: '650 ريال وأكثر', conditions: 'تأمين طبي، سداد الرسوم' },
  { name: 'تأشيرة خروج وعودة', category: 'الجوازات', fees: '200 ريال لشهرين + 100 لكل شهر', conditions: 'إقامة وجواز ساريين' },
  { name: 'تأشيرة خروج نهائي', category: 'الجوازات', fees: 'مجاني', conditions: 'عدم وجود مخالفات، جواز ساري' },
  { name: 'نقل كفالة', category: 'الجوازات', fees: '2000-4000 ريال', conditions: 'موافقة الكفيلين، عدم وجود بلاغات' },
];

// Agent tools definitions
const agentTools = [
  {
    type: "function",
    function: {
      name: "check_fines",
      description: "استعلام عن المخالفات المرورية للمستخدم",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "pay_fine",
      description: "دفع مخالفة مرورية",
      parameters: {
        type: "object",
        properties: { fine_id: { type: "string", description: "رقم المخالفة" } },
        required: ["fine_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "renew_license",
      description: "تجديد رخصة القيادة",
      parameters: {
        type: "object",
        properties: { duration_years: { type: "number", description: "مدة التجديد (5 أو 10 سنوات)" } },
        required: ["duration_years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "issue_license",
      description: "إصدار رخصة قيادة جديدة",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "renew_vehicle_registration",
      description: "تجديد رخصة سير المركبة (الاستمارة)",
      parameters: {
        type: "object",
        properties: { plate_number: { type: "string", description: "رقم اللوحة" } },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "transfer_vehicle_ownership",
      description: "نقل ملكية مركبة (مبايعة)",
      parameters: {
        type: "object",
        properties: { 
          buyer_id: { type: "string", description: "هوية المشتري" },
          plate_number: { type: "string", description: "رقم اللوحة" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "violation_objection",
      description: "الاعتراض على مخالفة مرورية",
      parameters: {
        type: "object",
        properties: { 
          violation_number: { type: "string", description: "رقم المخالفة" },
          reason: { type: "string", description: "سبب الاعتراض" }
        },
        required: ["violation_number", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "حجز موعد في جهة حكومية",
      parameters: {
        type: "object",
        properties: {
          service_type: { type: "string", description: "نوع الخدمة" },
          department: { type: "string", enum: ["passports", "traffic", "civil_affairs"], description: "الجهة" },
          preferred_date: { type: "string", description: "التاريخ المفضل" }
        },
        required: ["service_type", "department"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "renew_passport",
      description: "تجديد جواز السفر",
      parameters: {
        type: "object",
        properties: { duration_years: { type: "number", description: "مدة الجواز (5 أو 10)" } },
        required: ["duration_years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "issue_passport",
      description: "إصدار جواز سفر جديد",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "renew_id",
      description: "تجديد الهوية الوطنية",
      parameters: {
        type: "object",
        properties: { delivery_type: { type: "string", enum: ["mail", "office"], description: "طريقة الاستلام" } },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "issue_new_id",
      description: "إصدار هوية وطنية جديدة",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "register_newborn",
      description: "تسجيل مولود جديد في السجلات المدنية",
      parameters: {
        type: "object",
        properties: { 
          baby_name: { type: "string", description: "اسم المولود الرباعي" },
          baby_gender: { type: "string", enum: ["male", "female"], description: "جنس المولود" },
          birth_date: { type: "string", description: "تاريخ الميلاد" },
          birth_place: { type: "string", description: "مكان الولادة" },
          hospital_name: { type: "string", description: "اسم المستشفى" }
        },
        required: ["baby_name", "baby_gender", "birth_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "exit_reentry_visa",
      description: "إصدار تأشيرة خروج وعودة",
      parameters: {
        type: "object",
        properties: {
          visa_type: { type: "string", enum: ["single", "multiple"], description: "نوع التأشيرة" },
          duration_months: { type: "number", description: "المدة بالأشهر" }
        },
        required: ["visa_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "final_exit_visa",
      description: "إصدار تأشيرة خروج نهائي",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "البحث في قاعدة المعرفة للحصول على معلومات عن الخدمات الحكومية ومتطلباتها ورسومها",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "نص البحث" } },
        required: ["query"]
      }
    }
  }
];

// Execute agent tool
async function executeTool(toolName: string, args: Record<string, unknown>, supabaseClient: any, userId?: string): Promise<{ status: string; message: string; data?: unknown; fees?: number }> {
  console.log(`Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case "check_fines": {
      const fines = [
        { id: "F001", amount: 150, reason: "تجاوز السرعة المحددة", date: "2024-01-15", location: "طريق الملك فهد" },
        { id: "F002", amount: 500, reason: "قطع إشارة حمراء", date: "2024-02-20", location: "تقاطع العليا" },
      ];
      const total = fines.reduce((sum, f) => sum + f.amount, 0);
      return {
        status: "success",
        message: `تم العثور على ${fines.length} مخالفات بإجمالي ${total} ريال`,
        data: { 
          المخالفات: fines.map(f => `${f.reason} - ${f.amount} ريال`),
          الإجمالي: `${total} ريال`
        },
        fees: 0
      };
    }

    case "pay_fine": {
      return {
        status: "success",
        message: `تم دفع المخالفة بنجاح. سيتم إرسال إيصال الدفع عبر الرسائل النصية.`,
        data: { 
          رقم_المخالفة: args.fine_id,
          الحالة: "مدفوعة",
          رقم_الإيصال: `R${Date.now().toString().slice(-6)}`
        },
        fees: 0
      };
    }

    case "renew_license": {
      const duration = Number(args.duration_years) || 5;
      const fees = duration * 40;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الرخصة بنجاح`,
        data: { 
          رقم_الطلب: `LR${Date.now().toString().slice(-6)}`,
          المدة: `${duration} سنوات`,
          الرسوم: `${fees} ريال`,
          التوصيل: "سيتم إرسال الرخصة للعنوان الوطني"
        },
        fees
      };
    }

    case "issue_license": {
      return {
        status: "pending",
        message: `لإصدار رخصة قيادة جديدة، يجب اجتياز التدريب في مدرسة قيادة معتمدة`,
        data: { 
          المتطلبات: ["فحص طبي", "فحص نظري", "فحص عملي", "إتمام الساعات التدريبية"],
          الرسوم: "100-400 ريال حسب نوع الرخصة"
        },
        fees: 0
      };
    }

    case "renew_vehicle_registration": {
      const fees = 100;
      return {
        status: "success",
        message: `تم تجديد رخصة سير المركبة بنجاح`,
        data: { 
          رقم_الطلب: `VR${Date.now().toString().slice(-6)}`,
          الرسوم: `${fees} ريال`,
          الحالة: "مكتمل"
        },
        fees
      };
    }

    case "transfer_vehicle_ownership": {
      const fees = 230;
      return {
        status: "success",
        message: `تم تقديم طلب نقل ملكية المركبة بنجاح`,
        data: { 
          رقم_الطلب: `TO${Date.now().toString().slice(-6)}`,
          الرسوم: `${fees} ريال`,
          الحالة: "سيتم إشعار المشتري لتأكيد العملية"
        },
        fees
      };
    }

    case "add_vehicle_user": {
      return {
        status: "success",
        message: `تم إضافة مستخدم فعلي للمركبة بنجاح`,
        data: { 
          رقم_الطلب: `AU${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "مكتمل"
        },
        fees: 0
      };
    }

    case "remove_vehicle_user": {
      return {
        status: "success",
        message: `تم إزالة المستخدم الفعلي من المركبة بنجاح`,
        data: { 
          رقم_الطلب: `RU${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "مكتمل"
        },
        fees: 0
      };
    }

    case "violation_objection": {
      return {
        status: "success",
        message: `تم تقديم الاعتراض على المخالفة بنجاح`,
        data: { 
          رقم_الاعتراض: `OB${Date.now().toString().slice(-6)}`,
          رقم_المخالفة: args.violation_number || "غير محدد",
          الرسوم: "مجاني",
          المدة_المتوقعة: "30 يوم عمل"
        },
        fees: 0
      };
    }

    case "book_appointment": {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 7);
      const dateStr = appointmentDate.toLocaleDateString('ar-SA');
      const deptName = args.department === 'passports' ? 'الجوازات' : args.department === 'traffic' ? 'المرور' : 'الأحوال المدنية';
      
      if (userId) {
        await supabaseClient.from('appointments').insert({
          user_id: userId,
          title: `موعد ${deptName}`,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          appointment_time: '09:00',
          service_type: args.service_type || deptName,
          location: `فرع ${deptName} الرئيسي`,
          status: 'scheduled'
        });
      }
      
      return {
        status: "success",
        message: `تم حجز الموعد بنجاح`,
        data: { 
          رقم_الموعد: `A${Date.now().toString().slice(-6)}`,
          التاريخ: dateStr,
          الوقت: "09:00 صباحاً",
          الجهة: deptName,
          الرسوم: "مجاني"
        },
        fees: 0
      };
    }

    case "renew_passport": {
      const duration = Number(args.duration_years) || 5;
      const fees = duration === 10 ? 600 : 300;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الجواز بنجاح`,
        data: { 
          رقم_الطلب: `P${Date.now().toString().slice(-6)}`,
          المدة: `${duration} سنوات`,
          الرسوم: `${fees} ريال`,
          التوصيل: "سيتم إرسال الجواز عبر البريد"
        },
        fees
      };
    }

    case "issue_passport": {
      return {
        status: "pending",
        message: `لإصدار جواز سفر جديد، يرجى حجز موعد في الجوازات`,
        data: { 
          المتطلبات: ["الهوية الوطنية", "صور شخصية بخلفية بيضاء"],
          الرسوم: "300 ريال"
        },
        fees: 300
      };
    }

    case "renew_id": {
      const delivery = args.delivery_type === 'office' ? 'استلام من الفرع' : 'توصيل للعنوان الوطني';
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الهوية الوطنية بنجاح`,
        data: { 
          رقم_الطلب: `ID${Date.now().toString().slice(-6)}`,
          طريقة_الاستلام: delivery,
          الرسوم: "مجاني"
        },
        fees: 0
      };
    }

    case "issue_new_id": {
      return {
        status: "pending",
        message: `لإصدار هوية وطنية جديدة، يجب حضور ولي الأمر مع المستفيد إلى مكتب الأحوال المدنية`,
        data: { 
          المتطلبات: ["صورة شخصية", "شهادة الميلاد", "حضور ولي الأمر"],
          الرسوم: "مجاني"
        },
        fees: 0
      };
    }

    case "issue_family_record": {
      return {
        status: "success",
        message: `تم تقديم طلب إصدار سجل الأسرة بنجاح`,
        data: { 
          رقم_الطلب: `FR${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "قيد المراجعة"
        },
        fees: 0
      };
    }

    case "register_newborn": {
      const babyName = args.baby_name || "غير محدد";
      const babyGender = args.baby_gender === 'female' ? 'أنثى' : 'ذكر';
      const birthDate = args.birth_date || new Date().toLocaleDateString('ar-SA');
      
      // Add to family_members if userId provided
      if (userId && args.baby_name) {
        await supabaseClient.from('family_members').insert({
          user_id: userId,
          name: babyName,
          relationship: babyGender === 'أنثى' ? 'ابنة' : 'ابن',
          birth_date: args.birth_date || new Date().toISOString().split('T')[0],
          is_inside_kingdom: true
        });
      }
      
      return {
        status: "success",
        message: `تم تسجيل المولود "${babyName}" بنجاح`,
        data: { 
          رقم_الطلب: `NB${Date.now().toString().slice(-6)}`,
          اسم_المولود: babyName,
          الجنس: babyGender,
          تاريخ_الميلاد: birthDate,
          الرسوم: "مجاني",
          الحالة: "مكتمل"
        },
        fees: 0
      };
    }

    case "update_qualification": {
      return {
        status: "success",
        message: `تم تقديم طلب تعديل المؤهل الدراسي بنجاح`,
        data: { 
          رقم_الطلب: `UQ${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "قيد المراجعة"
        },
        fees: 0
      };
    }

    case "update_english_name": {
      return {
        status: "success",
        message: `تم تقديم طلب تعديل الاسم بالإنجليزية بنجاح`,
        data: { 
          رقم_الطلب: `EN${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "قيد المراجعة"
        },
        fees: 0
      };
    }

    case "renew_iqama": {
      const fees = 650;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الإقامة بنجاح`,
        data: { 
          رقم_الطلب: `IQ${Date.now().toString().slice(-6)}`,
          الرسوم: `${fees} ريال`,
          الحالة: "قيد المعالجة"
        },
        fees
      };
    }

    case "transfer_passport_info": {
      return {
        status: "success",
        message: `تم نقل معلومات الجواز بنجاح`,
        data: { 
          رقم_الطلب: `TP${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          الحالة: "مكتمل"
        },
        fees: 0
      };
    }

    case "exit_reentry_visa": {
      const fees = args.visa_type === 'multiple' ? 500 : 200;
      const type = args.visa_type === 'multiple' ? 'متعددة' : 'مفردة';
      return {
        status: "success",
        message: `تم إصدار تأشيرة خروج وعودة ${type} بنجاح`,
        data: { 
          رقم_التأشيرة: `ER${Date.now().toString().slice(-6)}`,
          النوع: type,
          الرسوم: `${fees} ريال`
        },
        fees
      };
    }

    case "final_exit_visa": {
      return {
        status: "success",
        message: `تم إصدار تأشيرة خروج نهائي بنجاح`,
        data: { 
          رقم_التأشيرة: `FE${Date.now().toString().slice(-6)}`,
          الرسوم: "مجاني",
          ملاحظة: "يجب المغادرة خلال 60 يوم"
        },
        fees: 0
      };
    }

    case "transfer_sponsorship": {
      const fees = 2000;
      return {
        status: "success",
        message: `تم تقديم طلب نقل الكفالة بنجاح`,
        data: { 
          رقم_الطلب: `TS${Date.now().toString().slice(-6)}`,
          الرسوم: `${fees} ريال`,
          الحالة: "بانتظار موافقة الكفيل الحالي"
        },
        fees
      };
    }

    case "search_knowledge": {
      const query = (args.query as string || '').toLowerCase();
      
      const { data: dbResults } = await supabaseClient
        .from('knowledge_base')
        .select('title, content, category')
        .limit(3);
      
      const relevantServices = SERVICES_KNOWLEDGE.filter(s => 
        s.name.includes(query) || 
        s.category.includes(query) || 
        query.includes(s.name) ||
        query.includes(s.category)
      );
      
      const results = [
        ...(dbResults || []),
        ...relevantServices.map(s => ({
          title: s.name,
          content: `الرسوم: ${s.fees}. الشروط: ${s.conditions}`,
          category: s.category
        }))
      ];
      
      return {
        status: "success",
        message: results.length > 0 ? "تم العثور على معلومات" : "لم يتم العثور على نتائج مطابقة",
        data: { results: results.slice(0, 5) },
        fees: 0
      };
    }

    default:
      return {
        status: "error",
        message: `الأداة ${toolName} غير معروفة`
      };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, tool, args, messages, attachments, userId } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Map tool names to valid categories
    const getValidCategory = (tool: string, providedCategory?: string): string => {
      // Valid categories from database constraint
      const validCategories = ['passports', 'traffic', 'civil_affairs', 'visas'];
      
      // If provided category is valid, use it
      if (providedCategory && validCategories.includes(providedCategory)) {
        return providedCategory;
      }
      
      // Map tool names to categories
      const toolCategoryMap: Record<string, string> = {
        // Traffic
        'check_fines': 'traffic',
        'pay_fine': 'traffic',
        'renew_license': 'traffic',
        'issue_license': 'traffic',
        'renew_vehicle_registration': 'traffic',
        'transfer_vehicle_ownership': 'traffic',
        'violation_objection': 'traffic',
        'add_vehicle_user': 'traffic',
        'remove_vehicle_user': 'traffic',
        // Civil Affairs
        'renew_id': 'civil_affairs',
        'issue_new_id': 'civil_affairs',
        'issue_family_record': 'civil_affairs',
        'register_newborn': 'civil_affairs',
        'update_qualification': 'civil_affairs',
        'update_english_name': 'civil_affairs',
        'update_profession': 'civil_affairs',
        'correct_marital_status': 'civil_affairs',
        'add_dependent': 'civil_affairs',
        // Passports
        'renew_passport': 'passports',
        'issue_passport': 'passports',
        'renew_iqama': 'passports',
        'exit_reentry_visa': 'passports',
        'final_exit_visa': 'passports',
        'transfer_sponsorship': 'passports',
        'issue_work_visa': 'passports',
        'book_appointment': 'civil_affairs', // Default to civil_affairs
        'search_knowledge': 'civil_affairs',
      };
      
      return toolCategoryMap[tool] || 'civil_affairs';
    };

    // Handle direct tool execution
    if (action === 'execute_tool' && tool) {
      const result = await executeTool(tool, args || {}, supabaseClient, userId);
      
    // Save to service_requests if userId provided
      if (userId) {
        const serviceName = body.serviceName || tool;
        const serviceCategory = getValidCategory(tool, body.serviceCategory);
        const requestStatus = result.status === 'success' ? 'completed' : (result.status === 'pending' ? 'pending' : 'processing');
        
        console.log('=== SAVING SERVICE REQUEST ===');
        console.log('userId:', userId);
        console.log('serviceName:', serviceName);
        console.log('serviceCategory:', serviceCategory);
        console.log('status:', requestStatus);
        
        try {
          const insertPayload = {
            user_id: userId,
            service_type: serviceName,
            service_category: serviceCategory,
            status: requestStatus,
            request_data: { 
              tool, 
              args: args || {}, 
              execution_type: 'auto', 
              payment_method: args?.payment_method || null 
            },
            result_data: result.data || null
          };
          
          console.log('Insert payload:', JSON.stringify(insertPayload));
          
          const { data: insertedData, error: insertError } = await supabaseClient
            .from('service_requests')
            .insert(insertPayload)
            .select()
            .single();
          
          if (insertError) {
            console.error('=== INSERT ERROR ===');
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            console.error('Error hint:', insertError.hint);
          } else {
            console.log('=== INSERT SUCCESS ===');
            console.log('Inserted ID:', insertedData?.id);
          }
        } catch (dbError) {
          console.error('=== DB EXCEPTION ===');
          console.error('Exception:', dbError);
        }
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build RAG context
    const servicesContext = SERVICES_KNOWLEDGE.map(s => 
      `- ${s.name} (${s.category}): الرسوم ${s.fees}، الشروط: ${s.conditions}`
    ).join('\n');

    // Build system prompt with RAG + Agent capabilities
    const systemPrompt = `أنت "سَنَد"، مساعد ذكي للخدمات الحكومية السعودية عبر منصة أبشر. لديك قدرتان رئيسيتان:

## 1. الإجابة على الأسئلة والاستفسارات (نظام RAG)
لديك معرفة شاملة عن الخدمات الحكومية التالية:

${servicesContext}

### أمثلة على الاستفسارات:
- "كم رسوم تجديد الجواز؟" → أجب: 300 ريال (5 سنوات) أو 600 ريال (10 سنوات)
- "ما شروط تجديد الرخصة؟" → أجب بالشروط من المعرفة
- "وين أقدر أجدد الهوية؟" → اشرح طريقة الوصول للخدمة
- "هل يحتاج فحص طبي؟" → أجب حسب الخدمة

## 2. تنفيذ الخدمات (نظام Agent)
عندما يطلب المستخدم تنفيذ خدمة (مثل: "جدد لي الرخصة"، "سجلني"، "نفذ الخدمة")، استخدم الأدوات:

### خدمات المرور:
- check_fines: استعلام المخالفات | pay_fine: دفع مخالفة
- renew_license: تجديد رخصة القيادة | issue_license: إصدار رخصة
- renew_vehicle_registration: تجديد استمارة | transfer_vehicle_ownership: نقل ملكية
- violation_objection: اعتراض على مخالفة

### خدمات الأحوال المدنية:
- renew_id: تجديد الهوية | issue_new_id: إصدار هوية جديدة
- issue_family_record: سجل الأسرة | register_newborn: تسجيل مولود

### خدمات الجوازات:
- renew_passport: تجديد الجواز | issue_passport: إصدار جواز
- renew_iqama: تجديد إقامة | exit_reentry_visa: خروج وعودة | final_exit_visa: خروج نهائي

### أخرى:
- book_appointment: حجز موعد | search_knowledge: بحث إضافي

## تعليمات مهمة جداً:
1. **فرّق بين الاستفسار والتنفيذ**:
   - استفسار = سؤال عن معلومات (أجب مباشرة من المعرفة)
   - تنفيذ = طلب إجراء خدمة (استخدم الأداة المناسبة)
   
2. **للاستفسارات**: أجب بشكل مباشر وواضح من المعرفة المتاحة أعلاه. لا تستخدم أي أداة.

3. **للتنفيذ**: 
   - إذا قال "جدد" أو "سجل" أو "نفذ" → استخدم الأداة
   - أكد نجاح العملية مع رقم الطلب والتفاصيل

4. **اللغة**: تحدث بالعربية بأسلوب ودود ومختصر
5. **الدقة**: أعطِ معلومات صحيحة عن الرسوم والشروط`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Handle image attachments
    if (attachments && attachments.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      const imageAttachments = attachments.filter((a: { type: string }) => a.type.startsWith('image/'));
      
      if (imageAttachments.length > 0) {
        lastMessage.content = [
          { type: "text", text: lastMessage.content || "ما هذا المستند؟" },
          ...imageAttachments.map((a: { url: string }) => ({
            type: "image_url",
            image_url: { url: a.url }
          }))
        ];
      }
    }

    // Call AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        tools: agentTools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "يرجى شحن الرصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiResult = await response.json();
    const aiMessage = aiResult.choices[0].message;
    
    // Handle tool calls
    const toolCalls: { name: string; result: unknown }[] = [];
    
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      for (const toolCall of aiMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");
        
        const result = await executeTool(toolName, toolArgs, supabaseClient, userId);
        toolCalls.push({ name: toolName, result });
        
        // Save to service_requests
        if (userId && toolName !== 'search_knowledge') {
          const serviceCategory = getValidCategory(toolName);
          console.log('Saving chat service request:', { userId, toolName, serviceCategory });
          
          const { error: insertError } = await supabaseClient.from('service_requests').insert({
            user_id: userId,
            service_type: toolName,
            service_category: serviceCategory,
            status: result.status === 'success' ? 'completed' : 'pending',
            request_data: { tool: toolName, args: toolArgs, execution_type: 'agent' },
            result_data: result.data || null
          });
          
          if (insertError) {
            console.error('Error saving chat service request:', insertError);
          } else {
            console.log('Chat service request saved successfully');
          }
        }
      }

      // Get final response after tool execution
      const toolMessages = toolCalls.map((tc, i) => ({
        role: "tool",
        tool_call_id: aiMessage.tool_calls[i].id,
        content: JSON.stringify(tc.result)
      }));

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [...aiMessages, aiMessage, ...toolMessages],
        }),
      });

      if (!finalResponse.ok) {
        throw new Error("Failed to get final response");
      }

      const finalResult = await finalResponse.json();
      return new Response(JSON.stringify({
        content: finalResult.choices[0].message.content,
        toolCalls
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      content: aiMessage.content,
      toolCalls: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in sanad-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
