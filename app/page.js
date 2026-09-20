"use client";

import { useState } from "react";

function formatBytes(bytes) {
  if (!bytes) return "Taille inconnue";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState(null);
  const [format, setFormat] = useState("best");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function inspect(event) {
    event.preventDefault();
    setLoading(true); setInfo(null); setStatus("");
    try {
      const response = await fetch("/api/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInfo(data); setStatus("Vidéo trouvée. Choisissez un format, puis téléchargez-la.");
    } catch (error) { setStatus(error.message || "Une erreur est survenue."); }
    finally { setLoading(false); }
  }

  async function download() {
    setLoading(true); setStatus("Préparation du téléchargement…");
    try {
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, format }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      const blob = await response.blob();
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "video.mp4"; link.click(); URL.revokeObjectURL(link.href);
      setStatus("Téléchargement terminé.");
    } catch (error) { setStatus(error.message || "Le téléchargement a échoué."); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <section className="hero"><div className="badge">● SIMPLE · RAPIDE · RESPONSABLE</div><h1>Télécharger une vidéo<br /><span>à partir d’un lien.</span></h1><p>Collez le lien d’une vidéo que vous avez le droit de télécharger. Nous affichons ses informations avant de lancer le téléchargement.</p></section>
    <section className="card">
      <form onSubmit={inspect}><label htmlFor="url">Lien de la vidéo</label><div className="url-row"><input id="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemple.com/video" /><button disabled={loading}>{loading ? "Analyse…" : "Analyser"}</button></div></form>
      {status && <p className="status" role="status">{status}</p>}
      {info && <div className="preview">{info.thumbnail && <img src={info.thumbnail} alt="Miniature de la vidéo" />}<div className="details"><h2>{info.title}</h2>{info.uploader && <p className="muted">Par {info.uploader}</p>}<label htmlFor="format">Format</label><select id="format" value={format} onChange={(e) => setFormat(e.target.value)}><option value="best">Meilleure qualité (MP4)</option>{info.formats.map((item) => <option key={item.format_id} value={item.format_id}>{item.ext.toUpperCase()} · {item.resolution} · {formatBytes(item.filesize)}</option>)}</select><button className="download" onClick={download} disabled={loading}>{loading ? "Téléchargement…" : "Télécharger"}</button></div></div>}
    </section>
    <footer>Utilisez ce service uniquement pour vos contenus ou ceux pour lesquels vous avez une autorisation. Aucun contournement de DRM ou de protection d’accès.</footer>
  </main>;
}
