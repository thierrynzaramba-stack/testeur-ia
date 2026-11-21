# Testeur IA

Petit site pour tester les réponses de modèles d'IA via OpenRouter.

- On choisit un modèle, on pose une question, la réponse s'affiche en direct.
- La conversation garde le contexte tant que la page reste ouverte.
- Aucune mémoire : rafraîchir la page efface tout (rien n'est enregistré côté serveur).
- Sélecteur de modèles : tous les modèles texte utilisables avec la clé (OpenRouter applique les réglages de confidentialité du compte), avec recherche, prix par million de tokens, section « Réputés peu bridés » (familles définies dans `api/models.js`).
- Favoris (★) et archives enregistrés dans le navigateur (localStorage) ; un champ permet de saisir n'importe quel ID OpenRouter.

## Variables Vercel

| Nom | Rôle |
| --- | --- |
| `OPENROUTER_API_KEY` | Clé OpenRouter (obligatoire) |
| `ACCESS_PASSWORD` | Mot de passe d'accès au chat (fortement conseillé, sinon n'importe qui peut utiliser ta clé) |

## Fichiers

- `index.html` : la page
- `api/chat.js` : relais vers OpenRouter (la clé ne quitte jamais le serveur)
- `api/models.js` : liste filtrée des modèles (mise en cache 1 h)
