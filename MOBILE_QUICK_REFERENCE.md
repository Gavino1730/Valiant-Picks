# 📱 Mobile Optimization - Quick Reference Card

## Quick Reference

### Responsive Breakpoints
```css
@media (max-width: 768px) { }   /* Tablets & below */
@media (max-width: 480px) { }   /* Mobile phones */
@media (orientation: landscape) { }  /* Landscape mode */
```

### Touch Targets
```css
/* Minimum sizes */
button, a, input { 
  min-height: 44px;  /* iOS */
  min-width: 48px;   /* Android */
}
```

### Form Font Size
```css
/* Prevent iOS zoom on focus */
input, select, textarea {
  font-size: 16px;  /* DO NOT reduce below 16px */
}
```

### Safe Area Support
```css
/* For notch devices */
@supports (padding: max(0px)) {
  body {
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
    padding-top: max(0px, env(safe-area-inset-top));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
```

## Typography Scale

| Screen | Base Font | H1 | H2 | H3 |
|--------|-----------|-----|-----|-----|
| Mobile | 14px | 1.3em | 1.1em | 1em |
| Tablet | 15px | 1.5em | 1.3em | 1.1em |
| Desktop | 16px | 1.8em | 1.4em | 1.2em |

## Common Patterns

### Full-Width Button
```css
button {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
}
```

### Flexible Grid to Single Column
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* Desktop */
  gap: 1rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);  /* Tablet */
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;  /* Mobile */
  }
}
```

### Card-Based Table on Mobile
```css
@media (max-width: 480px) {
  table tbody {
    display: flex;
    flex-direction: column;
  }
  
  table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
  }
  
  table td::before {
    content: attr(data-label);
    font-weight: 600;
  }
}
```

### Stacking Form
```css
.form-group {
  margin-bottom: 12px;
}

input, select, textarea {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

@media (max-width: 480px) {
  input, select {
    margin-bottom: 8px;
  }
}
```

## Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, 
  initial-scale=1, maximum-scale=5, 
  user-scalable=yes, viewport-fit=cover" />
```

## iOS Specific
```html
<!-- Home screen app -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" 
  content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Valiant Picks" />
```

## Testing on DevTools

```
1. Press F12 or Ctrl+Shift+I
2. Press Ctrl+Shift+M (Toggle device toolbar)
3. Select device from dropdown:
   - iPhone SE (375px)
   - iPhone 12/13/14 (390px)
   - Pixel 4a (393px)
   - iPad (768px)
4. Test interactions
5. Check console for errors
```

## Mobile-First Approach

```
/* Mobile-first (smallest first) */
.container {
  padding: 12px;
  font-size: 14px;
}

/* Enhance for larger screens */
@media (min-width: 480px) {
  .container {
    padding: 16px;
    font-size: 15px;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 20px;
    font-size: 16px;
  }
}
```

## Performance Checklist

- [ ] CSS is minified in production
- [ ] Images are optimized
- [ ] No unnecessary animations
- [ ] Smooth scrolling enabled (-webkit-overflow-scrolling)
- [ ] No layout shifts (CLS < 0.1)
- [ ] First paint < 2 seconds
- [ ] Time to interactive < 4 seconds

## Accessibility Quick Checks

- [ ] Touch targets ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus visible on all interactive elements
- [ ] Form labels associated with inputs
- [ ] Keyboard navigation works
- [ ] No color-only indicators
- [ ] Text can be resized to 200%

## Common Mistakes to Avoid

❌ **Do NOT:**
- Use width: 100% + padding (causes overflow)
- Set input font-size < 16px (causes zoom on iOS)
- Hide content on mobile without alternative
- Use fixed widths (use max-width instead)
- Forget about touch target sizing
- Ignore keyboard navigation

✅ **DO:**
- Use box-sizing: border-box
- Test on real devices
- Use relative units (em, rem, %)
- Provide keyboard alternatives
- Test orientation changes
- Include focus indicators

## Debugging Mobile Issues

### Issue: Horizontal Scrolling
```css
* { max-width: 100%; }  /* Emergency fix */

/* Better: Find the culprit */
body { overflow-x: hidden; }  /* Hide, but find real issue */
```

### Issue: Form Zoom on iOS
```css
/* WRONG */
input { font-size: 14px; }  /* iOS will zoom! */

/* CORRECT */
input { font-size: 16px; }  /* No zoom */
```

### Issue: Touch Feedback Delayed
```css
/* Add touch feedback */
a, button {
  -webkit-tap-highlight-color: rgba(0, 79, 158, 0.2);
  transition: all 0.3s ease;
}
```

## File Structure

```
client/
├── public/
│   └── index.html          ← Viewport meta tags
├── src/
│   ├── App.css             ← App-wide responsive
│   ├── index.js            ← Imports Mobile.css
│   └── styles/
│       ├── Mobile.css      ← NEW: Mobile framework
│       ├── Dashboard.css   ← Dashboard responsive
│       ├── Login.css       ← Login page responsive
│       ├── Leaderboard.css ← Leaderboard mobile
│       ├── Teams.css       ← Teams page mobile
│       └── ...
```

## CSS Import Order

```javascript
// index.js
import './App.css';           // App styles first
import './styles/Mobile.css'; // Mobile overrides last
```

## Browser DevTools Tips

**Chrome/Edge:**
- F12 → Device toolbar (Ctrl+Shift+M)
- Slow network simulation
- CPU throttling for performance testing

**Firefox:**
- Ctrl+Shift+M → Responsive design mode
- Rotate device button
- Edit media queries live

**Safari:**
- Develop → Enter Responsive Design Mode
- Simulate different devices
- Test on real connected device

## Useful CSS Properties

```css
/* Responsive sizing */
width: 100%;
max-width: 100%;
padding: clamp(12px, 5vw, 20px);

/* Flexible layouts */
display: flex;
display: grid;
flex-wrap: wrap;

/* Touch scrolling */
-webkit-overflow-scrolling: touch;
overscroll-behavior: contain;

/* Text sizing */
font-size: clamp(14px, 5vw, 16px);
line-height: 1.4;

/* Safe areas */
@supports (padding: max(0px)) {
  padding-left: max(12px, env(safe-area-inset-left));
}
```

## Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Mobile Friendly Test](https://search.google.com/test/mobile-friendly)
- [WebAIM: Mobile Accessibility](https://webaim.org/articles/mobile/)
- [Can I Use](https://caniuse.com) - Check browser support

## Quick Test URLs

```
Local development:
http://localhost:3000

Use with ngrok for remote testing:
https://your-ngrok-url.ngrok.io
```

---

**Remember:** Always test on real devices, not just browser emulation!

**Last Updated:** 2024
**Status:** Ready for production ✅
