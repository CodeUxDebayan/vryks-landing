---
name: vryks-landing
description: Specialist instructions for implementing the VRYKS 3D Scroll Landing Page with a focus on UI/Animation excellence over 3D asset weight.
---

# VRYKS Landing Implementation Skill

The soul of this project. Every decision made during implementation must pass through this document. The website is not a brochure — it is a **cinematic argument** for VRYKS as a premium studio.

---

## 1. Token Allocation Discipline
- **20% Content**: Copy only from `VRYKS_CONTENT.md`. No deviations.
- **40% UI & GSAP Animations**: This is where we live.
- **20% 3D Generation**: One procedural object. No imported assets.
- **20% 3D Scroll Animation**: Subtle, depth-signaling, scroll-synced.

---

## 2. Brand Tone & Design Rules
- **Palette**: `#050505` (bg), `#f0f0f0` (text), `#888888` (muted), `#D4FF00` (accent). No exceptions.
- **Typography**: Outfit (display, uppercase, tight tracking), Inter (body, comfortable weight).
- **Whitespace**: Sections breathe. Minimum `12rem` vertical padding on desktop.
- **Voice**: Premium, confident, never salesy. The copy should feel earned.

---

## 3. Storytelling Architecture (Per Section)

Each section has a **beat**, an **emotion**, and a **GSAP intent**:

| Section | Beat | GSAP Pattern |
|---------|------|--------------|
| **Hero** | The Claim | Clip-up word stagger on load. Magnetic CTA. |
| **Thesis** | The Challenge | **Pinned + Scrubbed** timeline. Word-level accent flash. |
| **Capabilities** | The Proof | `ScrollTrigger.batch()` staggered card entry. Lines draw in. |
| **Process** | The System | Cinematic scrub. Background darkens to pure black. |
| **Team** | The People | Sequential name slide-in. Role fades after name. |
| **CTA** | The Invitation | Two-direction slam. Pulse keyframe on button. |

---

## 4. GSAP Directives (Non-Negotiable)
- Use **pinned sections with scrub** for the Thesis and Process beats.
- Use **`ScrollTrigger.batch()`** for Capabilities cards — never a simple `forEach`.
- Use **`timeline` with labels** for the hero entrance sequence.
- Use **`scrollerProxy()`** to link Lenis with ScrollTrigger correctly.
- **Never use `toggleActions` and `scrub` on the same trigger.**
- Remove all `markers: true` before final delivery.

---

## 5. Minimalist 3D Rules
- **One object only**: An icosahedron with a wireframe/noise shader.
- **Responsive**: On mobile, reduce `detail` level and lower opacity.
- **Scroll sync**: Object position and rotation are tied to scroll progress via `onUpdate`.
- **Never obscure UI**: The canvas is `z-index: 0`, `pointer-events: none`.

---

## 6. Quality Gates (Run These Before Delivery)
- ✅ **The Breathe Test**: Does every section have room? No crowding.
- ✅ **The Stun Test**: Does the first scroll beyond the hero feel impressive?
- ✅ **The Convince Test**: Does the copy flow logically toward the final CTA?
- ✅ **The 60fps Test**: Open DevTools, verify paint/composite in the Performance panel.
- ✅ **The Mobile Test**: 375px — no horizontal scroll, animations degraded gracefully.
