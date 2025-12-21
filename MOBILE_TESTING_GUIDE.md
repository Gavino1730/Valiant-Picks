# Mobile Testing Guide

## Quick Testing Checklist

### Viewport & Responsiveness
- [ ] Test on 375px width (iPhone SE)
- [ ] Test on 390px width (iPhone 12/13/14)
- [ ] Test on 480px width (tablets)
- [ ] Test on 768px width (iPad)
- [ ] Test on desktop (1920x1080)
- [ ] No horizontal scrolling on mobile
- [ ] Content fits within viewport
- [ ] Images scale properly

### Navigation
- [ ] Navbar displays correctly on all sizes
- [ ] Logo/branding visible on mobile
- [ ] Navigation buttons are touch-friendly
- [ ] Active states work properly
- [ ] Logout button visible and functional
- [ ] No menu overlaps on small screens

### Forms & Inputs
- [ ] All input fields are 16px (prevent zoom)
- [ ] Forms stack vertically on mobile
- [ ] Labels are clearly visible
- [ ] Input fields are full-width on mobile
- [ ] Buttons are easy to tap (48px minimum)
- [ ] Form validation messages display properly
- [ ] Focus states are visible
- [ ] Mobile keyboard doesn't hide buttons

### Dashboard
- [ ] Balance card displays properly
- [ ] Potential win amount is readable
- [ ] Bet cards are in single column on mobile
- [ ] Stats grid adjusts from 2 to 1 column
- [ ] All bet details are visible
- [ ] No content is cut off
- [ ] Spacing is appropriate

### Leaderboard
- [ ] Leaderboard is readable on mobile
- [ ] Sort buttons are touch-friendly
- [ ] Player list displays as cards on mobile
- [ ] Rank badges are visible
- [ ] Stats are clearly labeled
- [ ] No table overflow on mobile
- [ ] Search/filter works if present

### Login Page
- [ ] Login box centers properly
- [ ] Form fields are full-width
- [ ] Buttons are full-width on mobile
- [ ] Admin link is accessible
- [ ] Error messages display properly
- [ ] No content hidden on small screens

### Betting/Games
- [ ] Game/bet options display properly
- [ ] Odds are clearly visible
- [ ] Bet amount input is usable
- [ ] Confirm button is easy to tap
- [ ] Results display properly

## Browser Testing

### iOS (iPhone/iPad)
```
Safari:
- [ ] Test on iOS 15+
- [ ] Check viewport scaling
- [ ] Verify notch support
- [ ] Test input focus behavior
- [ ] Check keyboard handling
- [ ] Test link tap behavior

Chrome iOS:
- [ ] Same tests as Safari
- [ ] Verify address bar interaction
```

### Android
```
Chrome:
- [ ] Test on Chrome 100+
- [ ] Check viewport behavior
- [ ] Verify touch feedback
- [ ] Test keyboard display
- [ ] Check status bar integration

Firefox:
- [ ] Test on Firefox 100+
- [ ] Verify layout
- [ ] Check performance

Samsung Internet:
- [ ] Test on latest version
- [ ] Check custom features
```

## Orientation Testing

### Portrait Mode
- [ ] 375px width (iPhone SE)
- [ ] 390px width (Modern iPhone)
- [ ] 480px width (Tablets)
- [ ] 768px width (iPad)

### Landscape Mode
- [ ] 812px width, 375px height (iPhone landscape)
- [ ] 1024px width, 480px height (Tablet landscape)
- [ ] Check notch/safe area handling
- [ ] Verify content fits

### Rotation
- [ ] Test portrait → landscape rotation
- [ ] Test landscape → portrait rotation
- [ ] No content loss during rotation
- [ ] Proper reflow of content

## Performance Testing

### Loading
- [ ] First meaningful paint < 2s
- [ ] Fully interactive < 4s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images load efficiently
- [ ] CSS doesn't block rendering

### Interaction
- [ ] Button taps respond immediately
- [ ] Forms submit quickly
- [ ] Navigation is instant
- [ ] No jank during scrolling
- [ ] Animations are smooth (60fps)

### Network
- [ ] Works on 4G
- [ ] Works on slow 3G
- [ ] Works with image optimization
- [ ] CSS files are minified

## Touch & Gestures

### Tap Targets
- [ ] All buttons ≥ 44x44px
- [ ] Adequate spacing between targets
- [ ] Visual feedback on tap
- [ ] No accidental double-taps

### Scrolling
- [ ] Smooth scroll behavior
- [ ] No momentum scroll jumping
- [ ] Scroll position maintained
- [ ] Kinetic scrolling works

### Text Selection
- [ ] Can select text when needed
- [ ] Copy/paste works
- [ ] Long-press menu appears
- [ ] No unintended selections

## Accessibility Testing

### Touch & Motor
- [ ] All controls are keyboard accessible
- [ ] Focus visible on all buttons
- [ ] Tab order is logical
- [ ] No keyboard traps

### Vision
- [ ] Color contrast ≥ 4.5:1
- [ ] Text size adjustable
- [ ] Can zoom to 200%
- [ ] No color-only indicators

