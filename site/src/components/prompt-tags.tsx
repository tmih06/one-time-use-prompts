import { ExternalLink } from "lucide-react";

interface PromptTagsProps {
  phase?: string;
  purpose?: string;
  tags?: string[];
  author?: string;
  source?: string[];
}

/** Stable 0–359 hue per string, so a given tag is always the same colour. */
export function hue(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * The prompt's catalog metadata as coloured chips, rendered directly under
 * the page title: phase + purpose first (stronger), then tags, then author
 * and source links in neutral chips.
 */
export function PromptTags({ phase, purpose, tags = [], author, source = [] }: PromptTagsProps) {
  const colored = [
    ...(phase ? [{ label: phase, strong: true }] : []),
    ...(purpose ? [{ label: purpose, strong: true }] : []),
    ...tags.map((label) => ({ label: `#${label}`, strong: false, key: label })),
  ];
  if (colored.length === 0 && !author && source.length === 0) return null;

  return (
    <ul
      className="not-prose -mt-1 mb-5 flex flex-wrap items-center gap-1.5"
      aria-label="Prompt tags"
    >
      {colored.map((tag) => (
        <li
          key={tag.label}
          className="tag"
          data-strong={tag.strong || undefined}
          style={{ "--h": hue("key" in tag ? tag.key : tag.label) } as React.CSSProperties}
        >
          {tag.label}
        </li>
      ))}
      {author && <li className="tag tag-neutral">by {author}</li>}
      {source.map((url) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="tag tag-neutral hover:text-fd-foreground"
          >
            {hostOf(url)}
            <ExternalLink className="size-3" />
          </a>
        </li>
      ))}
    </ul>
  );
}
