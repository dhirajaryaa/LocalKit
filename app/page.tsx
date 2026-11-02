import type { Metadata } from "next";
import Link from "next/link";
import { HeroActions, FeaturedFooterLink } from "@/components/landing/hero-actions";
import { HeroDemo } from "@/components/landing/hero-demo";
import { ToolCard } from "@/components/tools/tool-card";
import { CategoryIcon, Icon } from "@/components/ui/icon";
import { FEATURED_SLUGS, TOOLS, getCategoryCounts, getTool } from "@/lib/tools/registry";
import { CATEGORIES } from "@/lib/tools/types";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/constants";
import {
  bodyL,
  cn,
  displayL,
  displayXl,
  eyebrow,
  h2 as h2Class,
  muted,
  section,
  sectionLabel,
  shell,
  textLink,
  toolGrid,
} from "@/lib/ui";

export const metadata: Metadata = {
  title: "LocalKit - Private file tools that run in your browser",
  description:
    "Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio. No uploads, accounts, or watermarks.",
  alternates: { canonical: absoluteUrl("/") },
};

const featured = FEATURED_SLUGS.map((slug) => getTool(slug)).filter(
  (tool): tool is NonNullable<ReturnType<typeof getTool>> => Boolean(tool),
);

const counts = getCategoryCounts();

