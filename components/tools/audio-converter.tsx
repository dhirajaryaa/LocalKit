"use client";

import { useState } from "react";
import { AudioPicker, useSingleAudio } from "@/components/tools/audio-kit";
import {
  Field,
  JobStatus,
  OptionsPanel,
  ResultShell,
  StartOver,
  useBlobUrl,
  useJob,
} from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import {
  audioMetadataText,
  exportAudio,
  processAudioChannels,
} from "@/lib/engines/audio";
import { downloadBlob } from "@/lib/files/download";
import { baseName, formatBytes, formatDuration } from "@/lib/files/format";
import { SAMPLES } from "@/lib/files/sample";
import { cn, inlineWarning, optionHelp, select, shell } from "@/lib/ui";

type OutputFormat = "mp3" | "wav";

export function AudioConverterTool() {
  const audio = useSingleAudio({ sample: SAMPLES.audio });
  const job = useJob();
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [bitrate, setBitrate] = useState(192);
  const [sampleRate, setSampleRate] = useState<"keep" | 44100 | 48000>("keep");
  const [channels, setChannels] = useState<"keep" | 1 | 2>("keep");
  const [result, setResult] = useState<{
    blob: Blob;
    name: string;
    channels: number;
    sampleRate: number;
    duration: number;
  } | null>(null);
  const resultUrl = useBlobUrl(result?.blob);
  const busy = job.state.status === "running";
  const ready = Boolean(audio.item) && !audio.loading;

  const start = async () => {
    if (!audio.item || !ready) return;
    setResult(null);
    await job.run(async (signal, report) => {
      const source = audio.item;
      if (!source) return;
      report({ stage: "Preparing audio", progress: 0.05 });
      const processed = await processAudioChannels(source, {
        sampleRate,
        channels,
        signal,
      });
      report({ stage: "Encoding audio", progress: 0.2 });
      const blob = await exportAudio(processed, format, {
        bitrate,
        signal,
        onProgress: (fraction) => report({ progress: 0.2 + fraction * 0.75 }),
      });
      if (signal.aborted) throw new Error("Cancelled");
      setResult({
        blob,
        name: `${baseName(source.file.name)}.${format}`,
        channels: processed.numberOfChannels,
        sampleRate: processed.sampleRate,
        duration: processed.duration,
      });
      report({ stage: "Done", progress: 1 });
    });
  };

  const startOver = () => {
    job.reset();
    audio.clear();
    setResult(null);
    setFormat("mp3");
    setBitrate(192);
    setSampleRate("keep");
    setChannels("keep");
  };

  return (
    <div
      className={cn(
        shell,
        "grid grid-cols-1 items-start gap-8 pb-[72px] pt-8 min-[1101px]:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <AudioPicker source={audio} disabled={busy} />
        <JobStatus job={job} onRetry={start} />
        {result ? (
          <ResultShell
            title="Converted audio"
            stats={[
              { label: "Duration", value: formatDuration(result.duration) },
              { label: "Output", value: format.toUpperCase() },
              { label: "Size", value: formatBytes(result.blob.size) },
            ]}
            preview={
              resultUrl ? (
                <audio className="mb-4 w-full" controls src={resultUrl}>
                  Your browser cannot preview this audio.
                </audio>
              ) : null
            }
            actions={
              <>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-90"
                  onClick={() => downloadBlob(result.blob, result.name)}
                >
                  <Icon name="download" size={15} /> Download {format.toUpperCase()}
                </button>
                <StartOver onClick={startOver} />
              </>
            }
          >
            <p className="mt-3 text-xs text-ink-muted">
              {result.channels === 1 ? "Mono" : "Stereo"} · {result.sampleRate.toLocaleString()} Hz.
              {audio.item && result.blob.size > audio.item.file.size
                ? " The output is larger than the source. That is expected for WAV or a higher bitrate."
                : ""}
            </p>
          </ResultShell>
        ) : null}
      </div>

      <div className="min-w-0 min-[1101px]:sticky min-[1101px]:top-[88px]">
        <OptionsPanel
          actionLabel="Convert audio"
          onAction={start}
          disabled={!ready || Boolean(result)}
          busy={busy}
          job={job}
          onRetry={start}
          note={
            <p className={optionHelp}>
              {!audio.item
                ? "Add an audio file to begin."
                : audioMetadataText(audio.item)}
            </p>
          }
        >
          <Field label="Output format" htmlFor="audio-format" help="WAV is 16-bit PCM and may be larger than the source.">
            <select
              id="audio-format"
              className={select}
              value={format}
              onChange={(event) => setFormat(event.target.value as OutputFormat)}
              disabled={busy}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </Field>

          {format === "mp3" ? (
            <Field label="Bitrate" htmlFor="audio-bitrate">
              <select
                id="audio-bitrate"
                className={select}
                value={bitrate}
                onChange={(event) => setBitrate(Number(event.target.value))}
                disabled={busy}
              >
                <option value={128}>128 kbps</option>
                <option value={192}>192 kbps</option>
                <option value={256}>256 kbps</option>
                <option value={320}>320 kbps</option>
              </select>
            </Field>
          ) : (
            <p className={optionHelp}>WAV uses a fixed 16-bit PCM stream. Bitrate does not apply.</p>
          )}

          <Field label="Sample rate" htmlFor="audio-rate">
            <select
              id="audio-rate"
              className={select}
              value={sampleRate}
              onChange={(event) =>
                setSampleRate(event.target.value === "keep" ? "keep" : (Number(event.target.value) as 44100 | 48000))
              }
              disabled={busy}
            >
              <option value="keep">Keep source</option>
              <option value={44100}>44,100 Hz</option>
              <option value={48000}>48,000 Hz</option>
            </select>
          </Field>

          <Field label="Channels" htmlFor="audio-channels">
            <select
              id="audio-channels"
              className={select}
              value={channels}
              onChange={(event) =>
                setChannels(
                  event.target.value === "keep" ? "keep" : (Number(event.target.value) as 1 | 2),
                )
              }
              disabled={busy}
            >
              <option value="keep">Keep source</option>
              <option value={1}>Mono</option>
              <option value={2}>Stereo</option>
            </select>
          </Field>

          {audio.item && audio.item.duration > 3600 ? (
            <p className={inlineWarning}>
              Long audio can take several minutes to encode. Keep this tab open.
            </p>
          ) : null}
          <p className={optionHelp}>
            The converter does not change loudness. {format === "wav" ? "WAV output can be much larger than MP3." : "MP3 encoding is lossy."}
          </p>
        </OptionsPanel>
      </div>
    </div>
  );
}
