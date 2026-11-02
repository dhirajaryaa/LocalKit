"use client";

import { useCallback, useRef, useState } from "react";
import { Dropzone, FileList, FileRow } from "@/components/tools/tool-kit";
import { Icon } from "@/components/ui/icon";
import { LIMITS } from "@/lib/constants";
import { loadAudio, type LoadedAudio } from "@/lib/engines/audio";
import { fetchSampleFile } from "@/lib/files/sample";
import { formatBytes } from "@/lib/files/format";
import { inlineDanger, inlineWarning, optionHelp } from "@/lib/ui";

export interface AudioSample {
  path: string;
  name: string;
  type: string;
}

export function useSingleAudio(options: { sample?: AudioSample } = {}) {
  const [item, setItem] = useState<LoadedAudio | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (file: File) => {
    const id = requestId.current + 1;
    requestId.current = id;
    setError("");
    setNotice("");
    if (file.size === 0) {
      setError("This file is empty.");
      return;
    }
    if (file.size > LIMITS.audio.perFile) {
      setError(
        `${file.name} is ${formatBytes(file.size)}. The audio limit is ${formatBytes(LIMITS.audio.perFile)} per file.`,
      );
      return;
    }
    setLoading(true);
    try {
      const loaded = await loadAudio(file);
      if (requestId.current !== id) return;
      if (loaded.duration > LIMITS.audio.maxSeconds) {
        throw new Error("This audio is longer than the 2 hour limit.");
      }
      setItem(loaded);
    } catch (caught) {
      if (requestId.current !== id) return;
      setError(caught instanceof Error ? caught.message : "This audio could not be read.");
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (files.length > 1) setNotice("This tool takes one audio file. The first file was used.");
      await load(files[0]);
    },
    [load],
  );

  const loadSample = useCallback(async () => {
    if (!options.sample) return;
    setSampleBusy(true);
    setError("");
    try {
      const file = await fetchSampleFile(
        options.sample.path,
        options.sample.name,
        options.sample.type,
      );
      await load(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The sample could not be loaded.");
    } finally {
      setSampleBusy(false);
    }
  }, [load, options.sample]);

  const clear = useCallback(() => {
    requestId.current += 1;
    setItem(null);
    setError("");
    setNotice("");
    setLoading(false);
  }, []);

  return {
    item,
    hasSample: Boolean(options.sample),
    error,
    notice,
    loading,
    sampleBusy,
    addFiles,
    loadSample,
    clear,
  };
}

export type SingleAudioController = ReturnType<typeof useSingleAudio>;

export function AudioPicker({
  source,
  disabled = false,
  sampleLabel = "Try a sample audio",
}: {
  source: SingleAudioController;
  disabled?: boolean;
  sampleLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { item, loading, error, notice, sampleBusy } = source;

  if (!item) {
    return (
      <div className="grid gap-3">
        <Dropzone
          accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac"
          formats="MP3, WAV, OGG, M4A, FLAC"
          limitText={`up to ${formatBytes(LIMITS.audio.perFile)}`}
          onFiles={source.addFiles}
          disabled={disabled || loading}
          sample={
            source.hasSample && sampleLabel
              ? { label: sampleLabel, onSelect: source.loadSample, busy: sampleBusy }
              : undefined
          }
        />
        {loading ? <p className={optionHelp}>Reading audio…</p> : null}
        {error ? (
          <p className={inlineDanger} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <FileList
        summary={`1 audio file · ${formatBytes(item.file.size)}`}
        onAdd={() => inputRef.current?.click()}
        addLabel="Replace"
        disabled={disabled || loading}
      >
        <FileRow
          name={item.file.name}
          size={item.file.size}
          meta={`${item.channels === 1 ? "Mono" : "Stereo"} · ${item.sampleRate.toLocaleString()} Hz`}
          thumbnail={<Icon name="audio" size={18} />}
          onRemove={source.clear}
          disabled={disabled || loading}
        />
      </FileList>
      {loading ? <p className={optionHelp}>Reading audio…</p> : null}
      {notice ? (
        <p className={inlineWarning} role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className={inlineDanger} role="alert">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac"
        tabIndex={-1}
        disabled={disabled || loading}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) void source.addFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
