# Téléchargeur vidéo YouTube et TikTok

Application web Next.js permettant de récupérer les métadonnées et de télécharger des vidéos publiques YouTube et TikTok avec [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).

## Prérequis sous Windows

- Node.js 18+
- `yt-dlp`
- `ffmpeg`

Vérification :

```powershell
yt-dlp --version
ffmpeg -version
```

## Installation locale

```powershell
npm install
npm run dev
```

Puis ouvrir : http://localhost:3000

## Exemple de liens supportés

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
https://youtu.be/XXXXXXXXXXX
https://www.tiktok.com/@user/video/XXXXXXXXXXX
```

## Mises à jour recommandées

```powershell
yt-dlp -U
```

## Limites

- Les vidéos doivent être publiques et téléchargeables.
- Les contenus privés, supprimés, protégés par DRM ou interdits par les plateformes peuvent échouer.
- YouTube et TikTok peuvent modifier leur extraction ou bloquer certains liens.
- L’application ne doit pas être utilisée pour contourner les protections, les paywalls ou les restrictions d’accès.

Utilisez uniquement des vidéos que vous possédez ou que vous êtes autorisé à télécharger. Respectez les conditions d’utilisation des plateformes et les droits d’auteur.
