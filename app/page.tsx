import type { Metadata } from "next";
import { HeroActions, FeaturedFooterLink } from "@/components/landing/hero-actions";
import { HeroDemo } from "@/components/landing/hero-demo";
import { ToolCard } from "@/components/tools/tool-card";
import { CategoryIcon } from "@/components/ui/icon";
import { FEATURED_SLUGS, TOOLS, getCategoryCounts, getTool } from "@/lib/tools/registry";
import { CATEGORIES, type CategoryId } from "@/lib/tools/types";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "LocalKit - Private file tools that run in your browser",
  description:
    "Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio. No uploads, accounts, or watermarks.",
  alternates: { canonical: SITE_URL },
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
    url: SITE_URL,
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">19 Tools. Zero uploads.</p>
            <h1 className="display-xl hero-title">Your files never leave this tab.</h1>
            <p className="body-l hero-sub">
              Compress, convert, merge, trim, and extract images, PDFs, video, GIFs, and audio.
              Every tool runs in your browser.
            </p>
            <HeroActions />
            <div className="hero-meta">
              <span>No account</span>
              <span>No watermark</span>
              <span>No file upload</span>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>

      <section className="section" id="tools">
        <div className="shell">
          <p className="section-label">01 / Toolbox</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h2 className="h2">Everyday files, handled.</h2>
              <p className="muted" style={{ marginTop: 12, maxWidth: 620 }}>
                Six of the most-used tools. The full set covers images, PDFs, video, GIFs, and audio.
              </p>
            </div>
            <FeaturedFooterLink />
          </div>
          <div className="tool-grid" style={{ marginTop: 40 }}>
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
          <p className="category-summary">
            {CATEGORIES.map((category) => `${category.name} ${counts[category.id]}`).join(" · ")}
          </p>
          <div style={{ marginTop: 12 }}>
            <FeaturedFooterLink />
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="shell">
          <p className="section-label">02 / How it works</p>
          <h2 className="display-l">Drop. Adjust. Done.</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">01</span>
              <h3>Add a file</h3>
              <p>Pick a tool and drop in a file, or try the bundled sample. Nothing is uploaded.</p>
            </div>
            <div className="step">
              <span className="step-number">02</span>
              <h3>Set your options</h3>
              <p>Choose the size, format, range, or quality you need. Defaults are sensible.</p>
            </div>
            <div className="step">
              <span className="step-number">03</span>
              <h3>Download the result</h3>
              <p>Preview the output and save it. Files stay in this tab.</p>
            </div>
          </div>
          <p className="section-note">No queue. No account. No upload bar.</p>
        </div>
      </section>

      <section className="section" id="why-local">
        <div className="shell">
          <p className="section-label">03 / Why local</p>
          <div className="why-grid">
            <div className="why-intro">
              <h2 className="h2">Privacy you can verify.</h2>
              <p>
                Open DevTools. Process a file. Watch the network tab stay quiet. That is the
                whole claim.
              </p>
              <a className="text-link" href="/privacy">
                Read the privacy details
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="why-item">
              <h3>Your files stay yours</h3>
              <p>
                Processing uses browser APIs, Canvas, and WebAssembly. No file bytes are sent to
                any server.
              </p>
            </div>
            <div className="why-item">
              <h3>No round trip</h3>
              <p>
                There is no upload, queue, or remote download. Speed depends on your device, not
                your connection.
              </p>
            </div>
            <div className="why-item">
              <h3>Nothing to sign up for</h3>
              <p>
                No account, email, or cloud storage. Close the tab and the working files are gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="shell">
          <p className="section-label">04 / FAQ</p>
          <div className="faq-grid">
            <div>
              <h2>Questions, answered.</h2>
              <p className="muted">
                Local processing means some answers depend on your browser and device. These are
                the honest ones.
              </p>
            </div>
            <div>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>
                      {faq.question}
                      <span className="faq-mark" aria-hidden="true" />
                    </summary>
                    <div className="faq-answer">{faq.answer}</div>
                  </details>
                ))}
              </div>
              <p className="faq-footer">
                Still curious?{" "}
                <a className="text-link" href="/privacy">
                  Read the privacy details
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
