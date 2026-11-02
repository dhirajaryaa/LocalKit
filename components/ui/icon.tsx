import type { IconSvgElement } from "@pikaicons/react";
import { PikaIcon } from "@pikaicons/react";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BurgerMenuThreeIcon,
  CheckTickCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  CopyIcon,
  DeleteDustbin01Icon,
  DownloadDownIcon,
  ExternalLinkSquareIcon,
  File02Icon,
  FileIcon,
  GridDashboard02Icon,
  HeadphonesIcon,
  InformationCircleIcon,
  KeyboardWirelessIcon,
  LaptopIcon,
  LockCloseIcon,
  MinusIcon,
  MoonIcon,
  MultipleCrossCancelIcon,
  MusicBeamNoteIcon,
  PauseCircleIcon,
  PhotoImageIcon,
  PlayCircleIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ShieldCheckIcon,
  SunIcon,
  UploadUpIcon,
  VideoCallIcon,
} from "@pikaicons/core-free";

export type IconName =
  | "image"
  | "file"
  | "video"
  | "film"
  | "audio"
  | "search"
  | "upload"
  | "download"
  | "sun"
  | "moon"
  | "menu"
  | "close"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "minus"
  | "plus"
  | "trash"
  | "refresh"
  | "lock"
  | "shield"
  | "check"
  | "warning"
  | "error"
  | "info"
  | "play"
  | "pause"
  | "copy"
  | "external"
  | "laptop"
  | "keyboard"
  | "clock"
  | "grid"
  | "rotate-left"
  | "rotate-right"
  | "crop"
  | "waveform"
  | "sliders"
  | "scissors"
  | "frame";

const PIKA_ICONS: Partial<Record<IconName, IconSvgElement>> = {
  image: PhotoImageIcon,
  file: File02Icon,
  video: VideoCallIcon,
  audio: HeadphonesIcon,
  search: SearchIcon,
  upload: UploadUpIcon,
  download: DownloadDownIcon,
  sun: SunIcon,
  moon: MoonIcon,
  menu: BurgerMenuThreeIcon,
  close: MultipleCrossCancelIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-left": ArrowLeftIcon,
  "arrow-up": ArrowUpIcon,
  "arrow-down": ArrowDownIcon,
  minus: MinusIcon,
  plus: PlusIcon,
  trash: DeleteDustbin01Icon,
  refresh: RefreshIcon,
  lock: LockCloseIcon,
  shield: ShieldCheckIcon,
  check: CheckTickCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
  info: InformationCircleIcon,
  play: PlayCircleIcon,
  pause: PauseCircleIcon,
  copy: CopyIcon,
  external: ExternalLinkSquareIcon,
  laptop: LaptopIcon,
  keyboard: KeyboardWirelessIcon,
  clock: ClockIcon,
  grid: GridDashboard02Icon,
  "rotate-left": FileIcon,
  "rotate-right": FileIcon,
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
}

export function Icon({ name, size = 20, className, label }: IconProps) {
  const pika = PIKA_ICONS[name];
  if (pika) {
    return (
      <PikaIcon
        icon={pika}
        size={size}
        strokeWidth={1.5}
        className={className}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      />
    );
  }

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    role: label ? "img" : undefined,
  };

  if (name === "film") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
      </svg>
    );
  }
  if (name === "waveform") {
    return (
      <svg {...common}>
        <path d="M3 12h2l2-6 3 13 3-16 3 12 2-5h3" />
      </svg>
    );
  }
  if (name === "sliders") {
    return (
      <svg {...common}>
        <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="14" cy="18" r="2" />
      </svg>
    );
  }
  if (name === "rotate-left" || name === "rotate-right") {
    return (
      <svg {...common}>
        <path d="M4 9V4m0 5h5" />
        <path d="M4.6 9a8 8 0 1 1-1.1 3" />
      </svg>
    );
  }
  if (name === "crop") {
    return (
      <svg {...common}>
        <path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14" />
      </svg>
    );
  }
  if (name === "scissors") {
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M8.1 8.1 20 20M8.1 15.9 20 4" />
      </svg>
    );
  }
  if (name === "frame") {
    return (
      <svg {...common}>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
        <rect x="8" y="8" width="8" height="8" rx="1" />
      </svg>
    );
  }
  return <PikaIcon icon={FileIcon} size={size} className={className} strokeWidth={1.5} />;
}

export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: "images" | "pdf" | "video" | "gif" | "audio";
  size?: number;
  className?: string;
}) {
  const map = {
    images: "image",
    pdf: "file",
    video: "video",
    gif: "film",
    audio: "audio",
  } as const;
  return <Icon name={map[category]} size={size} className={className} />;
}
