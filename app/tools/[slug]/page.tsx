import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolRunner } from "@/components/tools/tool-runner";
import { ToolViewTracker } from "@/components/tools/tool-view-tracker";
import { CategoryIcon, Icon } from "@/components/ui/icon";
import { OG_IMAGE, SITE_NAME, absoluteUrl } from "@/lib/constants";
import { TOOLS, getRelatedTools, getTool } from "@/lib/tools/registry";
import { CATEGORIES } from "@/lib/tools/types";
import { chip, cn, eyebrow, localBadge, shell } from "@/lib/ui";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const title = tool.name.length > 48 ? tool.name : `${tool.name} - ${SITE_NAME}`;
  const url = absoluteUrl(`/tools/${tool.slug}`);
  return {
    title,
    description: tool.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${tool.name} · ${SITE_NAME}`,
      description: tool.description,
      url,
      images: [
        {
          url: absoluteUrl(OG_IMAGE),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${tool.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} · ${SITE_NAME}`,
      description: tool.description,
      images: [absoluteUrl(OG_IMAGE)],
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const category = CATEGORIES.find((item) => item.id === tool.category);
  const related = getRelatedTools(tool);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      description: tool.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      url: absoluteUrl(`/tools/${tool.slug}`),
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Tools", item: absoluteUrl("/tools") },
        {
          "@type": "ListItem",
          position: 3,
          name: tool.name,
          item: absoluteUrl(`/tools/${tool.slug}`),
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolViewTracker slug={tool.slug} />
      <nav
        className={cn(
          shell,
          "flex flex-wrap items-center gap-2 pt-7 text-[13px] text-ink-muted [&_a:hover]:text-ink",
        )}
        aria-label="Breadcrumb"
      >
        <Link href="/tools">Tools</Link>
        <Icon name="chevron-right" size={13} />
        <Link href={`/tools?category=${tool.category}`}>{category?.name ?? tool.category}</Link>
        <Icon name="chevron-right" size={13} />
        <span aria-current="page">{tool.name}</span>
      </nav>

      <header className={cn(shell, "pb-7 pt-6 md:pb-9 md:pt-8")}>
        <div className="flex items-start gap-3.5 md:gap-[18px]">
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-line md:size-[52px]"
            aria-hidden="true"
          >
            <CategoryIcon category={tool.category} size={26} />
          </span>
          <div>
            <h1 className="text-[32px] md:text-[clamp(34px,4vw,44px)]">{tool.name}</h1>
            <p className="mt-2 max-w-[720px] text-ink-muted">{tool.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={localBadge}>
                <Icon name="laptop" size={12} />
                Runs locally
              </span>
              <span className={chip}>{category?.name ?? tool.category}</span>
              <span className="flex flex-wrap gap-1" aria-label="Input formats">
                {tool.inputFormats.map((format) => (
                  <span className={chip} key={`in-${format}`}>
                    {format}
                  </span>
                ))}
              </span>
              <Icon name="arrow-right" size={13} />
              <span className="flex flex-wrap gap-1" aria-label="Output formats">
                {tool.outputFormats.map((format) => (
                  <span className={chip} key={`out-${format}`}>
                    {format}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </header>

      <ToolRunner slug={tool.slug} />

      <section className="border-t border-line py-12 md:py-[72px]">
        <div className={shell}>
          <div className="grid gap-12 min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:gap-16">
            <div>
              <h2 className="mb-5 text-2xl">How it works</h2>
              <ol className="m-0 list-none border-t border-line p-0">
                {tool.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-[18px] border-b border-line py-4 last:border-b-0"
                  >
                    <span className={cn(eyebrow, "pt-[3px] text-[11px]")}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-ink-muted">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="mb-5 text-2xl">Good to know</h2>
              <ul className="m-0 list-none border-t border-line p-0">
                {tool.notes.map((note) => (
                  <li
                    key={note}
                    className="relative border-b border-line py-3 pl-[18px] text-[13px] text-ink-muted before:absolute before:left-0 before:top-[21px] before:h-px before:w-1.5 before:bg-line-strong before:content-['']"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {related.length > 0 ? (
            <div className="mt-12">
              <h2 className="mb-4 text-2xl">Related tools</h2>
              <div className="grid grid-cols-1 border-l border-t border-line md:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tools/${item.slug}`}
                    className="group min-h-[120px] border-b border-r border-line bg-bg p-4 transition-colors hover:bg-surface"
                  >
                    <h3 className="text-base">{item.name}</h3>
                    <p className="mt-1 text-xs text-ink-muted">{item.tagline}</p>
                    <span
                      className="mt-3.5 block text-line-strong transition-colors group-hover:text-accent"
                      aria-hidden="true"
                    >
                      <Icon name="arrow-right" size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
