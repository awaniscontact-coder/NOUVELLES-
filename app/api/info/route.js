import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const supportedHosts = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com"
];

function validateUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return { error: "L’URL fournie est invalide." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { error: "Seules les URL HTTP et HTTPS sont acceptées." };
  }

  const host = url.hostname.toLowerCase();
  const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blocked.includes(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    return { error: "Cette adresse n’est pas autorisée." };
  }

  const isSupported = supportedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
  if (!isSupported) {
    return { error: "Cette plateforme n’est pas supportée. Le site doit être YouTube ou TikTok, ou un lien direct de fichier vidéo public." };
  }

  return {
    url: url.toString(),
    platform: host.includes("tiktok") ? "TikTok" : "YouTube"
  };
}

function normalizeFormats(info) {
  const items = (info?.formats || [])
    .filter((format) => format?.ext && ["mp4", "webm", "m4a", "mp3"].includes(format.ext))
    .filter((format) => format.vcodec !== "none" || format.acodec !== "none")
    .slice(-18)
    .map((format) => ({
      format_id: format.format_id,
      ext: format.ext,
      resolution: format.resolution || format.format_note || "Audio/vidéo",
      filesize: format.filesize || format.filesize_approx || null
    }));

  return items;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const checked = validateUrl(body?.url);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

    const { stdout } = await execFileAsync(
      process.env.YTDLP_BIN || "yt-dlp",
      [
        "--dump-single-json",
        "--no-playlist",
        "--skip-download",
        "--no-warnings",
        "--extractor-args",
        "youtube:player_client=web,android,default",
        checked.url
      ],
      { timeout: 60000, maxBuffer: 5 * 1024 * 1024, windowsHide: true }
    );

    const text = stdout.trim();
    if (!text) {
      throw new Error("Aucune donnée n’a été renvoyée par yt-dlp.");
    }

    const info = JSON.parse(text);

    return NextResponse.json({
      platform: checked.platform || info.extractor_key || "Plateforme supportée",
      title: info.title || "Vidéo sans titre",
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || null,
      duration: info.duration || null,
      uploader: info.uploader || info.channel || null,
      formats: normalizeFormats(info)
    });
  } catch (error) {
    const message =
      error?.code === "ENOENT"
        ? "yt-dlp n’est pas installé ou n’est pas accessible dans le PATH."
        : "Le lien n’a pas pu être lu. Vérifiez qu’il s’agit d’une vidéo publique YouTube/TikTok valide, non privée, non protégée et autorisée au téléchargement.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
