---
name: aesthetic
description: Build UI/UX via four-stage framework (BEAUTIFUL/RIGHT/SATISFYING/PEAK): capture inspiration with chrome-devtools, analyze with ai-multimodal, iterate generated images to quality threshold, apply visual hierarchy, color theory, typography, micro-interactions, accessibility. Integrates ai-multimodal, chrome-devtools, media-processing, ui-styling, web-frameworks. Not for raw CSS (use ui-styling).
---

# Aesthetic

Create aesthetically beautiful interfaces by following proven design principles and systematic workflows.

## When to Use This Skill

Use when:
- Building or designing user interfaces
- Analyzing designs from inspiration websites (Dribbble, Mobbin, Behance)
- Generating design images and evaluating aesthetic quality
- Implementing visual hierarchy, typography, color theory
- Adding micro-interactions and animations
- Creating design documentation and style guides
- Need guidance on accessibility and design systems

## Core Framework: Four-Stage Approach

### 1. BEAUTIFUL: Understanding Aesthetics
Study existing designs, identify patterns, extract principles. AI lacks aesthetic sense—standards must come from analyzing high-quality examples and aligning with market tastes.

**Reference**: [`references/design-principles.md`](references/design-principles.md) - Visual hierarchy, typography, color theory, white space principles.

### 2. RIGHT: Ensuring Functionality
Beautiful designs lacking usability are worthless. Study design systems, component architecture, accessibility requirements.

**Reference**: [`references/design-principles.md`](references/design-principles.md) - Design systems, component libraries, WCAG accessibility standards.

### 3. SATISFYING: Micro-Interactions
Incorporate subtle animations with appropriate timing (150-300ms), easing curves (ease-out for entry, ease-in for exit), sequential delays.

**Reference**: [`references/micro-interactions.md`](references/micro-interactions.md) - Duration guidelines, easing curves, performance optimization.

### 4. PEAK: Storytelling Through Design
Elevate with narrative elements—parallax effects, particle systems, thematic consistency. Use restraint: "too much of anything isn't good."

**Reference**: [`references/storytelling-design.md`](references/storytelling-design.md) - Narrative elements, scroll-based storytelling, interactive techniques.

## Workflows

### Workflow 1: Capture & Analyze Inspiration

**Purpose**: Extract design guidelines from inspiration websites.

**Steps**:
1. Browse inspiration sites (Dribbble, Mobbin, Behance, Awwwards)
2. Use **chrome-devtools** skill to capture full-screen screenshots (not full page)
3. Use **ai-multimodal** skill to analyze screenshots and extract:
   - Design style (Minimalism, Glassmorphism, Neo-brutalism, etc.)
   - Layout structure & grid systems
   - Typography system & hierarchy
     **IMPORTANT:** Try to predict the font name (Google Fonts) and font size in the given screenshot, don't just use Inter or Poppins.
   - Color palette with hex codes
   - Visual hierarchy techniques
   - Component patterns & styling
   - Micro-interactions
   - Accessibility considerations
   - Overall aesthetic quality rating (1-10)
4. Document findings in project design guidelines using templates

### Workflow 2: Generate & Iterate Design Images

**Purpose**: Create aesthetically pleasing design images through iteration.

**Steps**:
1. Define design prompt with: style, colors, typography, audience, animation specs
2. Use **ai-multimodal** skill to generate design images with Gemini API
3. Use **ai-multimodal** skill to analyze output images and evaluate aesthetic quality
4. If score < 7/10 or fails professional standards:
   - Identify specific weaknesses (color, typography, layout, spacing, hierarchy)
   - Refine prompt with improvements
   - Regenerate with **ai-multimodal** or use **media-processing** skill to modify outputs (resize, crop, filters, composition)
5. Repeat until aesthetic standards met (score ≥ 7/10)
6. Document final design decisions using templates

## Design Documentation

### Create Design Guidelines
Use [`assets/design-guideline-template.md`](assets/design-guideline-template.md) to document:
- Color patterns & psychology
- Typography system & hierarchy
- Layout principles & spacing
- Component styling standards
- Accessibility considerations
- Design highlights & rationale

Save in project `./docs/design-guideline.md`.

