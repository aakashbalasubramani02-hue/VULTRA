---
name: Cyber Intelligence Editorial
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#191c20'
  surface-container: '#1d2024'
  surface-container-high: '#282a2f'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2e3035'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#c4c6d0'
  on-secondary: '#2d3038'
  secondary-container: '#464951'
  on-secondary-container: '#b6b8c2'
  tertiary: '#ffeac0'
  on-tertiary: '#3e2e00'
  tertiary-container: '#fec931'
  on-tertiary-container: '#6f5500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e0e2ec'
  secondary-fixed-dim: '#c4c6d0'
  on-secondary-fixed: '#191c23'
  on-secondary-fixed-variant: '#44474f'
  tertiary-fixed: '#ffdf96'
  tertiary-fixed-dim: '#f3bf26'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  risk-urgent: '#FF3B30'
  risk-high: '#FF9500'
  risk-medium: '#FFCC00'
  risk-low: '#2C3139'
  text-primary: '#F5F7FA'
  text-muted: '#606D7A'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin: 40px
  section-gap: 80px
---

## Brand & Style
This design system establishes a high-performance, analytical atmosphere described as "Cyber Intelligence Editorial." It moves away from standard dashboard tropes toward a sophisticated, data-dense aesthetic that mirrors a high-end technical publication or a strategic command center.

The style is a fusion of **Minimalism** and **High-Contrast Precision**. It relies on an almost-black foundation to eliminate visual noise, allowing intelligence to emerge through high-precision typography and vibrant, singular accents. The aesthetic is defined by zero unnecessary containers, letting whitespace and typographic hierarchy provide the structure. The emotional response is one of cold authority, absolute clarity, and technical urgency.

## Colors
The palette is engineered for low-light environments, prioritizing endurance and rapid scanning.

- **The Foundation:** The core of the interface is `#07090D` (Charcoal Base). Surface variations use `#11141B` for subtle layering, though containers should be used sparingly.
- **Electric Cyan:** `#00E5FF` is the primary "Precision Accent." It is used for active states, primary actions, and critical focus indicators.
- **Semantic Risk:** Severity is communicated through a disciplined hierarchy. **Urgent** uses a restrained red; **High** utilizes orange; **Medium** uses amber; **Low** is a neutral cool gray to indicate non-threatening status.
- **Text:** Primary data is rendered in high-contrast off-white (`#F5F7FA`), while secondary metadata is pushed back using a muted slate (`#606D7A`).

## Typography
The system uses **Geist** exclusively to maintain a technical, mono-inspired feel with the legibility of a sans-serif.

The "Editorial" influence is felt through dramatic headline treatments. Large headlines should feature tight tracking and compact line heights to create a sense of density and impact. Body text maintains a healthy line height (1.6) to ensure long-form reports remain readable. Metadata and technical labels utilize all-caps with generous letter spacing to provide a clear visual distinction from narrative content.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy but rejects the traditional "card-heavy" dashboard look. Content should be separated by whitespace and structural lines rather than boxed containers.

- **Desktop:** A 12-column grid with 24px gutters. Use a 40px outer margin.
- **Rhythm:** Utilize an 8-point scaling system for spacing. 
- **Reflow:** On tablet, the grid shifts to 8 columns with 32px margins. On mobile, the grid collapses to 4 columns with 20px margins.
- **Editorial Breathing:** Use significant vertical gaps (`section-gap`) between major data blocks to signify transitions in intelligence streams.

## Elevation & Depth
In this system, depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than shadows.

- **Flat Architecture:** Most elements sit on the same plane to maintain the "Editorial" feel.
- **Layering:** When depth is required (e.g., side panels or dropdowns), use `#11141B` with a subtle 1px border (`#1E2530`).
- **Interactive Highlights:** Instead of shadows, use a 1px solid border of the primary color (`#00E5FF`) to indicate focus or selection.
- **Motion:** All page transitions and reveals must use a 200-500ms smooth fade combined with an 8px vertical "slide-up" movement to suggest a high-end interface loading sequence.

## Shapes
The shape language is **Sharp (Level 0)**. 

To reinforce the "Cyber Intelligence" and "Precision" themes, the system utilizes 0px border radii for all primary components (buttons, inputs, cards). This creates a rigid, grid-aligned look that feels engineered and professional. Circular elements are reserved strictly for status indicators or avatars to provide a rare soft contrast to the otherwise geometric rigidity.

## Components
- **Buttons:** Primary buttons are sharp-cornered blocks of `#00E5FF` with `#07090D` text. Secondary buttons are 1px outlines.
- **Chips:** Risk chips use no background. They feature the semantic risk color as a 1px border and a 6px solid dot next to the label.
- **Input Fields:** These should be styled as "ghost" inputs—only a bottom border (1px) in standard state, turning into a full Cyan outline on focus.
- **Cards:** Avoid standard card containers. Use horizontal dividers (1px solid `#1E2530`) to separate content sections. If a container is absolutely necessary for grouping, use the secondary surface color (`#11141B`) with no border.
- **Lists:** High-density rows with 1px bottom borders. Hovering a row should trigger a subtle shift to `#11141B` and a Cyan left-accent bar (2px wide).
- **Intelligence Feed:** A specialized component using `label-caps` for timestamps and `headline-md` for the event title, emphasizing the "Editorial" delivery of data.