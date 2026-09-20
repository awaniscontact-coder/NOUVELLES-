# Téléchargeur vidéo par lien

Application web Next.js permettant de récupérer les métadonnées et de télécharger des contenus vidéo accessibles par URL avec [`yt-dlp`](https://github.com/yt-dlp/yt-dlp).

## Utilisation locale

Prérequis : Node.js 18+ et `yt-dlp` installés et disponibles dans le `PATH`.

```bash
npm install
npm run dev
```

Ouvrir ensuite http://localhost:3000.

### Installation de yt-dlp

- macOS : `brew install yt-dlp ffmpeg`
- Debian/Ubuntu : `sudo apt install yt-dlp ffmpeg`
- Windows : installer `yt-dlp.exe` et `ffmpeg`, puis les ajouter au `PATH`

`ffmpeg` est nécessaire pour fusionner certaines pistes vidéo et audio.

## Déploiement

Le serveur doit disposer de `yt-dlp`, de `ffmpeg`, d'un espace temporaire accessible en écriture et d'un timeout adapté. Un hébergement serverless avec des fonctions courtes n'est généralement pas adapté aux gros fichiers.

## Utilisation responsable

Utilisez uniquement des vidéos que vous possédez ou que vous êtes autorisé à télécharger. Cette application ne contourne pas les DRM, les paywalls ou les contrôles d'accès. Respectez les conditions d'utilisation des plateformes et les droits d'auteur.
