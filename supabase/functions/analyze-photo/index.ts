import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

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

    console.log('Analyzing photo for Absher requirements...');

    const prompt = `أنت محلل صور متخصص لمنصة أبشر السعودية. قم بتحليل هذه الصورة الشخصية وتقييمها وفقاً لشروط أبشر التالية:

1. خلفية بيضاء: هل الخلفية بيضاء نقية؟
2. الرأس مستقيم: هل الرأس في وضع مستقيم غير مائل؟
3. الوجه في المنتصف: هل الوجه في منتصف الصورة؟
4. حجم الوجه مناسب: هل حجم الوجه تقريباً 70% من ارتفاع الصورة؟
5. إضاءة جيدة: هل الإضاءة واضحة بدون ظلال على الوجه؟
6. بدون فلاتر: هل الصورة طبيعية بدون فلاتر أو تعديلات مصطنعة؟
7. ليست صورة AI: هل تبدو كصورة حقيقية وليست مولدة بالذكاء الاصطناعي؟

قم بإرجاع النتيجة بتنسيق JSON التالي بالضبط (بدون أي نص إضافي):
{
  "whiteBackground": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "straightHead": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "centeredFace": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "faceSize": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "goodLighting": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "noFilters": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "notAiGenerated": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة قصيرة"},
  "overallScore": 0-100,
  "recommendation": "توصية نهائية"
}`;

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
              { type: "text", text: prompt },
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

    console.log('AI Response:', content);

    // Parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
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
      JSON.stringify({ success: true, analysis: analysisResult }),
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
