RETRO COLLECTION — VERSION 1

Cette version est une base autonome :
- interface française mobile-first
- stockage local IndexedDB
- ajout par photo
- reconnaissance OpenAI via un Cloudflare Worker
- édition manuelle des résultats
- quantité, état, prix personnel
- recherche et filtre
- statistiques
- export/import JSON
- PWA/offline

IMPORTANT
1. Ne mets jamais OPENAI_API_KEY dans index.html.
2. La clé doit être créée comme Secret dans Cloudflare.
3. Le frontend doit recevoir uniquement l'URL publique du Worker.

MISE EN LIGNE
A) Frontend
- Mettre index.html, manifest.json et sw.js dans un dépôt GitHub public.
- Activer GitHub Pages sur la branche principale.
- GitHub Pages héberge des fichiers HTML/CSS/JS statiques.

B) Backend OpenAI
- Créer un Cloudflare Worker.
- Coller worker.js comme code du Worker.
- Dans Settings > Variables and Secrets, ajouter un Secret nommé OPENAI_API_KEY.
- Déployer.
- L'URL du Worker sera du type https://nom-du-worker....workers.dev
- Le chemin utilisé par l'application est /recognize.

C) Dans Retro Collection
- Ouvrir Réglages.
- Saisir l'URL complète du Worker, par exemple https://mon-worker.workers.dev/recognize
- Enregistrer.

eBay
Le bouton de recherche eBay est volontairement manuel : aucun scraping et aucun faux prix.

NOTE
La première version privilégie la fiabilité et la simplicité. Les photos sont conservées dans la base locale de l'iPhone et incluses dans l'export JSON.
