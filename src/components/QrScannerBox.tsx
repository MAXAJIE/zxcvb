import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, KeyRound, Image as ImageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { sfx } from "@/lib/sfx";
import { parseArtifactCode } from "@/lib/museum";

interface Props { onScan: (id: string) => void }

export function QrScannerBox({ onScan }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const mod = await import("qr-scanner");
      const QrScanner = mod.default;
      if (!videoRef.current) return;
      const scanner = new QrScanner(
        videoRef.current,
        (result: { data: string }) => {
          const id = parseArtifactCode(result.data);
          if (!id) { setError(t("scan_invalid")); sfx.error(); return; }
          sfx.scanBeep();
          void scanner.stop();
          onScan(id);
        },
        { returnDetailedScanResult: true, highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 6 },
      );
      scannerRef.current = scanner;
      await scanner.start();
      setRunning(true);
      sfx.pop();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || t("scan_permission"));
      sfx.error();
    }
  }

  function stopCamera() {
    const s = scannerRef.current as { stop?: () => void; destroy?: () => void } | null;
    if (s) { try { s.stop?.(); } catch { /* noop */ } try { s.destroy?.(); } catch { /* noop */ } }
    scannerRef.current = null;
    setRunning(false);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const id = parseArtifactCode(manual);
    if (!id) { setError(t("scan_invalid")); sfx.error(); return; }
    setManual("");
    onScan(id);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so re-selecting the same file still fires change.
    e.target.value = "";
    if (!file) return;
    setError(null);
    setDecoding(true);
    try {
      const mod = await import("qr-scanner");
      const QrScanner = mod.default;
      // scanImage accepts File/Blob/HTMLImageElement and internally rescales
      // large sources (1000x1000 and beyond decode reliably) using its
      // built-in worker + scan-region auto-detection.
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const raw = typeof result === "string" ? result : result.data;
      const id = parseArtifactCode(raw);
      if (!id) { setError(t("scan_invalid")); sfx.error(); return; }
      sfx.scanBeep();
      onScan(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t("scan_invalid"));
      sfx.error();
    } finally {
      setDecoding(false);
    }
  }


  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_20px_50px_-24px_oklch(0.5_0.08_25/0.4)]">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {!running && (
          <div className="absolute inset-0 grid place-items-center bg-card/90 p-6 text-center">
            <div>
              <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg wiggle">
                <Camera className="size-8" />
              </div>
              <p className="font-display text-lg">{t("scan_title")}</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{t("scan_permission")}</p>
              <button
                onClick={startCamera}
                className="bounce-soft mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md"
              >
                <Camera className="size-4" /> {t("scan_start")}
              </button>
            </div>
          </div>
        )}
        {running && (
          <>
            {/* corner brackets */}
            <div className="pointer-events-none absolute inset-6">
              <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
              <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
              <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-primary" />
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="scanline absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
            </div>
            <button
              onClick={stopCamera}
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-ink shadow"
              title={t("scan_stop")}
            ><CameraOff className="size-4" /></button>
          </>
        )}
      </div>

      {error && <p className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive shake">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={decoding}
          className="bounce-soft inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-ink shadow-sm disabled:opacity-60"
        >
          <ImageIcon className="size-4" />
          {decoding ? "…" : t("scan_upload")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
      </div>

      <form onSubmit={submitManual} className="game-card flex items-center gap-2 p-3">
        <KeyRound className="ml-1 size-4 text-muted-foreground" />
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={t("scan_manual_placeholder")}
          className="flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
        <button type="submit" className="bounce-soft rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">{t("scan_go")}</button>
      </form>
      <p className="text-center text-xs text-muted-foreground">{t("scan_manual")}</p>

    </div>
  );
}
