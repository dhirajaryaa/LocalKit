import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SITE_NAME, absoluteUrl } from "@/lib/constants";
import { bodyL, cn, contentProse, displayL, eyebrow, shell, textLink } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Licenses",
  description:
    "The open-source libraries and fonts used by LocalKit, with their licenses and source links.",
  alternates: { canonical: absoluteUrl("/licenses") },
  openGraph: {
    title: `Licenses · ${SITE_NAME}`,
    description: "Third-party code, fonts, and licenses used by LocalKit.",
    url: absoluteUrl("/licenses"),
  },
};

interface LicenseItem {
  name: string;
  license: string;
  note?: string;
  source?: string;
}

const groups: Array<{ title: string; copy: string; items: LicenseItem[] }> = [
  {
    title: "App and interface",
    copy: "The framework, styling, icons, and search that make the site work.",
    items: [
      { name: "Next.js", license: "MIT" },
      { name: "React and React DOM", license: "MIT" },
      { name: "Tailwind CSS", license: "MIT" },
      { name: "HeroUI", license: "Apache-2.0" },
      { name: "Pikaicons", license: "MIT" },
      { name: "next-themes", license: "MIT" },
      { name: "Fuse.js", license: "Apache-2.0" },
    ],
  },
  {
    title: "Processing engines",
    copy: "These libraries do the actual work on your device. None of them upload files.",
    items: [
      { name: "pdf-lib", license: "MIT" },
      { name: "PDF.js", license: "Apache-2.0" },
      { name: "gifenc", license: "MIT" },
      { name: "gifuct-js", license: "MIT" },
      { name: "fflate", license: "MIT" },
      {
        name: "lamejs",
        license: "LGPL-3.0",
        note: "MP3 encoding. Source is available from the project repository.",
        source: "https://github.com/shijinyu/lamejs",
      },
      {
        name: "ffmpeg.wasm wrappers",
        license: "MIT",
        source: "https://github.com/ffmpegwasm/ffmpeg.wasm",
      },
      {
        name: "FFmpeg core",
        license: "GPL-2.0-or-later",
        note: "Video and GIF encoding, compiled to WebAssembly. Source and build information are available upstream.",
        source: "https://github.com/ffmpegwasm/ffmpeg.wasm",
      },
    ],
  },
  {
    title: "Typefaces",
    copy: "The three typefaces are served as part of the static build.",
    items: [
      { name: "Bricolage Grotesque", license: "SIL OFL 1.1" },
      { name: "Geist", license: "SIL OFL 1.1" },
      { name: "Geist Mono", license: "SIL OFL 1.1" },
    ],
  },
];

const licenseLinks = [
  { label: "MIT", href: "https://opensource.org/license/mit" },
  { label: "Apache-2.0", href: "https://www.apache.org/licenses/LICENSE-2.0" },
  {
    label: "GPL-2.0",
    href: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html",
  },
  { label: "LGPL-3.0", href: "https://www.gnu.org/licenses/lgpl-3.0.html" },
  { label: "SIL OFL 1.1", href: "https://openfontlicense.org" },
];

export default function LicensesPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className={cn(shell, "py-16 md:py-24")}>
          <p className={cn(eyebrow, "mb-5")}>Licenses</p>
          <h1 className={cn(displayL, "max-w-[860px]")}>Built on open-source work.</h1>
          <p className={cn(bodyL, "mt-5 max-w-[680px] text-ink-muted")}>
            LocalKit is possible because other people shared their code and typefaces. This page
            lists what runs inside the app, the license attached to each project, and where to find
            the source when one is required.
          </p>
        </div>
      </header>

      <div className={cn(shell, "py-16 md:py-24")}>
        <div className="grid gap-12 min-[900px]:grid-cols-[minmax(0,8fr)_minmax(260px,4fr)] min-[900px]:gap-16">
          <div className="min-w-0">
            {groups.map((group) => (
              <section key={group.title} className="mb-12 last:mb-0">
                <div className="border-b border-line pb-4">
                  <h2 className="text-2xl">{group.title}</h2>
                  <p className="mt-2 max-w-[620px] text-sm text-ink-muted">{group.copy}</p>
                </div>
                <ul className="m-0 list-none border-b border-line p-0">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="grid gap-2 border-t border-line py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-medium">{item.name}</span>
                          {item.source ? (
                            <a
                              className="inline-flex items-center gap-1 text-[11px] text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
                              href={item.source}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Source
                              <Icon name="external" size={11} />
                            </a>
                          ) : null}
                        </div>
                        {item.note ? (
                          <p className="mt-1.5 max-w-[560px] text-[13px] leading-normal text-ink-muted">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                      <span className="inline-flex w-fit items-center rounded border border-line bg-code px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-muted">
                        {item.license}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="border-t border-line pt-8">
              <h2 className="text-2xl">A note on copyleft engines</h2>
              <div className={cn(contentProse, "mt-3")}>
                <p>
                  FFmpeg core is licensed under GPL-2.0-or-later and lamejs under LGPL-3.0. They
                  are separate open-source components that run locally in your browser. Their
                  licenses apply to that software, not to the files you process or the output you
                  create with LocalKit.
                </p>
                <p>
                  The source links above point to the upstream projects. The bundled sample files
                  are test fixtures included to demonstrate each tool.
                </p>
              </div>
            </section>
          </div>

          <aside className="min-w-0">
            <div className="rounded-xl border border-line bg-surface p-5 min-[900px]:sticky min-[900px]:top-[88px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                License texts
              </p>
              <p className="mt-2 text-[13px] leading-normal text-ink-muted">
                The full text for each license family is available from the official sources.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {licenseLinks.map((link) => (
                  <a
                    key={link.label}
                    className="inline-flex h-8 items-center gap-1.5 rounded border border-line bg-raised px-2.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <Icon name="external" size={11} />
                  </a>
                ))}
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <Link className={textLink} href="/privacy">
                  How privacy works
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