const faqs = [
  {
    question: "Are my files uploaded anywhere?",
    answer:
      "No. Every tool runs in your browser. Files are read from your device, processed in memory, and never sent to a server.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Only what your browser can hold in memory. Each tool shows its own limit. For video, stay under 500 MB and 20 minutes on a desktop for a reliable run.",
  },
  {
    question: "Do I need an account?",
    answer: "No. There is no sign-up, login, or cloud storage.",
  },
  {
    question: "Is it free?",
    answer: "Yes. No ads, no paywall, and no watermark on your output.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Processing is local, but the app needs its first load from the web. Offline support is not part of this version.",
  },
  {
    question: "Which browsers work best?",
    answer:
      "Current Chrome, Edge, Firefox, and Safari handle images, PDFs, and audio. Video and GIF encoding is fastest in desktop Chrome or Edge.",
  },
  {
    question: "Why is video slower than the other tools?",
    answer:
      "Video encoding uses FFmpeg compiled to WebAssembly and runs in a single thread. It is private, but slower than a native app. Keep clips short.",
  },
  {
    question: "Can I use the output commercially?",
    answer:
      "Yes. Your files remain yours. Third-party libraries have their own licenses, listed on the licenses page.",
  },
  {
    question: "What happens if I close the tab?",
    answer:
      "The job stops and in-memory files are discarded. Download your result before closing.",
  },
  {
    question: "Do you track me?",
    answer:
      "No analytics, cookies, or fingerprinting. The footer fetches public profile text from dhirajarya.in. That request contains no file data.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: absoluteUrl("/"),
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
];

const heroMeta =
  "flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-muted md:text-[11px] [&>span+span]:before:mr-2.5 [&>span+span]:before:text-line-strong [&>span+span]:before:content-['·']";

const categoryChip =
  "inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink transition-colors hover:border-line-strong";

const stepTitle =
  "mt-5 border-t border-line pt-5 font-display text-[22px] font-semibold leading-tight tracking-[-0.035em]";
const stepCopy = "mt-2 text-[15px] leading-normal text-ink-muted";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="pb-16 pt-12 md:pb-24 md:pt-[84px]">
        <div
          className={cn(
            shell,
            "grid items-start gap-11 min-[900px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[900px]:gap-10 lg:gap-16",
          )}
        >
          <div className="min-[900px]:pt-[18px]">
            <p className={eyebrow}>19 Tools. Zero uploads.</p>
            <h1 className={cn(displayXl, "mt-[22px] max-w-[760px]")}>
              Your files never leave this tab.
            </h1>
            <p className={cn(bodyL, "mt-[26px] max-w-[52ch] text-ink-muted")}>
              Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio.
              Every tool runs in your browser.
            </p>
            <HeroActions />
            <div className={cn(heroMeta, "mt-[22px]")}>
              <span>No account</span>
              <span>No watermark</span>
              <span>No file upload</span>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>

      <section className={section} id="tools">
        <div className={shell}>
          <p className={sectionLabel}>
            <Icon name="grid" size={13} />
            01 / Toolbox
          </p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className={h2Class}>Everyday files, handled.</h2>
              <p className={cn(muted, "mt-3 max-w-[620px]")}>
                Six of the most-used tools. The full set covers images, PDFs, video, GIFs, and audio.
              </p>
            </div>
            <FeaturedFooterLink />
          </div>
          <div className={cn(toolGrid, "mt-10")}>
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/tools?category=${category.id}`}
                className={categoryChip}
              >
                <CategoryIcon category={category.id} size={14} />
                {category.name}
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-code px-1 font-mono text-[9px] tabular-nums text-ink-muted">
                  {counts[category.id]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={section} id="how-it-works">
        <div className={shell}>
          <p className={sectionLabel}>
            <Icon name="sliders" size={13} />
            02 / How it works
          </p>
          <h2 className={displayL}>Drop. Adjust. Done.</h2>
          <div className="mt-9 grid gap-8 md:mt-14 md:grid-cols-3 md:gap-10">
            <div>
              <span className={eyebrow}>01</span>
              <h3 className={stepTitle}>Add a file</h3>
              <p className={stepCopy}>
                Pick a tool and drop in a file, or try the bundled sample. Nothing is uploaded.
              </p>
            </div>
            <div>
              <span className={eyebrow}>02</span>
              <h3 className={stepTitle}>Set your options</h3>
              <p className={stepCopy}>
                Choose the size, format, range, or quality you need. Defaults are sensible.
              </p>
            </div>
            <div>
              <span className={eyebrow}>03</span>
              <h3 className={stepTitle}>Download the result</h3>
              <p className={stepCopy}>Preview the output and save it. Files stay in this tab.</p>
            </div>
          </div>
          <p className="mt-12 font-mono text-xs tracking-[0.04em] text-ink-muted">
            No queue. No account. No upload bar.
          </p>
        </div>
      </section>

      <section className={section} id="why-local">
        <div className={shell}>
          <p className={sectionLabel}>
            <Icon name="shield" size={13} />
            03 / Why local
          </p>
          <div className="grid gap-7 md:grid-cols-2 md:gap-10 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
            <div className="max-w-[360px] md:col-span-2 xl:col-span-1">
              <h2 className={cn(h2Class, "mb-[18px]")}>Privacy you can verify.</h2>
              <p className="text-[15px] leading-normal text-ink-muted">
                Open DevTools. Process a file. Watch the network tab stay quiet. That is the whole
                claim.
              </p>
              <Link className={cn(textLink, "mt-[22px]")} href="/privacy">
                Read the privacy details
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div>
              <h3 className="border-t border-line pt-[18px] text-xl">Your files stay yours</h3>
              <p className="mt-2.5 text-sm leading-normal text-ink-muted">
                Processing uses browser APIs, Canvas, and WebAssembly. No file bytes are sent to
                any server.
              </p>
            </div>
            <div>
              <h3 className="border-t border-line pt-[18px] text-xl">No round trip</h3>
              <p className="mt-2.5 text-sm leading-normal text-ink-muted">
                There is no upload, queue, or remote download. Speed depends on your device, not
                your connection.
              </p>
            </div>
            <div>
              <h3 className="border-t border-line pt-[18px] text-xl">Nothing to sign up for</h3>
              <p className="mt-2.5 text-sm leading-normal text-ink-muted">
                No account, email, or cloud storage. Close the tab and the working files are gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={section} id="faq">
        <div className={shell}>
          <p className={sectionLabel}>
            <Icon name="info" size={13} />
            04 / FAQ
          </p>
          <div className="grid gap-8 min-[900px]:grid-cols-[4fr_8fr] min-[900px]:gap-16">
            <div>
              <h2 className={cn(h2Class, "mb-5")}>Questions, answered.</h2>
              <p className={cn(muted, "text-sm")}>
                Local processing means some answers depend on your browser and device. These are
                the honest ones.
              </p>
            </div>
            <div>
              <div className="border-t border-line">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group border-b border-line">
                    <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-6 py-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <span
                        className="relative size-4 shrink-0 before:absolute before:left-px before:top-[7px] before:h-px before:w-3.5 before:bg-ink-muted before:transition-transform before:content-[''] after:absolute after:left-px after:top-[7px] after:h-px after:w-3.5 after:rotate-90 after:bg-ink-muted after:transition-transform after:content-[''] group-open:after:rotate-0"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="pb-5 pr-7 text-[15px] text-ink-muted">{faq.answer}</div>
                  </details>
                ))}
              </div>
              <p className="mt-5 text-sm text-ink-muted">
                Still curious?{" "}
                <Link className={textLink} href="/privacy">
                  Read the privacy details
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
