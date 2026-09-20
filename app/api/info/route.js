import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

  return { url: url.toString() };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const checked = validateUrl(body?.url);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

    const { stdout } = await execFileAsync(
      process.env.YTDLP_BIN || "yt-dlp",
      ["--dump-single-json", "--no-playlist", "--skip-download", checked.url],
      { timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
    );
    const info = JSON.parse(stdout);

    return NextResponse.json({
      title: info.title || "Vidéo sans titre",
      thumbnail: info.thumbnail || null,
      duration: info.duration || null,
      uploader: info.uploader || info.channel || null,
      formats: (info.formats || [])
        .filter((format) => format.ext && ["mp4", "webm", "m4a", "mp3"].includes(format.ext))
        .slice(-12)
        .map((format) => ({
          format_id: format.format_id,
          ext: format.ext,
          resolution: format.resolution || format.format_note || "Audio/vidéo",
          filesize: format.filesize || format.filesize_approx || null
        }))
    });
  } catch (error) {
    const message = error?.code === "ENOENT"
      ? "yt-dlp n’est pas installé sur le serveur. Consultez le README."
      : "Impossible de lire cette URL. Vérifiez le lien et vos autorisations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
