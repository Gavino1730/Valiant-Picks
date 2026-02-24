# Code Citations

## License: unknown
https://github.com/RomanPipko/reactSneakers/blob/563920c7dca6b6441fdb449008319c691e4a09f7/public/index.html

```
Here's an honest review of the site's current state and the changes I'd make:

---

## Overall Assessment

The site has a solid dark-theme foundation with a real design system in place (`design-system.css` with CSS variables, tokens, etc.). It's functional and covers a lot of ground. But there are several areas that would meaningfully improve the look and feel.

---

## What's Working Well

- **Dark theme** — `#111827` bg with surface layers is appropriate for a betting/sports app
- **CSS variables** — proper token system means changes propagate everywhere easily
- **Radial gradient** on `.app` (`rgba(29, 124, 255, 0.12)`) gives nice depth
- **Badges & status pills** — the success/danger/warning/neutral badge system is clean
- **Gamification** — spin wheel, daily rewards, achievements all add great engagement
- **Sticky navbar + lazy-loaded routes** — solid performance foundations

---

## Issues & Changes I'd Make

### 1. Typography — Biggest visual upgrade available

The site uses the system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI'...`). Switching to **Inter** would immediately look more premium with zero cost.

```css
/* In index.html <head> */
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

/* In App.css body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

### 2. Page subtitles are silenced

In [design-system.css](client/src/styles/design-system.css#L67), this completely hides all page descriptions:

```css
.page-header p,
.page-header .subtitle,
.page-subtitle {
  display: none;  /* ← kills all context text */
}
```

That means the "Place your bets on upcoming games" subtitle under Games, contextual descriptions everywhere — all gone. I'd restore those with muted styling.

---

### 3. Navbar — solid blue feels flat

The navbar is `background: var(--color-brand)` — solid flat blue. A subtle frosted/glass effect would modernize it noticeably:

```css
.navbar {
  background: rgba(11, 94, 215
```

