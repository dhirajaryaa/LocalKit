export type CategoryId = "images" | "pdf" | "video" | "gif" | "audio";

export type ToolStatus = "live";

export interface Tool {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  tagline: string;
  keywords: string[];
  aliases: string[];
  inputFormats: string[];
  outputFormats: string[];
  icon: string;
  related: string[];
  steps: [string, string, string];
  notes: string[];
  priority: 0;
  status: ToolStatus;
}

export interface Category {
  id: CategoryId;
  name: string;
  singular: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "images",
    name: "Images",
    singular: "image",
    icon: "image",
    description: "Convert, compress, resize, and build favicons.",
  },
  {
    id: "pdf",
    name: "PDF",
    singular: "PDF",
    icon: "file",
    description: "Merge, split, organize, and clean up documents.",
  },
  {
    id: "video",
    name: "Video",
    singular: "video",
    icon: "video",
    description: "Compress, trim, and turn clips into GIFs.",
  },
  {
    id: "gif",
    name: "GIF",
    singular: "GIF",
    icon: "film",
    description: "Build and optimize short animations.",
  },
  {
    id: "audio",
    name: "Audio",
    singular: "audio",
    icon: "audio",
    description: "Convert and trim sound files.",
  },
];
