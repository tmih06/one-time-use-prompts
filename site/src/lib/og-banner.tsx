import type { ReactNode } from "react";

/**
 * Social banners (1200×630). Drawn as a dark ticket — a nod to "one-time-use" — with the
 * content on the left and a perforated stub on the right. Pure layout: no site imports,
 * so it can be rendered on its own. The route in pages/og/prompts/ feeds it real data.
 */

export const bannerSize = { width: 1200, height: 630 } as const;

const BRAND = "#0a84ff";
const BG = "#0c0c0c";
const CARD = "#141416";
const LINE = "rgba(255,255,255,0.09)";
const MUTED = "#98989b";
const STUB = 250;

/** The ticket mark from favicon.svg, on a brand-blue tile. */
function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: BRAND,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2M13 17v2M13 11v2" />
      </svg>
    </div>
  );
}

const Pill = ({ children, strong }: { children: ReactNode; strong?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: 44,
      padding: "0 20px",
      borderRadius: 22,
      fontSize: 22,
      fontWeight: 500,
      color: strong ? "#fff" : "#c8c8cc",
      backgroundColor: strong ? "rgba(10,132,255,0.22)" : "rgba(255,255,255,0.07)",
      border: `1px solid ${strong ? "rgba(10,132,255,0.5)" : "rgba(255,255,255,0.08)"}`,
    }}
  >
    {children}
  </div>
);

interface FrameProps {
  /** Left side: everything except the wordmark row. */
  children: ReactNode;
  /** Small caption above the stub's big figure. */
  stubLabel: string;
  stubFigure: string;
  stubCaption: string;
  /** Right end of the top row (phase pill on prompt pages). */
  topRight?: ReactNode;
  /** Pills along the bottom edge of the main area. */
  footer?: ReactNode;
}

function Frame({ children, stubLabel, stubFigure, stubCaption, topRight, footer }: FrameProps) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 36,
        backgroundColor: BG,
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          borderRadius: 32,
          border: `1px solid ${LINE}`,
          backgroundColor: CARD,
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(10,132,255,0.28) 0%, rgba(10,132,255,0) 55%)",
        }}
      >
        {/* Main area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "44px 52px 44px 56px",
            color: "#f5f5f5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Logo />
              <div
                style={{
                  fontFamily: "Orbitron",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                One-Time-Use Prompts
              </div>
            </div>
            {topRight}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              paddingTop: 12,
            }}
          >
            {children}
          </div>
          <div style={{ display: "flex", gap: 12, height: 44 }}>{footer}</div>
        </div>

        {/* Perforation + stub */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: STUB,
            borderLeft: "3px dashed rgba(255,255,255,0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "Geist Mono",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {stubLabel}
            </div>
            <div
              style={{
                fontFamily: "Orbitron",
                fontWeight: 800,
                fontSize: 104,
                lineHeight: 1,
                color: BRAND,
              }}
            >
              {stubFigure}
            </div>
            <div
              style={{
                fontFamily: "Geist Mono",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {stubCaption}
            </div>
          </div>
        </div>

        {/* Notches where the stub tears off */}
        {[-26, 630 - 72 - 26].map((top) => (
          <div
            key={top}
            style={{
              position: "absolute",
              top,
              right: STUB - 26 - 1,
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: BG,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export interface HomeBannerProps {
  count: number;
  phases: { title: string; kicker: string }[];
}

export function HomeBanner({ count, phases }: HomeBannerProps) {
  return (
    <Frame
      stubLabel="Library"
      stubFigure={String(count)}
      stubCaption={count === 1 ? "prompt" : "prompts"}
      footer={phases.map((p) => (
        <Pill key={p.title}>
          {p.title} · {p.kicker}
        </Pill>
      ))}
    >
      <div
        style={{
          display: "flex",
          fontSize: 92,
          fontWeight: 700,
          lineHeight: 1.02,
          letterSpacing: -3,
        }}
      >
        Prompts that run exactly once.
      </div>
      <div style={{ display: "flex", marginTop: 26, fontSize: 30, lineHeight: 1.35, color: MUTED }}>
        Focused instructions for one moment in a project’s life. Copy one, run it, move on.
      </div>
    </Frame>
  );
}

export interface PromptBannerProps {
  title: string;
  description: string;
  phase: string;
  kicker: string;
  purpose: string;
  tags: string[];
}

/** Cut at a word boundary so the ellipsis never lands mid-word. */
const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;

export function PromptBanner({
  title,
  description,
  phase,
  kicker,
  purpose,
  tags,
}: PromptBannerProps) {
  // Long titles step down a size instead of running to four lines.
  const size = title.length <= 24 ? 80 : title.length <= 40 ? 68 : 56;
  return (
    <Frame
      stubLabel="Run"
      stubFigure="1×"
      stubCaption="then done"
      topRight={
        <Pill strong>
          {phase} · {kicker}
        </Pill>
      }
      footer={tags.slice(0, 4).map((tag) => (
        <Pill key={tag}>{tag}</Pill>
      ))}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Geist Mono",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: BRAND,
        }}
      >
        {purpose}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 16,
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -size / 28,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "block",
          marginTop: 22,
          fontSize: 28,
          lineHeight: 1.38,
          color: MUTED,
          lineClamp: 2,
        }}
      >
        {clip(description, 100)}
      </div>
    </Frame>
  );
}
