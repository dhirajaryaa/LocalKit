export async function fetchSampleFile(
  path: string,
  fileName: string,
  type: string,
): Promise<File> {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) throw new Error("The sample could not be loaded.");
  const blob = await response.blob();
  return new File([blob], fileName, { type, lastModified: Date.now() });
}

export const SAMPLES = {
  image: { path: "/samples/sample-photo.jpg", name: "sample-photo.jpg", type: "image/jpeg" },
  pdf: { path: "/samples/sample-document.pdf", name: "sample-document.pdf", type: "application/pdf" },
  pdfAppendix: {
    path: "/samples/sample-appendix.pdf",
    name: "sample-appendix.pdf",
    type: "application/pdf",
  },
  video: { path: "/samples/sample-video.mp4", name: "sample-video.mp4", type: "video/mp4" },
  audio: { path: "/samples/sample-audio.mp3", name: "sample-audio.mp3", type: "audio/mpeg" },
} as const;
