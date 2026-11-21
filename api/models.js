// Liste des modèles proposés : récupérée en direct sur OpenRouter,
// puis filtrée sur les familles réputées les moins bridées.
// Pour ajouter/retirer une famille : modifier FAMILIES ci-dessous.

const FAMILIES = [
  { label: 'Venice Uncensored (Dolphin)', test: (id) => id.startsWith('venice/') || id.startsWith('cognitivecomputations/dolphin') },
  { label: 'Nous Hermes', test: (id) => id.startsWith('nousresearch/hermes') },
  { label: 'Grok (xAI)', test: (id) => /^~?x-ai\/grok/.test(id) },
  { label: 'Mistral', test: (id) => /^mistralai\/(mistral-(large|medium|small|nemo)|mixtral)/.test(id) },
  { label: 'TheDrummer (Cydonia, Rocinante…)', test: (id) => id.startsWith('thedrummer/') },
  { label: 'Sao10K (Euryale…)', test: (id) => id.startsWith('sao10k/') },
  { label: 'Magnum (Anthracite)', test: (id) => id.startsWith('anthracite-org/') },
  { label: 'NeverSleep (Lumimaid…)', test: (id) => id.startsWith('neversleep/') },
  { label: 'MythoMax (Gryphe)', test: (id) => id.startsWith('gryphe/') },
];

export function groupModels(list) {
  const groups = FAMILIES.map((f) => ({ family: f.label, models: [] }));
  for (const m of list) {
    if (!m || typeof m.id !== 'string') continue;
    if (m.id.endsWith(':batch')) continue; // variantes différées, inutilisables en chat
    const out = m.architecture?.output_modalities;
    if (Array.isArray(out) && !out.includes('text')) continue; // ignore image/audio
    const i = FAMILIES.findIndex((f) => f.test(m.id));
    if (i === -1) continue;
    const p = m.pricing || {};
    groups[i].models.push({
      id: m.id,
      name: m.name || m.id,
      free: m.id.endsWith(':free') || (Number(p.prompt) === 0 && Number(p.completion) === 0),
      created: m.created || 0,
    });
  }
  for (const g of groups) g.models.sort((a, b) => b.created - a.created);
  return groups.filter((g) => g.models.length > 0);
}

export default async function handler(req, res) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models');
    if (!r.ok) throw new Error(`OpenRouter a répondu ${r.status}`);
    const json = await r.json();
    const groups = groupModels(json.data || []);
    // Cache 1 h sur le CDN Vercel : la page reste rapide
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ groups });
  } catch (e) {
    res.status(502).json({ error: `Liste des modèles indisponible : ${e.message}`, groups: [] });
  }
}
