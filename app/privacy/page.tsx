import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SITE_NAME, absoluteUrl } from "@/lib/constants";
import { bodyL, cn, contentProse, displayL, eyebrow, panel, shell, textLink } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "LocalKit processes files on your device. No uploads, no accounts, no analytics, and no file data sent to dhirajarya.in.",
  alternates: { canonical: absoluteUrl("/privacy") },
  openGraph: {
    title: `Privacy · ${SITE_NAME}`,
    description: "How LocalKit keeps files local and what the app stores in your browser.",
    url: absoluteUrl("/privacy"),
  },
};

const points = [
  {
    title: "Files stay in this tab",
    copy: "File bytes are read by your browser and processed in memory. They are never sent to a server.",
  },
  {
    title: "No file data in requests",
    copy: "The only external request is public profile text from dhirajarya.in. It contains no file names, bytes, or results.",
  },
  {
    title: "No account or tracking",
    copy: "There is no login, analytics script, advertising pixel, or cross-site profile.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className={cn(shell, "py-16 md:py-24")}>
          <p className={cn(eyebrow, "mb-5")}>Privacy</p>
          <h1 className={cn(displayL, "max-w-[820px]")}>Your files stay in this tab.</h1>
          <p className={cn(bodyL, "mt-5 max-w-[680px] text-ink-muted")}>
            LocalKit is built around one rule: file bytes never leave your device. This page explains
            exactly what that means, including the small amount of browser storage the app uses.
          </p>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
            Last updated · November 2, 2026
          </p>
        </div>
      </header>

      <div className={cn(shell, "grid gap-12 py-16 md:py-24 min-[900px]:grid-cols-[minmax(0,8fr)_minmax(260px,4fr)] min-[900px]:gap-16")}>
        <article className={cn(contentProse, "max-w-[720px]")}>
          <h2>Files are processed locally</h2>
          <p>
            Images are decoded with Canvas, PDFs are edited with pdf-lib and rendered with PDF.js,
            audio is processed with Web Audio and lamejs, GIFs are encoded with gifenc, and video is
            encoded with FFmpeg compiled to WebAssembly. Those engines run in your browser tab.
          </p>
          <p>
            There is no upload endpoint, queue, or cloud storage. If you open the network panel while
            using a tool, you will see the app&apos;s static assets and the bundled engine files. You
            will not see your document, image, audio, or video.
          </p>

          <h2>What the app stores</h2>
          <p>LocalKit keeps a few preferences in your browser:</p>
          <ul>
            <li>
              <strong>Theme</strong> in local storage, so light or dark mode survives a reload.
            </li>
            <li>
              <strong>Recent tools</strong> in local storage: the last five tool page names you
              opened. You can clear them from the search palette.
            </li>
            <li>
              <strong>Public profile cache</strong> in session storage, so the footer does not repeat
              the same public request on every page.
            </li>
          </ul>
          <p>
            These entries contain no file contents, file names, or processing results. They stay in
            your browser and are not sent anywhere.
          </p>

          <h2>The one external request</h2>
          <p>
            The footer loads a public profile summary from{" "}
            <a href="https://dhirajarya.in/llms.txt" target="_blank" rel="noopener noreferrer">
              https://dhirajarya.in/llms.txt
            </a>
            . The request is sent without credentials and without a referrer, and it times out after
            3.5 seconds. It does not include file data, file names, or tool results. If the request
            fails, the footer uses a built-in fallback.
          </p>
          <p>
            Links to my other projects open in a new tab only when you click them. No file data is
            added to those links.
          </p>

          <h2>Third-party code</h2>
          <p>
            The processing engines are open-source libraries. Their licenses are listed on the{" "}
            <Link href="/licenses">licenses page</Link>. They run locally and do not receive your
            files.
          </p>

          <h2>Limits and failures</h2>
          <p>
            Each tool shows its own file-size and duration limit. If a file is too large for your
            device&apos;s memory, the job stops and the app says so. Closing the tab discards
            in-memory work. Download the result before closing.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about privacy can go to{" "}
            <a href="mailto:hello@dhirajarya.in">hello@dhirajarya.in</a>. This is a static app, so
            there is no account to delete and no server-side file history to request.
          </p>
        </article>

        <aside className="min-w-0">
          <div className={cn(panel, "p-5 min-[900px]:sticky min-[900px]:top-[88px]")}>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
              At a glance
            </p>
            <div className="mt-4 grid gap-5">
              {points.map((point) => (
                <div key={point.title} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded border border-success/35 text-success">
                      <Icon name="check" size={13} />
                    </span>
                    <h2 className="text-[15px] tracking-[-0.01em]">{point.title}</h2>
                  </div>
                  <p className="mt-2 text-[13px] leading-normal text-ink-muted">{point.copy}</p>
                </div>
              ))}
            </div>
            <Link className={cn(textLink, "mt-6")} href="/licenses">
              Read the licenses
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
