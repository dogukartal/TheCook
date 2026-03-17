// Supabase Edge Function: sefim-ask
// Proxies cooking questions to OpenAI with recipe context.
// Deployed via: supabase functions deploy sefim-ask

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SefimContext {
  recipeName: string;
  totalSteps: number;
  currentStepIndex: number;
  currentStepInstruction: string;
  currentStepWhy: string;
  currentStepCommonMistake: string;
  currentStepRecovery: string;
  userSkillLevel: string;
  ingredientSwaps: Record<string, string>;
  servingMultiplier: number;
  checkpoint: string | null;
  warning: string | null;
}

interface RequestBody {
  question: string;
  context: SefimContext;
}

const FALLBACK_ANSWER = "Bir sorun olustu, tekrar dene";

function buildSystemPrompt(ctx: SefimContext): string {
  const swapLines = Object.entries(ctx.ingredientSwaps)
    .map(([original, replacement]) => `  ${original} -> ${replacement}`)
    .join("\n");

  return `Sen Sef'im adinda bir asci yardimcisisin. Kullaniciya mutfakta yardim ediyorsun.

Tarif: ${ctx.recipeName}
Adim ${ctx.currentStepIndex + 1}/${ctx.totalSteps}: ${ctx.currentStepInstruction}
Neden: ${ctx.currentStepWhy}
Sik yapilan hata: ${ctx.currentStepCommonMistake}
Kurtarma: ${ctx.currentStepRecovery}
${ctx.checkpoint ? `Kontrol noktasi: ${ctx.checkpoint}` : ""}
${ctx.warning ? `Uyari: ${ctx.warning}` : ""}
Kullanici seviyesi: ${ctx.userSkillLevel}
Porsiyon carpani: ${ctx.servingMultiplier}x
${swapLines ? `Malzeme degisiklikleri:\n${swapLines}` : ""}

Kurallar:
- Sadece yemek ve mutfakla ilgili sorulari yanitla.
- Konu disi sorularda nazikce "Ben sadece mutfak konularinda yardimci olabilirim" de.
- Kisa, samimi ve profesyonel yanitlar ver.
- Turkce yanitla.`;
}

Deno.serve(async (req: Request) => {
  try {
    const { question, context } = (await req.json()) as RequestBody;

    if (!question || !context) {
      return new Response(
        JSON.stringify({ answer: FALLBACK_ANSWER }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY not set");
      return new Response(
        JSON.stringify({ answer: FALLBACK_ANSWER }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(context);

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 300,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
        }),
      }
    );

    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", openaiResponse.status);
      return new Response(
        JSON.stringify({ answer: FALLBACK_ANSWER }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ?? FALLBACK_ANSWER;

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sefim-ask error:", error);
    return new Response(
      JSON.stringify({ answer: FALLBACK_ANSWER }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
