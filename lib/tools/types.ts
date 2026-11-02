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
}

export const CATEGORIES: Category[] = [
  { id: "images", name: "Images", singular: "image", icon: "image" },
  { id: "pdf", name: "PDF", singular: "PDF", icon: "file" },
  { id: "video", name: "Video", singular: "video", icon: "video" },
  { id: "gif", name: "GIF", singular: "GIF", icon: "film" },
  { id: "audio", name: "Audio", singular: "audio", icon: "audio" },
];