### Create Design Story
Use [`assets/design-story-template.md`](assets/design-story-template.md) to document:
- Narrative elements & themes
- Emotional journey
- User journey & peak moments
- Design decision rationale

Save in project `./docs/design-story.md`.

## Resources & Integration

### Related Skills
- **ai-multimodal**: Analyze documents, screenshots & videos, generate design images, edit generated images, evaluate aesthetic quality using Gemini API
- **chrome-devtools**: Capture full-screen screenshots from inspiration websites, navigate between pages, interact with elements, read console logs & network requests
- **media-processing**: Refine generated images (FFmpeg for video, ImageMagick for images)
- **ui-styling**: Implement designs with shadcn/ui components + Tailwind CSS utility-first styling
- **web-frameworks**: Build with Next.js (App Router, Server Components, SSR/SSG)

### Reference Documentation
**References**: [`references/design-resources.md`](references/design-resources.md) - Inspiration platforms, design systems, AI tools, MCP integrations, development strategies.

## Anti-Fingerprint Gate

Stage 1 (BEAUTIFUL) tells you to study good examples but never says what to refuse. This gate is that refusal list. Run it on the finished design BEFORE scoring it: one hit below means the design is not ready, so fix the hit and re-run the gate.

### Refuse: design tokens & visual

- [ ] Default Inter/system-sans with no reason — ship at least one deliberate type choice with a fallback stack
- [ ] Purple-to-indigo gradient hero (`bg-gradient-to-br from-blue-600 to-purple-500`) — drop it, or build the gradient from tokens with a stated reason
- [ ] Uniform 3-4 column icon-topped feature grid — replace with an asymmetric layout and varied item count
- [ ] The five stock Lucide icons (Sparkles, Zap, Shield, Check, BarChart3) plus ArrowRight on every CTA — choose icons by meaning
- [ ] Badge-above-H1 hero formula — open on the claim directly
- [ ] Numbered step markers 01/02/03 used as decoration — keep only when the number carries real information
- [ ] Fake terminal hero with macOS traffic-light dots (non-dev product) — remove it
- [ ] Emoji used as feature icons — use project SVG icons
- [ ] Hyperglossy finish, saturation pushed past default — keep imperfection and specific detail

### Design systems discipline

- [ ] Primary vs accent hue delta under 20 degrees in OKLCH — one hue pretending to be two; separate the jobs
- [ ] Hover/focus/press colors invented per component (more than 5 distinct hover colors is a smell) — derive states from system tokens
- [ ] Body text under WCAG AA contrast (4.5:1) in dark mode, or grey #888-#999 for body text — fix the contrast
- [ ] Shipped font that does not match the declared font — check `--font-sans` first
- [ ] Every section band at equal visual weight — designate one element as the oversized moment
- [ ] Motion that ignores `prefers-reduced-motion` — respect it

### Accessibility: fingerprint gate, not just a bug

- [ ] Wrong heading hierarchy, missing semantic landmarks, div soup — build correct hierarchy and landmarks
- [ ] Missing alt text, form labels, focus states, keyboard navigation — fill them all
- [ ] Reviewing only the screenshot — also review the rendered HTML
- [ ] Skipped mobile — test 320-375px explicitly; AI layouts only hold at the preview width

### Verify (produces evidence)

- Screenshot the rendered component and check the colors a design comment claims against the values it names.
- Test the rendered HTML at 320-375px, not the preview width.
- Walk the keyboard path: tab through every interactive element and confirm focus states render.
- Audit one section band against the oversized-moment rule: does a single element carry the visual weight?

This gate implements `.claude/rules/swe_conventions.md` §4 (UI/UX anti-fingerprint). Prose this skill produces must also pass `.claude/rules/anti_slop.md` §4 (structural tells); repo agents and rules/ win any conflict.

## Key Principles

1. Aesthetic standards come from humans, not AI—study quality examples
2. Iterate based on analysis—never settle for first output
3. Balance beauty with functionality and accessibility
4. Document decisions for consistency across development
5. Use progressive disclosure in design—reveal complexity gradually
6. Always evaluate aesthetic quality objectively (score ≥ 7/10)
