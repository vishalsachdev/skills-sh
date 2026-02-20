# Skills.sh Trend Report: Feb 15-19, 2026

**Period:** 5 daily snapshots (2026-02-15 through 2026-02-19)
**Total skills tracked:** 820 unique skills across all snapshots
**Total installs:** 87,310 -> 131,002 (+43,692 installs, +50.0%)

---

## Executive Summary

The skills.sh ecosystem grew 50% in install volume over just 4 days, driven primarily by **platform tooling** (Vercel's find-skills), **React/frontend development patterns** (Vercel agent-skills, Anthropic frontend-design), and a rapidly proliferating **inference.sh skill factory** that accounts for the largest publisher by volume. The growth is heavily concentrated: the top 10 movers account for ~60% of all new installs.

Key themes among the fastest-growing skills:
1. **Platform/meta-skills** that help agents discover and use other skills
2. **Framework best-practices** encoding (React, Next.js, Angular, Remotion)
3. **Developer workflow automation** (code review, TDD, brainstorming)
4. **Content/marketing automation** (SEO, copywriting, social media)
5. **Inference.sh bulk publishing** dominating the relative-growth charts

---

## Top 15 Absolute Movers (by install growth)

### 1. vercel-labs/skills/find-skills (+3,855 installs, 59.7%)
- **What it is:** The core skills.sh discovery tool (`npx skills`). This is the meta-skill -- the entry point into the ecosystem.
- **Why it's growing:** Network effect. As more skills are published, more people install the tool to find them. 6,456 -> 10,311 installs. 6,258 stars.
- **Category:** Platform tooling / Discovery

### 2. millionco/react-doctor/react-doctor (+1,368, 99.6%)
- **What it is:** A diagnostic skill that lets coding agents analyze and fix React code issues. MIT-licensed, topics include `agents`, `code-review`, `doctor`, `react`, `skill`.
- **Why it's notable:** Only appeared on Feb 18 and gained 2,742 installs in 2 days. Created Feb 13 -- only 6 days old. Fastest new entrant.
- **Category:** Code quality / React diagnostics

### 3. vercel-labs/agent-skills/vercel-react-best-practices (+1,079, 41.9%)
- **What it is:** Part of Vercel's official agent-skills collection. Encodes React best practices for coding agents to follow during development.
- **Why it's growing:** Vercel's brand + React's dominance. Steady, consistent daily growth.
- **Category:** Framework best-practices

### 4. inference-sh-3/skills/agent-tools (+1,008, 19.8%)
- **What it is:** Inference.sh's API toolkit that gives agents access to "hundreds of apps and other agents." Appeared Feb 18 with 5,082 installs already.
- **Why it's notable:** inference-sh rotates numbered accounts (0-5 observed). The -0 variant *lost* 756 installs while -3 appeared. This is likely a re-registration/migration pattern.
- **Category:** Agent infrastructure / API gateway

### 5. anthropics/skills/frontend-design (+939, 43.3%)
- **What it is:** Anthropic's official frontend design skill. From the claude-code publisher's skills repo (71,617 stars).
- **Why it's growing:** First-party Anthropic backing. Consistently growing every day.
- **Category:** Design / Frontend

### 6. vercel-labs/agent-browser/agent-browser (+732, 55.2%)
- **What it is:** Browser automation CLI for AI agents. Apache-2.0 licensed, 14,494 stars.
- **Why it's growing:** Fills a fundamental need -- letting agents interact with web pages. From the highly-trusted Vercel brand.
- **Category:** Browser automation / Agent infrastructure

### 7. vercel-labs/agent-skills/vercel-composition-patterns (+639, 51.3%)
- **What it is:** Vercel's composition patterns guide for agent-driven development. Part of the 20K-star agent-skills collection.
- **Category:** Framework best-practices (React composition)

### 8. vercel-labs/agent-skills/web-design-guidelines (+512, 22.9%)
- **What it is:** Web design guidelines from Vercel's official agent-skills suite.
- **Category:** Design best-practices

### 9. vercel-labs/next-skills/next-best-practices (+491, 94.2%)
- **What it is:** Next.js best practices for coding agents. Nearly doubled (521 -> 1,012).
- **Category:** Framework best-practices (Next.js)

### 10. anthropics/skills/skill-creator (+479, 50.3%)
- **What it is:** Anthropic's meta-skill for creating new skills. Part of the 71K-star skills repo.
- **Why it's notable:** Another meta/platform skill -- tools that make more tools.
- **Category:** Platform tooling / Skill authoring

### 11. obra/superpowers/brainstorming (+363, 50.8%)
- **What it is:** Part of Jesse Vincent's "superpowers" framework (54,706 stars). A structured brainstorming methodology for agents.
- **Why it's growing:** obra/superpowers is a comprehensive dev methodology. Multiple skills from this repo are top movers.
- **Category:** Developer workflow / Methodology

### 12. nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max (+296, 32.4%)
- **What it is:** "Design intelligence for building professional UI/UX across multiple platforms." 32,605 stars. Extensive topic tags (claude, cursor-ai, tailwindcss, react, etc.).
- **Category:** UI/UX design intelligence

### 13. remotion-dev/skills/remotion-best-practices (+280, 16.9%)
- **What it is:** Best practices for Remotion, the React-based video creation framework.
- **Category:** Framework best-practices (video/Remotion)

### 14. vercel-labs/agent-skills/vercel-react-native-skills (+242, 26.0%)
- **What it is:** React Native best practices from Vercel's agent-skills collection.
- **Category:** Framework best-practices (React Native)

### 15. wshobson/agents/typescript-advanced-types (+238, 129.3%)
- **What it is:** Advanced TypeScript type patterns from the wshobson/agents repo (28,878 stars). A massive multi-agent orchestration project with 146 skills total.
- **Category:** Language knowledge / TypeScript

---

## Notable Patterns

### The Vercel Dominance
Vercel accounts for **+7,818 installs** across just 10 skills -- the #1 publisher by growth. Their strategy: publish a small number of high-quality, well-branded skills covering their core stack (React, Next.js, React Native, web design, browser automation). Every Vercel skill shows consistent daily growth with no dips.

### The inference.sh Factory
inference.sh publishes through rotating numbered accounts (inference-sh-0 through inference-sh-5). Combined, they account for **~80+ skills** spanning everything from `twitter-automation` to `ai-video-generation` to `pitch-deck-visuals`. Key patterns:
- Old numbered variants decline while new ones appear (classic re-registration)
- inference-sh-4 alone grew +4,845 across 53 skills
- Many skills are thin API wrappers ("give your agents access to hundreds of apps")
- High *relative* growth (200-400%) but from very low bases (40-60 installs)
- Low stars (32) and no license -- signals low trust

### obra/superpowers: The Methodology Play
Jesse Vincent's superpowers framework (54K stars) takes a different approach: instead of framework best-practices, it encodes a **software development methodology** -- brainstorming, test-driven development, code review (requesting + receiving), writing plans. 15 skills with +1,991 combined growth. This is the "how to develop" rather than "what to use."

### The Best-Practices Pattern
The dominant skill archetype is **"best practices for [framework X]"** -- encoding institutional knowledge about React, Next.js, Angular, Remotion, Supabase, etc. This makes sense: agents need to know how to use these tools correctly, and framework maintainers have the authority to publish canonical guidance.

### New Entrants to Watch
- **millionco/react-doctor** -- 2,742 installs in 2 days. React diagnostics. MIT license, good topics. Fastest cold-start ever observed.
- **scrapegraphai/just-scrape** -- AI-powered web scraping CLI. 365 installs. Appeared Feb 17.
- **clerk/skills/clerk-nextjs-patterns** -- Auth patterns for Next.js. +133 (359% growth).

### Declining Skills
- **inference-sh-0/agent-tools** (-756) -- replaced by inference-sh-3 variant
- **squirrelscan/skills/audit-website** (-415) -- website audit tool falling off
- **mcp-use/mcp-use/** variants (-159 each) -- MCP framework tools losing interest
- **google-gemini/gemini-skills/gemini-api-dev** (-123) -- competitor ecosystem struggling

---

## Language Breakdown of Top 50 Movers

| Language | Skills | Install Growth |
|----------|--------|----------------|
| TypeScript | 6 | +6,588 |
| JavaScript | 6 | +2,865 |
| Python | 9 | +2,794 |
| Shell | 7 | +2,228 |
| Unknown | 2 | +641 |

TypeScript and JavaScript (web stack) dominate absolute growth. Shell skills are mostly inference.sh bulk-published API wrappers. Python skills come from high-authority publishers (Anthropic, wshobson).

---

## Publisher Leaderboard (by install growth)

| # | Publisher | Skills | Total Installs | Growth |
|----|-----------|--------|----------------|--------|
| 1 | vercel-labs | 10 | 23,457 | +7,818 |
| 2 | wshobson | 146 | 13,246 | +5,299 |
| 3 | inference-sh-4 | 53 | 10,243 | +4,845 |
| 4 | anthropics | 21 | 10,563 | +3,135 |
| 5 | obra | 15 | 6,431 | +1,991 |
| 6 | coreyhaines31 | 26 | 8,450 | +1,630 |
| 7 | inference-sh-3 | 10 | 8,445 | +1,462 |
| 8 | millionco | 1 | 2,742 | +1,368 |
| 9 | inference-sh-5 | 13 | 1,982 | +1,155 |
| 10 | sickn33 | 12 | 1,148 | +493 |

Two publisher archetypes emerge:
- **Focused publishers** (Vercel, Anthropic, obra, millionco): Few high-quality skills, strong per-skill growth
- **Volume publishers** (wshobson 146 skills, inference-sh-* 76+ skills): Many skills, lower per-skill engagement

---

## Skill Categories Emerging

1. **Platform/Meta** -- find-skills, skill-creator (tools that enable the ecosystem)
2. **Framework Best-Practices** -- React, Next.js, Angular, Remotion, Supabase patterns
3. **Agent Infrastructure** -- agent-browser, agent-tools, browser-use (fundamental agent capabilities)
4. **Developer Methodology** -- obra/superpowers (TDD, code review, brainstorming, planning)
5. **Design Intelligence** -- frontend-design, web-design-guidelines, ui-ux-pro-max
6. **Content/Marketing** -- SEO audit, copywriting, social media automation
7. **API Wrappers** -- inference.sh bulk skills (thin wrappers around external APIs)
8. **Diagnostics/Quality** -- react-doctor, audit-website, code-review-analysis
9. **File Generation** -- pdf, pptx, algorithmic-art (creative output skills)
10. **Language Knowledge** -- TypeScript advanced types, Prisma patterns, Zod schemas

---

## Signals for Adoption Research

**Traits correlated with faster adoption:**
- First-party publisher (Vercel, Anthropic, Supabase) -> consistent growth
- High star count on parent repo -> discovery advantage
- Clear, specific name (e.g., "react-doctor" vs "agent-tools") -> better conversion
- MIT license -> signals trust (react-doctor, obra/superpowers)
- Active push date (within 7 days) -> nearly all top movers are freshly maintained

**Traits correlated with decline:**
- Account rotation (inference-sh-0 -> inference-sh-3) -> confuses install base
- No license -> trust barrier
- Generic description -> hard to evaluate
- Competitor ecosystem (gemini-skills) -> limited market in claude-code-dominant ecosystem
