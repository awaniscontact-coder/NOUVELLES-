# Téléchargeur vidéo YouTube et TikTok

Application web Next.js permettant de récupérer les métadonnées et de télécharger des contenus publics YouTube et TikTok avec [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).

## Utilisation locale sous Windows

Prérequis : Node.js 18+, `yt-dlp` et `ffmpeg` installés et disponibles dans le PATH.

```powershell
npm install
npm run dev
```

Ouvrir ensuite http://localhost:3000.

Vérifier les outils :

```powershell
yt-dlp --version
ffmpeg -version
```

Tester un lien avant d’utiliser le site :

```powershell
yt-dlp -F "https://www.youtube.com/watch?v=IDENTIFIANT"
yt-dlp -F "https://www.tiktok.com/@compte/video/IDENTIFIANT"
```

## Limites importantes

- Les vidéos doivent être publiques et accessibles sans DRM, paywall ou contournement de protection.
- YouTube et TikTok peuvent modifier leur fonctionnement ou bloquer temporairement les requêtes.
- Les liens privés, supprimés, soumis à une restriction d’âge/compte, protégés par DRM ou bloqués par la plateforme peuvent échouer.
- Mettez régulièrement `yt-dlp` à jour :

```powershell
yt-dlp -U
```

Utilisez uniquement des vidéos que vous possédez ou que vous êtes autorisé à télécharger. Respectez les conditions d’utilisation des plateformes et les droits d’auteur.
