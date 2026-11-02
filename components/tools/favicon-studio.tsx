"use client";

import { useEffect, useState } from "react";
import { ImageQueueList } from "@/components/tools/image-queue-list";
import { Field, JobStatus, OptionsPanel, ResultShell, StartOver, useJob } from "@/components/tools/tool-kit";
import { useImageQueue } from "@/components/tools/use-image-queue";
import { Icon } from "@/components/ui/icon";
import {
  faviconDataUrl,
  generateFaviconSet,
  type FaviconFile,
  type FaviconOptions,
} from "@/lib/engines/favicon";
import { downloadZip } from "@/lib/files/download";
import { formatBytes } from "@/lib/files/format";
import {
  btnPrimary,
  cn,
  colorInput,
  colorRow,
  fieldLabel,
  fileMeta,
  fileName,
  inlineDanger,
  inlineNote,
  inlineWarning,
  input,
  optionHelp,
  panel,
  panelBody,
  panelHeader,
  panelTitle,
  range,
  select,
  shell,
} from "@/lib/ui";

const SIZES = [16, 32, 64, 180] as const;

export function FaviconStudioTool() {
  const queue = useImageQueue({ maxCount: 1 });
  const job = useJob();
  const [crop, setCrop] = useState<FaviconOptions["crop"]>("crop");
  const [padding, setPadding] = useState(0);
  const [background, setBackground] = useState<FaviconOptions["background"]>("transparent");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [appName, setAppName] = useState("My Site");
  const [themeColor, setThemeColor] = useState("#000000");
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<FaviconFile[]>([]);
  const busy = job.state.status === "running";
  const source = queue.items[0]?.loaded;
  const options: FaviconOptions = { crop, padding, background, backgroundColor, appName, themeColor };
  const appNameValid = appName.trim().length >= 1 && appName.trim().length <= 60;
  const sourceValid = Boolean(source && source.width >= 48 && source.height >= 48);
  const sourceSmall = Boolean(source && (source.width < 512 || source.height < 512));

  useEffect(() => {
    if (!source) {
      setPreviews({});
      return;
    }
    const next: Record<number, string> = {};
    for (const size of SIZES) next[size] = faviconDataUrl(source, size, options);
    setPreviews(next);
    // Options are intentionally primitive values to keep the live preview honest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, crop, padding, background, backgroundColor, appName, themeColor]);

  const start = async () => {
    if (!source) return;
    setFiles([]);
    await job.run(async (signal, report) => {
      const generated = await generateFaviconSet(source, options, (stage) => report({ stage }));
      if (signal.aborted) return;
      setFiles(generated);
    });
  };

  const startOver = () => {
    job.reset();
    queue.clear();
    setFiles([]);
    setPreviews({});
  };

  const download = () => {
    if (files.length === 0) return;
    void downloadZip(files, "localkit-favicons.zip");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ImageQueueList queue={queue} disabled={busy} multiple={false} maxCount={1} />
        {source && !sourceValid ? (
          <p className={inlineDanger} role="alert">
            This image is {source.width} × {source.height} px. Favicon Studio needs at least 48 × 48 px.
          </p>
        ) : null}
        {sourceSmall ? (
          <p className={inlineWarning}>
            This source is smaller than 512 px. Icons will be upscaled and may look soft.
          </p>
        ) : null}
        <JobStatus job={job} onRetry={start} />

        {source && sourceValid ? (
          <div className={panel}>
            <div className={panelHeader}>
              <h2 className={panelTitle}>Live preview</h2>
              <span className={optionHelp}>Light and dark</span>
            </div>
            <div className={panelBody}>
              <div className="grid gap-4 sm:grid-cols-2">
                {SIZES.map((size) => (
                  <div className="flex items-center gap-3" key={size}>
                    <span className={cn(fieldLabel, "w-10 shrink-0")}>{size} px</span>
                    <div className="flex gap-2">
                      <span className="flex size-16 items-center justify-center rounded-md border border-line bg-white">
                        {previews[size] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previews[size]} alt={`${size} pixel favicon on light`} width={Math.min(size, 64)} height={Math.min(size, 64)} />
                        ) : null}
                      </span>
                      <span className="flex size-16 items-center justify-center rounded-md border border-line bg-[#0e0e0c]">
                        {previews[size] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previews[size]} alt={`${size} pixel favicon on dark`} width={Math.min(size, 64)} height={Math.min(size, 64)} />
                        ) : null}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {files.length > 0 ? (
          <ResultShell
            title="Favicon set ready"
            stats={[
              { label: "Files", value: String(files.length) },
              { label: "Source", value: source ? `${source.width} × ${source.height}` : "—" },
              {
                label: "Zip size",
                value: formatBytes(files.reduce((sum, file) => sum + file.blob.size, 0)),
              },
            ]}
            actions={
              <>
                <button type="button" className={btnPrimary} onClick={download}>
                  <Icon name="download" size={15} />
                  Download favicons (.zip)
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <div className="flex items-center gap-4">
              {previews[64] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="rounded-md border border-line"
                  src={previews[64]}
                  alt="64 pixel favicon preview"
                  width={64}
                  height={64}
                />
              ) : null}
              <div>
                <div className={fileName}>localkit-favicons.zip</div>
                <div className={fileMeta}>
                  <span>ICO</span>
                  <span>6 PNGs</span>
                  <span>Webmanifest</span>
                  <span>HTML snippet</span>
                </div>
              </div>
            </div>
            <p className="mt-3.5 border-l-2 border-accent px-3 py-2.5 text-[13px] text-ink-muted">
              The ICO contains 16, 32, and 48 px PNG entries. All PNG sizes are rendered from the
              original source, not from the 16 px icon.
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Generate favicons"
          onAction={start}
          disabled={!sourceValid || !appNameValid || busy || files.length > 0}
          busy={busy}
          note={
            <p className={optionHelp}>
              {!source
                ? "Add a square image, ideally 512 px or larger."
                : !sourceValid
                  ? "Use a source of at least 48 × 48 px."
                  : !appNameValid
                    ? "The app name must be 1 to 60 characters."
                    : "Outputs a zip with 9 files."}
            </p>
          }
        >
          <Field label="Crop" htmlFor="favicon-crop" help="Center square crops the overflow. Fit with padding keeps the whole image.">
            <select
              id="favicon-crop"
              className={select}
              value={crop}
              onChange={(event) => setCrop(event.target.value as FaviconOptions["crop"])}
              disabled={busy}
            >
              <option value="crop">Center square</option>
              <option value="fit">Fit with padding</option>
            </select>
          </Field>

          <Field label={`Padding · ${padding}%`} htmlFor="favicon-padding">
            <input
              id="favicon-padding"
              className={range}
              type="range"
              min={0}
              max={20}
              value={padding}
              onChange={(event) => setPadding(Number(event.target.value))}
              disabled={busy}
            />
          </Field>

          <Field label="Background" htmlFor="favicon-background">
            <select
              id="favicon-background"
              className={select}
              value={background}
              onChange={(event) => setBackground(event.target.value as FaviconOptions["background"])}
              disabled={busy}
            >
              <option value="transparent">Transparent</option>
              <option value="white">White</option>
              <option value="custom">Custom color</option>
            </select>
          </Field>

          {background === "custom" ? (
            <Field label="Background color" htmlFor="favicon-background-color">
              <div className={colorRow}>
                <input
                  id="favicon-background-color"
                  className={colorInput}
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  disabled={busy}
                />
                <input
                  className={cn(input, "h-[34px] text-[13px]")}
                  type="text"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  aria-label="Background hex color"
                  disabled={busy}
                />
              </div>
            </Field>
          ) : null}

          <Field label="App name" htmlFor="favicon-app-name" help={`${appName.length}/60 characters. Used in the webmanifest.`}>
            <input
              id="favicon-app-name"
              className={input}
              type="text"
              value={appName}
              maxLength={60}
              onChange={(event) => setAppName(event.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="Theme color" htmlFor="favicon-theme-color">
            <div className={colorRow}>
              <input
                id="favicon-theme-color"
                className={colorInput}
                type="color"
                value={themeColor}
                onChange={(event) => setThemeColor(event.target.value)}
                disabled={busy}
              />
              <input
                className={cn(input, "h-[34px] text-[13px]")}
                type="text"
                value={themeColor}
                onChange={(event) => setThemeColor(event.target.value)}
                aria-label="Theme hex color"
                disabled={busy}
              />
            </div>
          </Field>

          <div className={inlineNote}>
            Output: favicon.ico, six PNGs, site.webmanifest, and a ready-to-paste HTML snippet.
          </div>
        </OptionsPanel>
      </div>
    </div>
  );
}
