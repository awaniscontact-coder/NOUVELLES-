import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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

    await execFileAsync(
      process.env.YTDLP_BIN || "yt-dlp",
      ["--no-playlist", "--restrict-filenames", "-f", format === "best" ? "bv*+ba/b" : format, "--merge-output-format", "mp4", "-o", output, url],
      { timeout: 10 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 }
    );

    const { stdout } = await execFileAsync("find", [directory, "-maxdepth", "1", "-type", "f", "-print"], { timeout: 5000 });
    const file = stdout.trim().split("\n").find(Boolean);
    if (!file) throw new Error("Fichier absent");
    const data = await readFile(file);
    const filename = path.basename(file).replace(/^download\./, "video.");

    return new NextResponse(data, {
      headers: {
        "Content-Type": filename.endsWith(".mp4") ? "video/mp4" : "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(data.length),
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Le téléchargement a échoué. Vérifiez que la vidéo est accessible et autorisée." }, { status: 500 });
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}
