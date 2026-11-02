/**
 * A small client for the ffmpeg.wasm worker.
 *
 * The published `@ffmpeg/ffmpeg` client builds its worker URL dynamically,
 * which Turbopack cannot resolve for a static export. The worker protocol is
 * stable, so we keep the client here and point it at a fixed public worker.
 */

const WORKER_URL = "/ffmpeg/ffmpeg-worker.js";

const MESSAGE = {
  LOAD: "LOAD",
  EXEC: "EXEC",
  WRITE_FILE: "WRITE_FILE",
  READ_FILE: "READ_FILE",
  DELETE_FILE: "DELETE_FILE",
  ERROR: "ERROR",
  PROGRESS: "PROGRESS",
  LOG: "LOG",
} as const;

type MessageType = (typeof MESSAGE)[keyof typeof MESSAGE];

export interface FFmpegLoadConfig {
  coreURL: string;
  wasmURL: string;
  workerURL?: string;
}

export type FFmpegFileData = Uint8Array | string;

export interface FFmpegLogEvent {
  type: string;
  message: string;
}

export interface FFmpegProgressEvent {
  progress: number;
  time: number;
}

type LogCallback = (event: FFmpegLogEvent) => void;
type ProgressCallback = (event: FFmpegProgressEvent) => void;
type Resolve = (data: unknown) => void;
type Reject = (error: unknown) => void;

interface WorkerReply {
  id: number;
  type: string;
  data: unknown;
}

export class FFmpegClient {
  #worker: Worker | null = null;
  #resolves = new Map<number, Resolve>();
  #rejects = new Map<number, Reject>();
  #logCallbacks: LogCallback[] = [];
  #progressCallbacks: ProgressCallback[] = [];
  #nextId = 0;
  loaded = false;

  #registerHandlers(): void {
    if (!this.#worker) return;
    this.#worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
      const { id, type, data: payload } = data;
      if (type === MESSAGE.LOG) {
        for (const callback of this.#logCallbacks) {
          callback(payload as FFmpegLogEvent);
        }
        return;
      }
      if (type === MESSAGE.PROGRESS) {
        for (const callback of this.#progressCallbacks) {
          callback(payload as FFmpegProgressEvent);
        }
        return;
      }

      const resolve = this.#resolves.get(id);
      const reject = this.#rejects.get(id);
      this.#resolves.delete(id);
      this.#rejects.delete(id);

      if (type === MESSAGE.ERROR) {
        reject?.(
          new Error(
            typeof payload === "string" && payload
              ? payload
              : "The video engine reported an error.",
          ),
        );
        return;
      }
      if (type === MESSAGE.LOAD) this.loaded = true;
      resolve?.(payload);
    };

    this.#worker.onerror = (event) => {
      const error = new Error(event.message || "The video engine worker crashed.");
      for (const reject of this.#rejects.values()) reject(error);
      this.#resolves.clear();
      this.#rejects.clear();
    };
  }

  #send<T>(
    type: MessageType,
    data: unknown,
    transfer: Transferable[] = [],
    signal?: AbortSignal,
  ): Promise<T> {
    if (!this.#worker) {
      return Promise.reject(new Error("The video engine is not loaded."));
    }
    if (signal?.aborted) {
      return Promise.reject(new DOMException("Cancelled", "AbortError"));
    }

    const id = this.#nextId;
    this.#nextId += 1;

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const finish = () => {
        settled = true;
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        if (settled) return;
        finish();
        this.#resolves.delete(id);
        this.#rejects.delete(id);
        reject(new DOMException("Cancelled", "AbortError"));
      };

      this.#resolves.set(id, (value) => {
        finish();
        resolve(value as T);
      });
      this.#rejects.set(id, (error) => {
        finish();
        reject(error);
      });
      signal?.addEventListener("abort", onAbort, { once: true });

      try {
        this.#worker?.postMessage({ id, type, data }, transfer);
      } catch (error) {
        finish();
        this.#resolves.delete(id);
        this.#rejects.delete(id);
        reject(error);
      }
    });
  }

  on(event: "log", callback: LogCallback): void;
  on(event: "progress", callback: ProgressCallback): void;
  on(event: "log" | "progress", callback: LogCallback | ProgressCallback): void {
    if (event === "log") this.#logCallbacks.push(callback as LogCallback);
    else this.#progressCallbacks.push(callback as ProgressCallback);
  }

  off(event: "log", callback: LogCallback): void;
  off(event: "progress", callback: ProgressCallback): void;
  off(event: "log" | "progress", callback: LogCallback | ProgressCallback): void {
    if (event === "log") {
      this.#logCallbacks = this.#logCallbacks.filter((item) => item !== callback);
    } else {
      this.#progressCallbacks = this.#progressCallbacks.filter((item) => item !== callback);
    }
  }

  async load(config: FFmpegLoadConfig, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
    if (!this.#worker) {
      this.#worker = new Worker(WORKER_URL, {
        type: "module",
        name: "localkit-ffmpeg",
      });
      this.#registerHandlers();
    }
    await this.#send(MESSAGE.LOAD, config, [], signal);
  }

  exec(
    args: string[],
    timeout = -1,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<number> {
    return this.#send(MESSAGE.EXEC, { args, timeout }, [], signal);
  }

  writeFile(
    path: string,
    data: FFmpegFileData,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<void> {
    const transfer: Transferable[] = [];
    if (data instanceof Uint8Array) transfer.push(data.buffer);
    return this.#send(MESSAGE.WRITE_FILE, { path, data }, transfer, signal);
  }

  readFile(
    path: string,
    encoding: "binary" | "utf8" = "binary",
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<FFmpegFileData> {
    return this.#send(MESSAGE.READ_FILE, { path, encoding }, [], signal);
  }

  deleteFile(path: string, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
    return this.#send(MESSAGE.DELETE_FILE, { path }, [], signal);
  }

  terminate(): void {
    const error = new Error("The video engine was stopped.");
    for (const reject of this.#rejects.values()) reject(error);
    this.#resolves.clear();
    this.#rejects.clear();
    this.#logCallbacks = [];
    this.#progressCallbacks = [];
    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
    this.loaded = false;
  }
}
