# Testeur IA

Petit site pour tester les réponses de modèles d'IA via OpenRouter.

- On choisit un modèle, on pose une question, la réponse s'affiche en direct.
- La conversation garde le contexte tant que la page reste ouverte.
- Aucune mémoire : rafraîchir la page efface tout (rien n'est enregistré côté serveur).
- Liste des modèles : récupérée en direct sur OpenRouter et filtrée sur les familles réputées peu bridées (Venice/Dolphin, Hermes, Grok, Mistral, TheDrummer, Sao10K, Magnum, NeverSleep, MythoMax). Modifiable dans `api/models.js`.
- « Autre modèle » permet de saisir n'importe quel ID OpenRouter.

## Variables Vercel

| Nom | Rôle |
| --- | --- |
| `OPENROUTER_API_KEY` | Clé OpenRouter (obligatoire) |
| `ACCESS_PASSWORD` | Mot de passe d'accès au chat (fortement conseillé, sinon n'importe qui peut utiliser ta clé) |

## Fichiers

- `index.html` : la page
- `api/chat.js` : relais vers OpenRouter (la clé ne quitte jamais le serveur)
- `api/models.js` : liste filtrée des modèles (mise en cache 1 h)
