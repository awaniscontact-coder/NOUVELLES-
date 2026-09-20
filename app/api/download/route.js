import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return { error: "URL HTTP/HTTPS invalide." };

    const host = url.hostname.toLowerCase();
    const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blocked.includes(host) || host.endsWith(".local") || host.endsWith(".internal")) {
      return { error: "Cette adresse est interdite." };
    }

    const isSupported = supportedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (!isSupported) {
      return { error: "Le site n’est pas pris en charge. Utilisez un lien YouTube, TikTok ou un fichier vidéo public." };
    }

    return { url: url.toString(), platform: host.includes("tiktok") ? "TikTok" : "YouTube" };
  } catch {
    return { error: "URL invalide." };
  }
}

async function findDownloadedFile(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const file = entries.find((entry) => {
    if (!entry.isFile()) return false;
    const name = entry.name.toLowerCase();
    return !name.endsWith(".part") && !name.endsWith(".webm.part");
  });
  return file ? path.join(directory, file.name) : null;
}

export async function POST(request) {
  let directory;
  try {
    const body = await request.json();
    const checked = validateUrl(body?.url);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

    const requestedFormat = typeof body?.format === "string" ? body.format : "best";
    const format = /^[a-zA-Z0-9+./_-]{1,80}$/.test(requestedFormat) ? requestedFormat : "best";
    directory = await mkdtemp(path.join(tmpdir(), "video-downloader-"));
    const output = path.join(directory, "download.%(ext)s");
    const executable = process.env.YTDLP_BIN || "yt-dlp";

    const args = [
      "--no-playlist",
      "--restrict-filenames",
      "--no-part",
      "--merge-output-format",
      "mp4",
      "-o",
      output,
      checked.url
    ];

    if (checked.platform === "YouTube") {
      args.splice(0, 0, "--extractor-args", "youtube:player_client=web,android,default");
    }

    if (format === "best") {
      args.splice(0, 0, "-f", "bestvideo*+bestaudio/best");
    } else {
      args.splice(0, 0, "-f", format);
    }

    await execFileAsync(executable, args, {
      timeout: 10 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    });

    const file = await findDownloadedFile(directory);
    if (!file) throw new Error("Le fichier téléchargé est introuvable.");

    const data = await readFile(file);
    const extension = path.extname(file).toLowerCase() || ".mp4";
    const contentType =
      extension === ".mp4" ? "video/mp4" :
      extension === ".webm" ? "video/webm" :
      extension === ".m4a" ? "audio/mp4" :
      extension === ".mp3" ? "audio/mpeg" :
      "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="video${extension}"`,
        "Content-Length": String(data.length),
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message =
      error?.code === "ENOENT"
        ? "yt-dlp est introuvable dans le PATH. Vérifiez l’installation et le chemin d’accès."
        : "Le téléchargement a échoué. Vérifiez que la vidéo est publique, accessible et autorisée. YouTube/TikTok peuvent aussi refuser certains liens ou formats.";

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}
