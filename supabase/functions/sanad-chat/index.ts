import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent tools definitions
const agentTools = [
  {
    type: "function",
    function: {
      name: "check_fines",
      description: "استعلام عن المخالفات المرورية للمستخدم",
      parameters: {
        type: "object",
        properties: {
          national_id: {
            type: "string",
            description: "رقم الهوية الوطنية"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pay_fine",
      description: "دفع مخالفة مرورية",
      parameters: {
        type: "object",
        properties: {
          fine_id: {
            type: "string",
            description: "رقم المخالفة"
          }
        },
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
        properties: {
          license_number: {
            type: "string",
            description: "رقم الرخصة"
          },
          duration_years: {
            type: "number",
            description: "مدة التجديد بالسنوات (5 أو 10)"
          }
        },
        required: ["duration_years"]
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
          service_type: {
            type: "string",
            description: "نوع الخدمة"
          },
          department: {
            type: "string",
            enum: ["passports", "traffic", "civil_affairs"],
            description: "الجهة الحكومية"
          },
          preferred_date: {
            type: "string",
            description: "التاريخ المفضل"
          }
        },
        required: ["service_type", "department"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "track_request",
      description: "تتبع حالة طلب سابق",
      parameters: {
        type: "object",
        properties: {
          request_number: {
            type: "string",
            description: "رقم الطلب"
          }
        },
        required: ["request_number"]
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
        properties: {
          passport_number: {
            type: "string",
            description: "رقم الجواز"
          },
          duration_years: {
            type: "number",
            description: "مدة الجواز الجديد (5 أو 10 سنوات)"
          }
        },
        required: ["duration_years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "issue_passport",
      description: "إصدار جواز سفر جديد",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "سبب الإصدار"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "renew_id",
      description: "تجديد الهوية الوطنية",
      parameters: {
        type: "object",
        properties: {
          delivery_type: {
            type: "string",
            enum: ["mail", "office"],
            description: "طريقة الاستلام"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "family_visit_visa",
      description: "إصدار تأشيرة زيارة عائلية",
      parameters: {
        type: "object",
        properties: {
          relative_name: {
            type: "string",
            description: "اسم القريب"
          },
          relationship: {
            type: "string",
            description: "صلة القرابة"
          },
          duration_months: {
            type: "number",
            description: "مدة التأشيرة بالأشهر"
          }
        },
        required: ["relative_name", "relationship", "duration_months"]
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
          visa_type: {
            type: "string",
            enum: ["single", "multiple"],
            description: "نوع التأشيرة (مفردة أو متعددة)"
          },
          duration_months: {
            type: "number",
            description: "مدة التأشيرة بالأشهر"
          }
        },
        required: ["visa_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "البحث في قاعدة المعرفة للحصول على معلومات عن الخدمات الحكومية",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "نص البحث"
          }
        },
        required: ["query"]
      }
    }
  }
];

// Execute agent tool
async function executeTool(toolName: string, args: Record<string, unknown>, supabaseClient: ReturnType<typeof createClient>): Promise<{ status: string; message: string; data?: unknown }> {
  console.log(`Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case "check_fines": {
      // Simulate checking fines
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
      const fees = args.duration_years === 10 ? 160 : 80;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الرخصة لمدة ${args.duration_years} سنوات. الرسوم المطلوبة: ${fees} ريال. سيتم إرسال الرخصة الجديدة لعنوانك الوطني.`,
        data: { request_number: `LR${Date.now()}`, fees, duration: args.duration_years }
      };
    }

    case "book_appointment": {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 7);
      const dateStr = appointmentDate.toLocaleDateString('ar-SA');
      return {
        status: "success",
        message: `تم حجز موعد بنجاح في ${args.department === 'passports' ? 'الجوازات' : args.department === 'traffic' ? 'المرور' : 'الأحوال المدنية'} يوم ${dateStr} الساعة 9:00 صباحاً. رقم الحجز: A${Date.now().toString().slice(-6)}`,
        data: { 
          appointment_number: `A${Date.now().toString().slice(-6)}`,
          date: dateStr,
          time: "09:00",
          department: args.department
        }
      };
    }

    case "track_request": {
      return {
        status: "success",
        message: `الطلب رقم ${args.request_number}: قيد المعالجة. المرحلة الحالية: مراجعة المستندات. الوقت المتوقع للانتهاء: 3-5 أيام عمل.`,
        data: { 
          request_number: args.request_number,
          status: "processing",
          stage: "document_review",
          estimated_completion: "3-5 أيام"
        }
      };
    }

    case "renew_passport": {
      const fees = args.duration_years === 10 ? 600 : 300;
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الجواز لمدة ${args.duration_years} سنوات. الرسوم: ${fees} ريال. رقم الطلب: P${Date.now().toString().slice(-6)}. سيتم إرسال الجواز الجديد عبر البريد.`,
        data: { 
          request_number: `P${Date.now().toString().slice(-6)}`,
          fees,
          duration: args.duration_years
        }
      };
    }

    case "issue_passport": {
      return {
        status: "pending",
        message: `لإصدار جواز سفر جديد، يرجى حجز موعد في الجوازات وإحضار: الهوية الوطنية، صور شخصية بخلفية بيضاء. هل تريد حجز موعد الآن؟`,
        data: { 
          requirements: ["الهوية الوطنية", "صور شخصية بخلفية بيضاء", "حضور شخصي"],
          fees: 300
        }
      };
    }

    case "renew_id": {
      return {
        status: "success",
        message: `تم تقديم طلب تجديد الهوية الوطنية. الرسوم: 100 ريال. ${args.delivery_type === 'mail' ? 'سيتم إرسالها لعنوانك الوطني' : 'يمكنك استلامها من مكتب الأحوال المدنية'}. رقم الطلب: ID${Date.now().toString().slice(-6)}`,
        data: {
          request_number: `ID${Date.now().toString().slice(-6)}`,
          fees: 100,
          delivery: args.delivery_type || 'mail'
        }
      };
    }

    case "family_visit_visa": {
      const fees = (args.duration_months as number || 1) * 300;
      return {
        status: "success",
        message: `تم تقديم طلب تأشيرة زيارة عائلية لـ ${args.relative_name} (${args.relationship}) لمدة ${args.duration_months} شهر. الرسوم: ${fees} ريال. رقم الطلب: V${Date.now().toString().slice(-6)}`,
        data: {
          request_number: `V${Date.now().toString().slice(-6)}`,
          fees,
          duration: args.duration_months,
          relative: args.relative_name
        }
      };
    }

    case "exit_reentry_visa": {
      const fees = args.visa_type === 'multiple' ? 500 : 200;
      return {
        status: "success",
        message: `تم إصدار تأشيرة خروج وعودة ${args.visa_type === 'multiple' ? 'متعددة' : 'مفردة'}. الرسوم: ${fees} ريال. صالحة لمدة ${args.duration_months || 2} شهر.`,
        data: {
          visa_number: `ER${Date.now().toString().slice(-6)}`,
          type: args.visa_type,
          fees,
          valid_until: new Date(Date.now() + (args.duration_months as number || 2) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')
        }
      };
    }

    case "search_knowledge": {
      // Search in knowledge base
      const { data: results } = await supabaseClient
        .from('knowledge_base')
        .select('title, content, category')
        .textSearch('content', args.query as string, { type: 'websearch', config: 'arabic' })
        .limit(3);
      
      if (results && results.length > 0) {
        return {
          status: "success",
          message: "تم العثور على معلومات ذات صلة",
          data: { results }
        };
      } else {
        // Fallback: simple keyword search
        const { data: fallbackResults } = await supabaseClient
          .from('knowledge_base')
          .select('title, content, category')
          .limit(5);
        
        return {
          status: "success", 
          message: "معلومات عامة عن الخدمات",
          data: { results: fallbackResults || [] }
        };
      }
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
    const { messages, attachments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for knowledge base
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Build system prompt
    const systemPrompt = `أنت "سَنَد"، مساعد ذكي للخدمات الحكومية السعودية. مهمتك مساعدة المواطنين في:

1. **الإجابة على الأسئلة**: استخدم أداة search_knowledge للبحث في قاعدة المعرفة وتقديم معلومات دقيقة عن الخدمات.

2. **تنفيذ الخدمات**: عندما يطلب المستخدم خدمة، استخدم الأداة المناسبة لتنفيذها:
   - check_fines: للاستعلام عن المخالفات المرورية
   - pay_fine: لدفع مخالفة
   - renew_license: لتجديد رخصة القيادة
   - book_appointment: لحجز موعد
   - renew_passport: لتجديد الجواز
   - renew_id: لتجديد الهوية الوطنية
   - family_visit_visa: لإصدار تأشيرة زيارة عائلية
   - exit_reentry_visa: لإصدار تأشيرة خروج وعودة

3. **فهم الصور**: إذا أرسل المستخدم صورة لمخالفة أو مستند، حاول فهم محتواها ومساعدته.

**تعليمات مهمة:**
- تحدث بالعربية الفصحى بأسلوب ودود ومهني
- قدم معلومات دقيقة ومحدثة
- اسأل عن التفاصيل الناقصة قبل تنفيذ الخدمة
- أكد للمستخدم نجاح العملية وقدم رقم المرجع
- إذا لم تعرف الإجابة، اعترف بذلك واقترح التواصل مع الجهة المختصة`;

    // Prepare messages for AI
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

    // Call Lovable AI Gateway
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
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      
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
        
        const result = await executeTool(toolName, toolArgs, supabaseClient);
        toolCalls.push({ name: toolName, result });
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
          messages: [
            ...aiMessages,
            aiMessage,
            ...toolMessages
          ],
        }),
      });

      if (!finalResponse.ok) {
        throw new Error("Failed to get final response");
      }

      const finalResult = await finalResponse.json();
      const finalContent = finalResult.choices[0].message.content;

      return new Response(JSON.stringify({
        content: finalContent,
        toolCalls
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tool calls, return direct response
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
