import { BadgeCheck } from "lucide-react";
import type { CSSProperties } from "react";
import { XLogo } from "@/components/tweet-card";
import { isVerifiedHandle } from "@/lib/prompts";

type AiBrand = "claude" | "openai" | "gemini";

/**
 * Model logos from lobehub/lobe-icons (MIT, see THIRD-PARTY-NOTICES.md): 24×24
 * single paths, in the brand's own colour where it has one.
 */
const AI_MARKS: Record<AiBrand, { name: string; d: string; color?: string }> = {
  claude: {
    name: "Claude",
    color: "#D97757",
    d: "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z",
  },
  openai: {
    name: "OpenAI",
    d: "M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z",
  },
  gemini: {
    name: "Gemini",
    color: "#3186FF",
    d: "M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z",
  },
};

const AI_PATTERNS: [AiBrand, RegExp][] = [
  ["claude", /claude|anthropic|sonnet|opus|haiku/i],
  ["openai", /gpt|openai|codex|\bo[134]\b/i],
  ["gemini", /gemini/i],
];

export interface Author {
  /** What to show after "By": the @handle when there is one, else the name as written. */
  label: string;
  /** X handle, without the @. */
  handle?: string;
  ai?: AiBrand;
}

/**
 * The catalog's `author` is free text: "Name (@handle)", "@handle", a model
 * name like "Claude Sonnet 5.5 Medium", or just a name.
 */
export function parseAuthor(raw: string): Author {
  const handle = raw.match(/@([A-Za-z0-9_]{1,15})\b/)?.[1];
  const ai = AI_PATTERNS.find(([, re]) => re.test(raw))?.[0];
  return { label: handle ? `@${handle}` : raw, handle, ai };
}

export function AiMark({ brand, className = "size-3" }: { brand: AiBrand; className?: string }) {
  const mark = AI_MARKS[brand];
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={mark.name}
      className={className}
      fill={mark.color ?? "currentColor"}
      fillRule="evenodd"
      style={mark.color ? undefined : ({ color: "var(--foreground)" } as CSSProperties)}
    >
      <path d={mark.d} />
    </svg>
  );
}

/** Round chip behind an avatar; the initial shows through until the image loads. */
const chip =
  "relative inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/[0.08]";

/**
 * "By @someone": their avatar, a verified tick when X has one, and the
 * platform's logo at the end. A model's own logo stands bare, no circle.
 * Avatars are plain lazy <img>s of the X account; if one fails the initial stays.
 */
export function AuthorLine({ author, className = "" }: { author: string; className?: string }) {
  const { label, handle, ai } = parseAuthor(author);
  const verified = isVerifiedHandle(handle);
  return (
    <p
      className={`flex min-w-0 items-center gap-2 text-[0.8125rem] text-muted-foreground/80 ${className}`}
    >
      {handle && (
        <span className={`${chip} text-[0.625rem] font-medium uppercase text-muted-foreground`}>
          {handle[0]}
          <img
            src={`https://unavatar.io/x/${handle}`}
            alt=""
            width={20}
            height={20}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full object-cover"
          />
        </span>
      )}
      {ai && <AiMark brand={ai} className="size-5 shrink-0" />}
      <span className="min-w-0 truncate">
        By <span className="text-foreground/80">{label}</span>
      </span>
      {verified && (
        <BadgeCheck className="-ms-1 size-3.5 shrink-0 text-brand" aria-label="Verified" />
      )}
      {handle && <XLogo className="ms-auto size-3.5 shrink-0" />}
    </p>
  );
}
