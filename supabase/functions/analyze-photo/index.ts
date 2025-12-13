import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  imageBase64: string;
  action?: 'analyze' | 'apply_fixes';
  selectedFixes?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, action = 'analyze', selectedFixes = [] }: AnalysisRequest = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'الصورة مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (action === 'apply_fixes') {
      console.log('Applying fixes to photo:', selectedFixes);
      return await applyFixes(imageBase64, selectedFixes, LOVABLE_API_KEY);
    }

    console.log('Analyzing photo for Absher requirements...');

    const analysisPrompt = `أنت وكيل تحقق من صور أبشر (Absher Photo Verification Agent).

مهمتك: تحليل هذه الصورة بدقة عالية وإرجاع تحليل هيكلي منظم.

═══════════════════════════════════════════════════
📋 معايير صور أبشر المطلوبة:
═══════════════════════════════════════════════════
1. الوجه واضح ومرئي بالكامل
2. إضاءة مناسبة بدون ظلال قوية
3. خلفية بيضاء أو فاتحة
4. بدون نظارات أو غطاء رأس (للرجال)
5. تعبير محايد للوجه
6. الرأس مستقيم غير مائل
7. قص وحجم مناسب للصورة

═══════════════════════════════════════════════════
📊 أرجع النتيجة بتنسيق JSON التالي بالضبط:
═══════════════════════════════════════════════════
{
  "analysis": {
    "face_visible": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "lighting": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "background": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "no_glasses": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "neutral_expression": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "head_straight": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "proper_crop": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"},
    "not_ai_generated": {"passed": true/false, "confidence": 0-100, "details": "تفاصيل"}
  },
  "reasoning_trace": [
    "خطوة التفكير 1: ما تم اكتشافه",
    "خطوة التفكير 2: ما هو ناقص أو غير صحيح",
    "خطوة التفكير 3: ما يمكن إصلاحه تلقائياً",
    "خطوة التفكير 4: ما يحتاج تدخل المستخدم"
  ],
  "suggested_fixes": [
    {
      "type": "lighting",
      "description": "تحسين السطوع والتباين تلقائياً",
      "auto_fixable": true
    },
    {
      "type": "background",
      "description": "تغيير الخلفية إلى اللون الأبيض",
      "auto_fixable": true
    },
    {
      "type": "crop",
      "description": "قص الصورة بالحجم المناسب",
      "auto_fixable": true
    }
  ],
  "user_actions_required": [
    "إزالة النظارات وإعادة التقاط الصورة",
    "تعديل وضعية الرأس"
  ],
  "overall_confidence": 0-100,
  "verdict": "APPROVED" | "FIXABLE" | "NEEDS_USER_ACTION" | "REJECTED"
}

ملاحظات مهمة:
- اذكر فقط الإصلاحات الممكنة فعلياً بناءً على مشاكل الصورة
- إذا كانت الصورة مقبولة، أرجع suggested_fixes كمصفوفة فارغة
- كن واقعياً في تحديد ما يمكن إصلاحه تلقائياً`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'يرجى شحن الرصيد للاستمرار' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI Analysis Response:', content);

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في تحليل نتائج الذكاء الاصطناعي' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing photo:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function applyFixes(imageBase64: string, fixes: string[], apiKey: string) {
  const fixDescriptions = fixes.map(fix => {
    switch (fix) {
      case 'lighting': return 'تحسين السطوع والتباين';
      case 'background': return 'تغيير الخلفية إلى أبيض نقي';
      case 'crop': return 'قص الصورة بالأبعاد المناسبة لأبشر';
      default: return fix;
    }
  }).join('، ');

  const editPrompt = `قم بتعديل هذه الصورة الشخصية لتتوافق مع متطلبات أبشر:
${fixDescriptions}

مهم جداً:
- حافظ على الوجه والملامح الأصلية
- لا تغير هوية الشخص
- اجعل الخلفية بيضاء نقية إذا طُلب ذلك
- حسّن الإضاءة بشكل طبيعي`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: editPrompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image edit error:', response.status, errorText);
      throw new Error(`Failed to edit image: ${response.status}`);
    }

    const data = await response.json();
    const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!editedImageUrl) {
      throw new Error('No edited image returned');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        editedImage: editedImageUrl,
        appliedFixes: fixes 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error applying fixes:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'فشل في تطبيق التعديلات' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
