import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host) || host.endsWith(".local") || host.endsWith(".internal")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function findDownloadedFile(directory) {
  return readdir(directory, { withFileTypes: true }).then((entries) => {
    const file = entries.find((entry) => entry.isFile() && !entry.name.endsWith(".part") && !entry.name.endsWith(".ytdl"));
    return file ? path.join(directory, file.name) : null;
  });
}

export async function POST(request) {
  let directory;
  try {
    const body = await request.json();
    const url = safeUrl(body?.url);
    if (!url) return NextResponse.json({ error: "URL HTTP/HTTPS invalide." }, { status: 400 });

    const requestedFormat = typeof body?.format === "string" ? body.format : "best";
    const format = /^[a-zA-Z0-9+./_-]{1,80}$/.test(requestedFormat) ? requestedFormat : "best";
    directory = await mkdtemp(path.join(tmpdir(), "video-downloader-"));
    const output = path.join(directory, "download.%(ext)s");
    const executable = process.env.YTDLP_BIN || "yt-dlp";
    const selectedFormat = format === "best" ? "bestvideo*+bestaudio/best" : format;

    await execFileAsync(
      executable,
      ["--no-playlist", "--restrict-filenames", "--no-part", "-f", selectedFormat, "--merge-output-format", "mp4", "-o", output, url],
      { timeout: 10 * 60 * 1000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }
    );

    const file = await findDownloadedFile(directory);
    if (!file) throw new Error("Le fichier téléchargé est introuvable.");
    const data = await readFile(file);
    const extension = path.extname(file).toLowerCase();
    const contentType = extension === ".mp4" ? "video/mp4" : extension === ".webm" ? "video/webm" : extension === ".m4a" ? "audio/mp4" : "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="video${extension || ".mp4"}"`,
        "Content-Length": String(data.length),
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error?.code === "ENOENT"
      ? "yt-dlp est introuvable. Vérifiez qu’il est installé et disponible dans le PATH."
      : "Le téléchargement a échoué. Vérifiez que la vidéo est accessible, autorisée et que le lien est valide.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}
