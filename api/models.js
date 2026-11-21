// Liste de tous les modèles utilisables avec la clé (OpenRouter applique
// les réglages de confidentialité du compte quand la clé est fournie).
// Les familles ci-dessous sont seulement marquées « réputées peu bridées ».

const FAMILIES = [
  { label: 'Venice Uncensored', test: (id) => id.startsWith('venice/') || id.startsWith('cognitivecomputations/dolphin') },
  { label: 'Nous Hermes', test: (id) => id.startsWith('nousresearch/hermes') },
  { label: 'Grok', test: (id) => /^~?x-ai\/grok/.test(id) },
  { label: 'Mistral', test: (id) => /^mistralai\/(mistral-(large|medium|small|nemo)|mixtral)/.test(id) },
  { label: 'TheDrummer', test: (id) => id.startsWith('thedrummer/') },
  { label: 'Sao10K', test: (id) => id.startsWith('sao10k/') },
  { label: 'Magnum', test: (id) => id.startsWith('anthracite-org/') },
  { label: 'NeverSleep', test: (id) => id.startsWith('neversleep/') },
  { label: 'MythoMax', test: (id) => id.startsWith('gryphe/') },
];

const perMillion = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1e6 * 100) / 100 : null;
};

export function buildList(list) {
  const out = [];
  const seen = new Set();
  for (const m of list) {
    if (!m || typeof m.id !== 'string' || seen.has(m.id)) continue;
    if (m.id.endsWith(':batch')) continue; // variantes différées, inutilisables en chat
    const mods = m.architecture?.output_modalities;
    if (Array.isArray(mods) && !mods.includes('text')) continue; // image/audio
    seen.add(m.id);
    const p = m.pricing || {};
    const pin = perMillion(p.prompt);
    const pout = perMillion(p.completion);
    out.push({
      id: m.id,
      name: m.name || m.id,
      free: m.id.endsWith(':free') || (pin === 0 && pout === 0),
      pin,
      pout,
      peuBride: FAMILIES.some((f) => f.test(m.id)),
      created: m.created || 0,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  return out;
}

export default async function handler(req, res) {
  const url = 'https://openrouter.ai/api/v1/models';
  const key = process.env.OPENROUTER_API_KEY;
  try {
    let r = key ? await fetch(url, { headers: { Authorization: `Bearer ${key}` } }) : null;
    if (!r || !r.ok) r = await fetch(url); // repli : liste publique
    if (!r.ok) throw new Error(`OpenRouter a répondu ${r.status}`);
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    res.status(200).json({ models: buildList(json.data || []) });
  } catch (e) {
    res.status(502).json({ error: `Liste des modèles indisponible : ${e.message}`, models: [] });
  }
}
