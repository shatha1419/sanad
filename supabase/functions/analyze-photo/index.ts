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

    const prompt = `أنت خبير متخصص في كشف الصور المزيفة والمولدة بالذكاء الاصطناعي، ومحلل صور رسمي لمنصة أبشر السعودية.

مهمتك: تحليل هذه الصورة بدقة عالية جداً وفقاً للمعايير التالية:

═══════════════════════════════════════════════════
📋 الشروط الأساسية لصور أبشر:
═══════════════════════════════════════════════════
1. خلفية بيضاء: يجب أن تكون الخلفية بيضاء نقية 100% بدون أي ألوان أو عناصر أخرى
2. الرأس مستقيم: الرأس في وضع مستقيم تماماً، غير مائل لأي جهة
3. الوجه في المنتصف: الوجه يجب أن يكون في منتصف الصورة بالضبط
4. حجم الوجه مناسب: حجم الوجه تقريباً 70% من ارتفاع الصورة
5. إضاءة جيدة: إضاءة طبيعية واضحة، بدون ظلال قوية على الوجه

═══════════════════════════════════════════════════
🔍 كشف الاحتيال والتزييف (مهم جداً - كن صارماً):
═══════════════════════════════════════════════════
6. بدون فلاتر أو تعديلات: ابحث عن:
   - فلاتر التجميل (تنعيم البشرة المبالغ فيه، تكبير العيون، تصغير الأنف)
   - تعديلات FaceTune أو تطبيقات مشابهة
   - ألوان غير طبيعية للبشرة
   - حدود غير طبيعية حول الوجه
   - تشويش مقصود لإخفاء العيوب

7. ليست صورة AI (كن صارماً جداً هنا): ابحث عن هذه العلامات:
   - ✗ بشرة ناعمة جداً "بلاستيكية" بدون أي مسام أو تفاصيل
   - ✗ عيون لامعة بشكل غير طبيعي أو انعكاسات غريبة في العين
   - ✗ شعر مدمج مع الخلفية أو خصلات غير منطقية
   - ✗ أسنان مثالية جداً بدون أي عيوب
   - ✗ تماثل مثالي للوجه (الوجوه الحقيقية غير متماثلة)
   - ✗ إضاءة غير متسقة على أجزاء مختلفة من الوجه
   - ✗ تفاصيل الأذن أو الرقبة غير واضحة أو مشوهة
   - ✗ خلفية "مثالية جداً" أو ضبابية مصطنعة
   - ✗ ملمس البشرة متجانس بشكل غير طبيعي
   - ✗ حواجب مرسومة بشكل مثالي جداً
   - ✗ ظلال غير منطقية أو غياب الظلال تحت الأنف والشفاه
   - ✗ أي شعور بأن الصورة "كاملة جداً" أو "مثالية جداً"

⚠️ تحذير: إذا وجدت علامتين أو أكثر من علامات AI، اعتبر الصورة مولدة بالذكاء الاصطناعي!

═══════════════════════════════════════════════════
📊 أرجع النتيجة بتنسيق JSON التالي بالضبط:
═══════════════════════════════════════════════════
{
  "whiteBackground": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة مختصرة"},
  "straightHead": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة مختصرة"},
  "centeredFace": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة مختصرة"},
  "faceSize": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة مختصرة"},
  "goodLighting": {"passed": true/false, "percentage": 0-100, "note": "ملاحظة مختصرة"},
  "noFilters": {"passed": true/false, "percentage": 0-100, "note": "اذكر نوع الفلتر أو التعديل إن وجد"},
  "notAiGenerated": {"passed": true/false, "percentage": 0-100, "note": "اذكر علامات AI التي وجدتها إن وجدت"},
  "overallScore": 0-100,
  "recommendation": "توصية نهائية مع ذكر المشاكل الرئيسية"
}

ملاحظة: كن صارماً جداً في تقييم الصور. إذا شككت في أي شيء، اعتبره فاشلاً. الأفضل رفض صورة حقيقية من قبول صورة مزيفة.`;

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