### Hearing
- [ ] No sound-only alerts
- [ ] Captions for videos
- [ ] Text alternatives provided

### Cognitive
- [ ] Clear, simple language
- [ ] Consistent navigation
- [ ] Error messages are helpful
- [ ] Confirmation on destructive actions

## Specific Component Tests

### Login/Register
```
[ ] Test login on iPhone SE (375px)
[ ] Test on landscape
[ ] Test on iPad
[ ] Form validation messages
[ ] Error state styling
[ ] Success feedback
[ ] Links are clickable
[ ] No layout shift when typing
```

### Dashboard
```
[ ] Balance displays correctly
[ ] All bet info is visible
[ ] No cut-off content
[ ] Potential win calculations
[ ] Status badges are clear
[ ] Action buttons are responsive
[ ] Modal dialogs work on mobile
```

### Leaderboard
```
[ ] Ranks display properly
[ ] Names don't overflow
[ ] Stats columns align
[ ] Sort buttons work
[ ] Filter/search works (if present)
[ ] Card layout on mobile
[ ] No horizontal scroll
```

### Teams/Games
```
[ ] Team info displays well
[ ] Schedule is readable
[ ] Player roster loads
[ ] Images display properly
[ ] Stats are clear
[ ] No overflow issues
[ ] Responsive tables work
```

## Device Testing Matrix

| Device | Size | Ratio | Primary Browser |
|--------|------|-------|-----------------|
| iPhone SE | 375px | 19.5:9 | Safari |
| iPhone 12/13 | 390px | 19.5:9 | Safari |
| iPhone 14 Pro | 393px | 19.5:9 | Safari |
| Pixel 4a | 393px | 20:9 | Chrome |
| Pixel 6 | 412px | 19.5:9 | Chrome |
| iPad Mini | 768px | 4:3 | Safari |
| iPad Air | 820px | 4:3 | Safari |
| Galaxy Tab S7 | 800px | 16:10 | Chrome |
| Desktop | 1920px | 16:9 | All |

## Common Mobile Issues & Fixes

### Issue: Horizontal Scrolling
```
❌ Problem: Content wider than viewport
✓ Solution: Check max-width on containers
✓ Check for overflow on elements
✓ Verify padding/margin in media queries
```

### Issue: Touch Targets Too Small
```
❌ Problem: Buttons hard to tap
✓ Solution: Min 44x44px minimum
✓ Add padding around small elements
✓ Increase spacing between buttons
```

### Issue: Text Too Small
```
❌ Problem: Text hard to read
✓ Solution: Base 14-16px on mobile
✓ Proper line-height (1.4+)
✓ Test with browser zoom
```

### Issue: Form Zoom Issues
```
❌ Problem: iOS zooms on input focus
✓ Solution: Use 16px minimum font on inputs
✓ Disable user-scalable on form pages
✓ Proper input types (email, tel, number)
```

### Issue: Modal Overflow
```
❌ Problem: Modal too large for screen
✓ Solution: Max 90vw width
✓ Max 85vh height with scroll
✓ Padding on viewport edges
```

## Testing Tools

### Browser DevTools
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device from dropdown
4. Test all interactions
5. Check console for errors

### Remote Testing
- [BrowserStack](https://www.browserstack.com)
- [CrossBrowserTesting](https://crossbrowsertesting.com)
- [LambdaTest](https://www.lambdatest.com)

### Offline Testing
- Use device emulators
- Test on actual devices
- Use local tunneling (ngrok)

### Performance Tools
- Chrome DevTools Performance tab
- Lighthouse audit
- WebPageTest
- GTmetrix

## Test Results Template

```
Date: ___________
Tester: ___________
Device: ___________
OS: ___________
Browser: ___________

VIEWPORT: ___________
- Width: ___________
- Height: ___________
- Orientation: ___________

TESTED FEATURES:
[ ] Navigation - Status: PASS/FAIL
[ ] Forms - Status: PASS/FAIL
[ ] Dashboard - Status: PASS/FAIL
[ ] Leaderboard - Status: PASS/FAIL

ISSUES FOUND:
1. _______________________________
2. _______________________________
3. _______________________________

NOTES:
_________________________________
```

## Continuous Testing Checklist

Before Each Release:
- [ ] Test all main flows on iPhone
- [ ] Test all main flows on Android
- [ ] Test portrait and landscape
- [ ] Check console for errors
- [ ] Run Lighthouse audit
- [ ] Test on slow network
- [ ] Verify touch interactions
- [ ] Check form submissions

Weekly:
- [ ] Test on different browsers
- [ ] Test on new device sizes
- [ ] Check analytics for errors
- [ ] Review user feedback
- [ ] Test accessibility
- [ ] Performance testing

Monthly:
- [ ] Full regression testing
- [ ] New OS version testing
- [ ] Competitor benchmark
- [ ] User testing session
- [ ] Accessibility audit

---

**Pro Tip:** Always test on real devices, not just emulators. Real devices catch issues that simulators miss!
