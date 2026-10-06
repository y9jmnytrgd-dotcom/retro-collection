const ALLOWED_ORIGIN = "https://sebastienpic.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" }
  });
}
function extractJson(text) {
  if (!text) return null;
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) { try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {} }
  return null;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, {status:204, headers:corsHeaders(origin)});
    if (request.method === "GET") return json({ok:true, service:"Retro Collection IA"}, 200, origin);
    if (request.method !== "POST") return json({error:"Méthode non autorisée"},405,origin);
    if (origin && origin !== ALLOWED_ORIGIN) return json({error:"Origine non autorisée"},403,origin);
    if (!env.OPENAI_API_KEY) return json({error:"Le secret OPENAI_API_KEY est absent du Worker."},500,origin);

    try {
      const body = await request.json();
      const image = body?.image;
      if (typeof image !== "string" || !image.startsWith("data:image/"))
        return json({error:"La photo reçue est invalide."},400,origin);

      const response = await fetch("https://api.openai.com/v1/responses", {
        method:"POST",
        headers:{
          "Authorization":`Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"gpt-4o-mini",
          input:[{role:"user",content:[
            {type:"input_text",text:`Identifie précisément le jeu vidéo visible sur la photo.
Réponds UNIQUEMENT avec un objet JSON valide contenant :
title, platform, year, edition, confidence.
N'invente jamais une information. Si elle n'est pas lisible ou certaine, mets une chaîne vide.
confidence doit être un nombre entre 0 et 1.`},
            {type:"input_image",image_url:image,detail:"high"}
          ]}],
          max_output_tokens:300
        })
      });

      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch {}
      if (!response.ok) {
        return json({error:result?.error?.message || `OpenAI a répondu HTTP ${response.status}`},502,origin);
      }

      const text = result.output_text ||
        result.output?.flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n") || "";
      const data = extractJson(text);
      if (!data) return json({error:"OpenAI a répondu, mais le résultat n'est pas exploitable.",debug:text.slice(0,500)},502,origin);

      return json({
        title:typeof data.title==="string"?data.title:"",
        platform:typeof data.platform==="string"?data.platform:"",
        year:data.year ?? "",
        edition:typeof data.edition==="string"?data.edition:"",
        confidence:Number.isFinite(Number(data.confidence))?Number(data.confidence):""
      },200,origin);
    } catch (error) {
      return json({error:`Erreur Worker : ${error?.message || "inconnue"}`},500,origin);
    }
  }
};