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
      name: "renew_iqama",
      description: "تجديد إقامة للمقيم",
      parameters: {
        type: "object",
        properties: { iqama_number: { type: "string", description: "رقم الإقامة" } },
        required: []
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
async function executeTool(toolName: string, args: Record<string, unknown>, supabaseClient: any, userId?: string): Promise<{ status: string; message: string; data?: unknown }> {
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
        data: { fines, total }
      };
    }

    case "pay_fine": {
      return {
        status: "success",
        message: `تم دفع المخالفة رقم ${args.fine_id} بنجاح. سيتم إرسال إيصال الدفع عبر الرسائل النصية.`,
        data: { fine_id: args.fine_id, paid: true, receipt_number: `R${Date.now()}` }
      };
    }

    case "renew_license": {
      const duration = Number(args.duration_years) || 5;
      const fees = duration * 40;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الرخصة لمدة ${duration} سنوات. الرسوم: ${fees} ريال. سيتم إرسال الرخصة لعنوانك الوطني.`,
        data: { request_number: `LR${Date.now().toString().slice(-6)}`, fees, duration }
      };
    }

    case "issue_license": {
      return {
        status: "pending",
        message: `لإصدار رخصة قيادة جديدة، يجب اجتياز التدريب في مدرسة قيادة معتمدة. الرسوم: 100-400 ريال حسب نوع الرخصة.`,
        data: { requirements: ["فحص طبي", "فحص نظري", "فحص عملي", "إتمام الساعات التدريبية"] }
      };
    }

    case "renew_vehicle_registration": {
      return {
        status: "success",
        message: `تم تجديد رخصة سير المركبة. الرسوم: 100 ريال. رقم الطلب: VR${Date.now().toString().slice(-6)}`,
        data: { request_number: `VR${Date.now().toString().slice(-6)}`, fees: 100 }
      };
    }

    case "transfer_vehicle_ownership": {
      return {
        status: "success",
        message: `تم تقديم طلب نقل ملكية المركبة. الرسوم: 230 ريال. سيتم إشعار المشتري لتأكيد العملية.`,
        data: { request_number: `TO${Date.now().toString().slice(-6)}`, fees: 230 }
      };
    }

    case "violation_objection": {
      return {
        status: "success",
        message: `تم تقديم اعتراض على المخالفة رقم ${args.violation_number}. سيتم مراجعة الاعتراض خلال 30 يوم عمل.`,
        data: { objection_number: `OB${Date.now().toString().slice(-6)}`, violation: args.violation_number }
      };
    }

    case "book_appointment": {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 7);
      const dateStr = appointmentDate.toLocaleDateString('ar-SA');
      const deptName = args.department === 'passports' ? 'الجوازات' : args.department === 'traffic' ? 'المرور' : 'الأحوال المدنية';
      
      // Save appointment to database if userId provided
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
        message: `تم حجز موعد في ${deptName} يوم ${dateStr} الساعة 9:00 صباحاً.`,
        data: { appointment_number: `A${Date.now().toString().slice(-6)}`, date: dateStr, time: "09:00" }
      };
    }

    case "renew_passport": {
      const duration = Number(args.duration_years) || 5;
      const fees = duration === 10 ? 600 : 300;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الجواز لمدة ${duration} سنوات. الرسوم: ${fees} ريال. سيتم إرسال الجواز عبر البريد.`,
        data: { request_number: `P${Date.now().toString().slice(-6)}`, fees, duration }
      };
    }

    case "issue_passport": {
      return {
        status: "pending",
        message: `لإصدار جواز سفر جديد، يرجى حجز موعد في الجوازات. المتطلبات: الهوية الوطنية، صور شخصية بخلفية بيضاء.`,
        data: { requirements: ["الهوية الوطنية", "صور شخصية بخلفية بيضاء"], fees: 300 }
      };
    }

    case "renew_id": {
      const delivery = args.delivery_type === 'office' ? 'استلام من الفرع' : 'توصيل للعنوان الوطني';
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الهوية الوطنية. ${delivery}. مجاني.`,
        data: { request_number: `ID${Date.now().toString().slice(-6)}`, delivery, fees: 0 }
      };
    }

    case "issue_new_id": {
      return {
        status: "pending",
        message: `لإصدار هوية وطنية جديدة، يجب حضور ولي الأمر مع المستفيد إلى مكتب الأحوال المدنية. مجاني.`,
        data: { requirements: ["صورة شخصية", "شهادة الميلاد", "حضور ولي الأمر"], fees: 0 }
      };
    }

    case "renew_iqama": {
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الإقامة. الرسوم: 650 ريال. رقم الطلب: IQ${Date.now().toString().slice(-6)}`,
        data: { request_number: `IQ${Date.now().toString().slice(-6)}`, fees: 650 }
      };
    }

    case "exit_reentry_visa": {
      const fees = args.visa_type === 'multiple' ? 500 : 200;
      const type = args.visa_type === 'multiple' ? 'متعددة' : 'مفردة';
      return {
        status: "success",
        message: `تم إصدار تأشيرة خروج وعودة ${type}. الرسوم: ${fees} ريال.`,
        data: { visa_number: `ER${Date.now().toString().slice(-6)}`, type, fees }
      };
    }

    case "final_exit_visa": {
      return {
        status: "success",
        message: `تم إصدار تأشيرة خروج نهائي. مجاني. يجب المغادرة خلال 60 يوم.`,
        data: { visa_number: `FE${Date.now().toString().slice(-6)}`, fees: 0 }
      };
    }

    case "search_knowledge": {
      const query = (args.query as string || '').toLowerCase();
      
      // Search in database first
      const { data: dbResults } = await supabaseClient
        .from('knowledge_base')
        .select('title, content, category')
        .limit(3);
      
      // Also search in embedded knowledge
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
        data: { results: results.slice(0, 5) }
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
    
    // Handle direct tool execution
    if (action === 'execute_tool' && tool) {
      const result = await executeTool(tool, args || {}, supabaseClient, userId);
      
      // Save to service_requests if userId provided
      if (userId && result.status !== 'error') {
        await supabaseClient.from('service_requests').insert({
          user_id: userId,
          service_type: tool,
          service_category: 'direct',
          status: result.status === 'success' ? 'completed' : 'pending',
          request_data: { tool, args, execution_type: 'agent' },
          result_data: result.data || null
        });
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
    const systemPrompt = `أنت "سَنَد"، مساعد ذكي للخدمات الحكومية السعودية. لديك قدرتان رئيسيتان:

## 1. الإجابة على الأسئلة (RAG)
عند سؤال المستخدم عن معلومات أو استفسارات، استخدم المعرفة التالية:

${servicesContext}

## 2. تنفيذ الخدمات (Agent)
عند طلب المستخدم تنفيذ خدمة، استخدم الأداة المناسبة:
- check_fines: للاستعلام عن المخالفات المرورية
- pay_fine: لدفع مخالفة
- renew_license: لتجديد رخصة القيادة
- issue_license: لإصدار رخصة قيادة
- renew_vehicle_registration: لتجديد استمارة المركبة
- transfer_vehicle_ownership: لنقل ملكية مركبة
- violation_objection: للاعتراض على مخالفة
- book_appointment: لحجز موعد
- renew_passport: لتجديد الجواز
- issue_passport: لإصدار جواز جديد
- renew_id: لتجديد الهوية الوطنية
- issue_new_id: لإصدار هوية جديدة
- renew_iqama: لتجديد الإقامة
- exit_reentry_visa: لتأشيرة خروج وعودة
- final_exit_visa: لتأشيرة خروج نهائي
- search_knowledge: للبحث عن معلومات إضافية

## تعليمات مهمة:
- حدد نوع الطلب: استفسار أو تنفيذ خدمة
- للاستفسارات: أجب من المعرفة المتاحة مباشرة
- للتنفيذ: استخدم الأداة المناسبة
- تحدث بالعربية الفصحى بأسلوب ودود
- اسأل عن التفاصيل الناقصة قبل التنفيذ
- أكد نجاح العملية مع رقم المرجع`;

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
          await supabaseClient.from('service_requests').insert({
            user_id: userId,
            service_type: toolName,
            service_category: 'chat',
            status: result.status === 'success' ? 'completed' : 'pending',
            request_data: { tool: toolName, args: toolArgs, execution_type: 'agent' },
            result_data: result.data || null
          });
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
