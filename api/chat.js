// Relais vers OpenRouter : la clé reste côté serveur (variable Vercel),
// la réponse est renvoyée en direct (streaming) au navigateur.
// Rien n'est enregistré : l'historique vit uniquement dans la page.

const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Méthode non autorisée');

  const password = process.env.ACCESS_PASSWORD;
  if (password && req.headers['x-access-password'] !== password) {
    return sendError(res, 401, 'Mot de passe incorrect');
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return sendError(res, 500, 'Variable OPENROUTER_API_KEY absente dans Vercel');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((m) => m && ALLOWED_ROLES.has(m.role) && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-100)
    : [];
  if (!model || messages.length === 0) return sendError(res, 400, 'Modèle ou message manquant');

  // Si l'utilisateur clique « Stop » ou ferme la page, on coupe aussi l'appel OpenRouter
  const controller = new AbortController();
  res.on('close', () => { if (!res.writableFinished) controller.abort(); });

  let upstream;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `https://${req.headers.host || 'localhost'}`,
        'X-Title': 'Testeur IA',
      },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted) return res.end();
    return sendError(res, 502, `OpenRouter injoignable : ${e.message}`);
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    let message = text.slice(0, 500) || `Erreur OpenRouter ${upstream.status}`;
    try { message = JSON.parse(text).error?.message || message; } catch {}
    return sendError(res, upstream.status, message);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  });
  try {
    for await (const chunk of upstream.body) res.write(chunk);
  } catch {
    // flux interrompu (Stop ou coupure) : on ferme proprement
  }
  res.end();
}
