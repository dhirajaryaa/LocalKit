export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const shell =
  "mx-auto w-[calc(100%-2.5rem)] max-w-[1200px] md:w-[calc(100%-5rem)]";

export const section = "scroll-mt-16 border-t border-line py-16 md:py-24";
export const sectionLabel =
  "mb-7 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted before:h-px before:w-6 before:bg-line-strong before:content-['']";
export const eyebrow = "font-mono text-xs uppercase tracking-[0.08em] text-accent";
export const displayXl =
  "font-display text-[clamp(48px,14vw,64px)] font-semibold leading-[0.94] tracking-[-0.045em] md:text-[clamp(52px,8vw,96px)]";
export const displayL =
  "font-display text-[clamp(40px,5vw,64px)] font-semibold leading-none tracking-[-0.04em]";
export const h1 = "text-[clamp(36px,4.2vw,48px)]";
export const h2 = "text-[clamp(28px,3.4vw,36px)]";
export const h3 = "text-[clamp(20px,2vw,24px)]";
export const bodyL = "text-[clamp(17px,1.5vw,18px)] leading-[1.55]";
export const muted = "text-ink-muted";
export const label = "block font-mono text-[11px] uppercase tracking-[0.05em] text-ink-muted";

export const btn =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-4 text-sm font-medium leading-none transition-colors disabled:opacity-50";
export const btnPrimary = cn(btn, "border-accent bg-accent text-accent-ink hover:brightness-90");
export const btnSecondary = cn(
  btn,
  "border-line bg-surface text-ink hover:border-line-strong",
);
export const btnGhost = cn(btn, "text-ink hover:bg-code");
export const btnDanger = cn(
  btn,
  "border-danger/35 bg-transparent text-danger hover:border-danger",
);
export const btnSm = "min-h-8 px-3 text-[13px]";
export const btnLg = "min-h-[46px] px-5 text-[15px]";
export const btnBlock = "w-full";

export const brand =
  "inline-flex items-center gap-2.5 font-display text-[19px] font-bold tracking-[-0.03em]";
export const brandMark = "shrink-0 text-ink [&_circle]:fill-accent";
export const headerNav =
  "ml-9 mr-auto hidden items-center gap-[26px] text-sm font-medium md:flex [&_a]:text-ink-muted [&_a:hover]:text-ink";

export const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-colors hover:border-line hover:text-ink disabled:opacity-40";
export const textLink =
  "inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-accent";

export const kbd =
  "inline-flex h-5 min-w-[22px] items-center justify-center rounded border border-line bg-code px-1 font-mono text-[11px] leading-none text-ink-muted";

export const panel = "rounded-xl border border-line bg-surface";
export const panelHeader =
  "flex items-center justify-between gap-3 border-b border-line px-5 py-3.5";
export const panelTitle = "font-sans text-sm font-semibold tracking-normal";
export const panelBody = "p-5";

export const field = "flex min-w-0 flex-col gap-1.5";
export const fieldLabel = "font-mono text-[11px] uppercase tracking-[0.05em] text-ink-muted";
export const input =
  "h-10 w-full rounded-lg border border-line bg-raised px-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-55";
export const inputSm = "h-[34px] text-[13px]";
export const select = input;
export const textarea =
  "min-h-[84px] w-full resize-y rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-55";
export const range = "w-full accent-accent";
export const checkboxRow = "flex min-h-6 items-center gap-2 text-[13px] accent-accent";
export const optionHelp = "text-xs leading-[1.45] text-ink-muted";
export const optionValue = "font-mono text-[11px] tabular-nums text-ink-muted";
export const twoCol = "grid grid-cols-2 gap-2.5";
export const threeCol = "grid grid-cols-3 gap-2";

export const chip =
  "inline-flex h-[22px] items-center rounded bg-code px-1.5 font-mono text-[10px] uppercase tracking-[0.02em] text-ink-muted";
export const localBadge =
  "inline-flex h-6 items-center gap-1.5 rounded border border-success/35 px-2 font-mono text-[10px] uppercase tracking-[0.05em] text-success";

export const inlineNote =
  "rounded-md border border-line bg-code px-3 py-2.5 text-xs leading-normal text-ink-muted";
export const inlineWarning = cn(inlineNote, "border-accent/30 text-ink");
export const inlineDanger = cn(inlineNote, "border-danger/35 text-danger");
export const inlineSuccess = cn(inlineNote, "border-success/35 text-success");

export const toolGrid =
  "grid grid-cols-1 border-l border-t border-line md:grid-cols-2 xl:grid-cols-3";

export const statsGrid = "grid grid-cols-3 gap-2 border-y border-line py-3";
export const statLabel =
  "mb-0.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted";
export const statValue = "text-base font-medium tabular-nums";

export const dropzone =
  "relative flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-9 text-center transition-colors focus-within:ring-2 focus-within:ring-accent/25 md:min-h-[260px]";
export const dropzoneDragging = "border-accent bg-accent/[0.04]";

export const progressTrack = "h-1 overflow-hidden rounded-sm bg-code";
export const progressBar = "h-full bg-accent transition-[width] duration-200";

export const segmented =
  "grid grid-flow-col auto-cols-fr overflow-hidden rounded-lg border border-line";
export const segmentedButton =
  "h-[34px] border-r border-line bg-raised text-xs text-ink-muted last:border-r-0 aria-pressed:bg-ink aria-pressed:text-bg";

export const colorRow = "flex items-center gap-2";
export const colorInput =
  "h-[38px] w-[38px] shrink-0 rounded-md border border-line bg-raised p-0.5";

export const fileList =
  "flex flex-col overflow-hidden rounded-xl border border-line bg-surface";
export const fileRow =
  "flex items-center gap-2 border-b border-line p-2.5 last:border-b-0 md:gap-3 md:p-3";
export const fileName = "truncate text-[13px] font-medium";
export const fileMeta =
  "mt-0.5 flex gap-2 font-mono text-[10px] tabular-nums text-ink-muted";
export const fileAction =
  "inline-flex size-[34px] items-center justify-center rounded bg-transparent text-ink-muted transition-colors hover:bg-code hover:text-ink disabled:opacity-40 md:size-[30px]";
export const fileListFooter =
  "flex items-center justify-between gap-3 border-t border-line px-3 py-2.5 font-mono text-[10px] text-ink-muted";

export const resultPanel = "overflow-hidden rounded-xl border border-line bg-surface";
export const resultHeader =
  "flex items-center justify-between gap-4 border-b border-line px-5 py-3.5";
export const resultBody = "p-5";
export const resultsGrid =
  "grid grid-cols-3 gap-2 border-b border-line pb-4 mb-4 md:gap-3";
export const resultStatLabel =
  "mb-0.5 block font-mono text-[10px] uppercase tracking-[0.06em] text-ink-muted";
export const resultStatValue = "text-sm font-medium tabular-nums md:text-base";
export const resultPreview =
  "flex max-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-line bg-code";
export const resultActions = "mt-4 flex flex-wrap gap-2";
export const honesty =
  "mt-3.5 border-l-2 border-accent px-3 py-2.5 text-[13px] text-ink-muted";

export const contentPage = "py-16 md:py-24";
export const contentProse =
  "[&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:text-2xl [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-lg [&_p]:text-[15px] [&_p]:text-ink-muted [&_p+p]:mt-3.5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-[15px] [&_li]:text-ink-muted [&_li+li]:mt-1.5 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-code [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-ink";
