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

    const analysisPrompt = `أنت وكيل متخصص في التحقق من صور أبشر (Absher Photo Verification Agent).

مهمتك: تحليل هذه الصورة بدقة عالية وفقاً للمعايير الرسمية لصور الهوية السعودية.

═══════════════════════════════════════════════════
📋 متطلبات صور أبشر الرسمية:
═══════════════════════════════════════════════════
1. **الأبعاد**: 480×640 بكسل (نسبة 4:6) أو 40×60 مم
2. **حجم الوجه**: يجب أن يشغل الوجه 70-80% من ارتفاع الصورة
3. **موضع الوجه**: الوجه في المنتصف تماماً، المسافة من أعلى الصورة للشعر حوالي 6%
4. **الأكتاف**: يجب أن تكون الأكتاف مرئية بوضوح (من الكتف وفوق)
5. **الرأس**: مستقيم بدون ميلان، النظر للكاميرا مباشرة
6. **الخلفية**: بيضاء نقية بدون أي ظلال أو أنماط
7. **الإضاءة**: متساوية بدون ظلال على الوجه
8. **النظارات**: ممنوعة تماماً
9. **التعبير**: محايد، الفم مغلق
10. **الجودة**: صورة حديثة (خلال 6 أشهر)، ملونة، واضحة
11. **صورة حقيقية**: ليست مولدة بالذكاء الاصطناعي

═══════════════════════════════════════════════════
📊 أرجع النتيجة بتنسيق JSON التالي بالضبط:
═══════════════════════════════════════════════════
{
  "analysis": {
    "face_visible": {"passed": true/false, "confidence": 0-100, "details": "هل الوجه واضح ومرئي بالكامل من الذقن للجبين"},
    "face_size": {"passed": true/false, "confidence": 0-100, "details": "هل الوجه يشغل 70-80% من ارتفاع الصورة"},
    "face_centered": {"passed": true/false, "confidence": 0-100, "details": "هل الوجه في منتصف الصورة"},
    "shoulders_visible": {"passed": true/false, "confidence": 0-100, "details": "هل الأكتاف مرئية بوضوح"},
    "head_straight": {"passed": true/false, "confidence": 0-100, "details": "هل الرأس مستقيم بدون ميلان"},
    "lighting": {"passed": true/false, "confidence": 0-100, "details": "هل الإضاءة متساوية بدون ظلال"},
    "background": {"passed": true/false, "confidence": 0-100, "details": "هل الخلفية بيضاء نقية"},
    "no_glasses": {"passed": true/false, "confidence": 0-100, "details": "هل الصورة بدون نظارات"},
    "neutral_expression": {"passed": true/false, "confidence": 0-100, "details": "هل التعبير محايد"},
    "proper_crop": {"passed": true/false, "confidence": 0-100, "details": "هل القص والأبعاد صحيحة 4:6"},
    "not_ai_generated": {"passed": true/false, "confidence": 0-100, "details": "هل هذه صورة حقيقية وليست مولدة"}
  },
  "reasoning_trace": [
    "1. تحليل الوجه: [ما تم اكتشافه]",
    "2. حجم الوجه: [النسبة المكتشفة] - [مقبول/غير مقبول]",
    "3. موضع الوجه: [في المنتصف/مائل لليمين/مائل لليسار]",
    "4. الأكتاف: [مرئية/غير مرئية]",
    "5. ميلان الرأس: [مستقيم/مائل بزاوية X درجة]",
    "6. الخلفية: [اللون والحالة]",
    "7. التحسينات الممكنة تلقائياً",
    "8. ما يحتاج تدخل المستخدم"
  ],
  "suggested_fixes": [
    {
      "type": "straighten",
      "description": "تعديل ميلان الصورة وجعلها مستقيمة",
      "auto_fixable": true
    },
    {
      "type": "crop_resize",
      "description": "قص الصورة بأبعاد 4:6 مع توسيط الوجه وضبط حجمه ل 70-80%",
      "auto_fixable": true
    },
    {
      "type": "background",
      "description": "تغيير الخلفية إلى اللون الأبيض النقي",
      "auto_fixable": true
    },
    {
      "type": "lighting",
      "description": "تحسين الإضاءة وإزالة الظلال",
      "auto_fixable": true
    }
  ],
  "user_actions_required": [
    "إزالة النظارات وإعادة التقاط الصورة",
    "تعديل وضعية الرأس للنظر مباشرة للكاميرا"
  ],
  "overall_confidence": 0-100,
  "verdict": "APPROVED" | "FIXABLE" | "NEEDS_USER_ACTION" | "REJECTED"
}

ملاحظات مهمة:
- كن دقيقاً جداً في تحديد ميلان الرأس - أي ميلان حتى البسيط يجب تصحيحه
- إذا كان الوجه لا يشغل 70-80% من الصورة، اذكر ذلك بوضوح
- تأكد من وجود الأكتاف في الصورة
- اذكر فقط الإصلاحات الممكنة فعلياً بناءً على مشاكل الصورة
- إذا كانت الصورة مقبولة، أرجع suggested_fixes كمصفوفة فارغة`;

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
  const fixInstructions: string[] = [];
  
  fixes.forEach(fix => {
    switch (fix) {
      case 'straighten':
        fixInstructions.push('- قم بتعديل ميلان الصورة لتكون مستقيمة تماماً (الرأس والعينين على خط أفقي مستوٍ)');
        break;
      case 'crop_resize':
        fixInstructions.push('- قص الصورة بنسبة 4:6 (عرض:ارتفاع)');
        fixInstructions.push('- اجعل الوجه في منتصف الصورة تماماً');
        fixInstructions.push('- اضبط حجم الوجه ليشغل 70-80% من ارتفاع الصورة');
        fixInstructions.push('- تأكد من ظهور الأكتاف في أسفل الصورة');
        fixInstructions.push('- اترك مسافة صغيرة (حوالي 6%) من أعلى الصورة للشعر');
        break;
      case 'background':
        fixInstructions.push('- غيّر الخلفية إلى لون أبيض نقي (#FFFFFF)');
        fixInstructions.push('- أزل أي ظلال أو أنماط من الخلفية');
        break;
      case 'lighting':
        fixInstructions.push('- حسّن الإضاءة لتكون متساوية على الوجه');
        fixInstructions.push('- أزل أي ظلال قوية');
        fixInstructions.push('- تأكد من وضوح ملامح الوجه');
        break;
    }
  });

  const editPrompt = `أنت خبير في تحرير صور الهوية الرسمية.

مهمتك: تعديل هذه الصورة لتتوافق مع متطلبات صور أبشر السعودية.

═══════════════════════════════════════════════════
📋 التعديلات المطلوبة:
═══════════════════════════════════════════════════
${fixInstructions.join('\n')}

═══════════════════════════════════════════════════
⚠️ قواعد مهمة جداً:
═══════════════════════════════════════════════════
- حافظ على هوية الشخص وملامحه الأصلية بدقة 100%
- لا تغير لون البشرة أو الشعر أو ملامح الوجه
- النتيجة النهائية يجب أن تكون صورة هوية رسمية احترافية
- الأبعاد النهائية: نسبة 4:6 (مثل 480×640 بكسل)
- الوجه يجب أن يكون في المنتصف ويشغل 70-80% من الارتفاع
- الأكتاف يجب أن تظهر في أسفل الصورة`;

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
