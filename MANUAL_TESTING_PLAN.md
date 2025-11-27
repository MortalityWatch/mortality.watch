# Manual Testing Plan

## Quick Reference

| Page                 | Priority | Auth Required           |
| -------------------- | -------- | ----------------------- |
| `/explorer`          | Critical | No (save requires auth) |
| `/ranking`           | Critical | No (save requires auth) |
| `/` (Home)           | High     | No                      |
| `/login`, `/signup`  | High     | No                      |
| `/profile`           | Medium   | Yes                     |
| `/my-charts`         | Medium   | Yes                     |
| `/contact`           | Medium   | No                      |
| `/sources`           | Low      | No                      |
| `/methods`, `/about` | Low      | No                      |

---

## 1. Critical Path: Explorer Page (`/explorer`)

### 1.1 Initial Load

- [ ] Page loads with default chart (spinner → chart visible)
- [ ] URL parameters populate controls correctly
- [ ] Date slider shows available data range

### 1.2 Country Selection

- [ ] Multi-select dropdown opens and closes
- [ ] Search/filter countries works
- [ ] Icons show age-stratified vs all-ages data
- [ ] Selecting country updates chart immediately
- [ ] Removing country updates chart

### 1.3 StateResolver Constraints (Issue #147 Regression)

- [ ] **Single-click excess toggle** - enabling excess works in one click
- [ ] Excess ON → Baseline automatically ON (hard constraint)
- [ ] Excess ON → PI defaults OFF (soft constraint, user can override)
- [ ] Population type → Baseline/PI disabled entirely
- [ ] ASMR/Life Expectancy → Age groups hidden (only "all" supported)
- [ ] Matrix style → Baseline/PI/Maximize/Logarithmic disabled

### 1.4 Chart Controls

- [ ] Type selector (CMR, ASMR, Population, Life Expectancy, Deaths)
- [ ] Chart Type (Yearly, Weekly, Monthly)
- [ ] Chart Style (Line, Bar, Matrix)
- [ ] View toggles (Mortality, Excess, Z-Score)
- [ ] Display toggles (Labels, Maximize, Logarithmic)
- [ ] Baseline method selector (when baseline enabled)
- [ ] Date range slider updates chart

### 1.5 URL Synchronization

- [ ] Changing controls updates URL parameters
- [ ] Browser **Back** restores previous state
- [ ] Browser **Forward** restores next state
- [ ] Direct URL with parameters loads correct chart
- [ ] Sharing URL shows identical chart to recipient

### 1.6 Chart Actions

- [ ] Copy Link → URL copied, toast shown
- [ ] Download Chart → PNG downloads
- [ ] Export CSV → CSV file downloads
- [ ] Export JSON → JSON file downloads
- [ ] Save Chart (logged in) → Modal opens, saves successfully
- [ ] Save Chart (logged out) → Redirects to signup

---

## 2. Critical Path: Ranking Page (`/ranking`)

### 2.1 Table Display

- [ ] Table loads with ranking data
- [ ] Columns display correctly (rank, country, value, CI)
- [ ] Pagination works (if many rows)

### 2.2 Interactions

- [ ] Column header click → Sort ascending/descending
- [ ] Period selector updates table data
- [ ] Jurisdiction type filter works
- [ ] Display toggles (ASMR, Totals, Percentage, PI)
- [ ] "Show in Explorer" → Opens explorer with country selected

### 2.3 Export

- [ ] Copy Link works
- [ ] Download Table as PNG
- [ ] Export CSV/JSON

---

## 3. Authentication Flows

### 3.1 Signup (`/signup`)

- [ ] Empty fields → Validation errors
- [ ] Invalid email → "Invalid email" error
- [ ] Password < 8 chars → Error message
- [ ] TOS unchecked → Cannot submit
- [ ] Valid submission → Redirect to `/check-email`
- [ ] Invite code in URL → Shows validation status

### 3.2 Login (`/login`)

- [ ] Valid credentials → Redirect to home, "Welcome back!" toast
- [ ] Invalid credentials → Error message
- [ ] Unverified email → Redirect to `/check-email`
- [ ] "Forgot password?" link → Goes to reset page

### 3.3 Password Reset

- [ ] Request reset email → Success message
- [ ] Reset link works → Form loads
- [ ] New password + confirm → Successfully resets
- [ ] Can login with new password

---

## 4. User Profile (`/profile`)

- [ ] Requires authentication (redirects if logged out)
- [ ] Account info displays correctly
- [ ] Personal info saves successfully
- [ ] Password change validates and works
- [ ] Export Data → Downloads JSON
- [ ] Delete Account → Shows confirmation modal

---

## 5. My Charts (`/my-charts`)

- [ ] Shows user's saved charts
- [ ] Empty state when no charts
- [ ] Sort options work (newest, oldest, name)
- [ ] Filter by type (explorer, ranking)
- [ ] Delete chart removes from list
- [ ] Click chart → Opens saved chart state

---

## 6. Contact Form (`/contact`)

- [ ] Empty submission → Validation errors
- [ ] Invalid email → Error
- [ ] Valid submission → Success message
- [ ] "Send Another Message" → Form resets
- [ ] Chart URL auto-includes when coming from explorer

---

## 7. Responsive Design

Test each critical page at:

- [ ] **Mobile** (375px width) - Single column, stacked controls
- [ ] **Tablet** (768px) - Two column layout
- [ ] **Desktop** (1280px+) - Full layout with sidebars

### Mobile-Specific

- [ ] Navigation menu accessible
- [ ] Touch targets adequate (≥44px)
- [ ] Modals full-width
- [ ] Charts readable

---

## 8. Dark Mode

Test on key pages:

- [ ] Toggle dark mode works
- [ ] Text remains readable
- [ ] Charts colors adjust
- [ ] Form inputs visible

---

## 9. Browser Compatibility

Test critical flows in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 10. Edge Cases

### Data Edge Cases

- [ ] Select country with missing age data → Toast explains removal
- [ ] Empty date range → Shows appropriate message
- [ ] Very large date range → Chart renders without errors

### Form Edge Cases

- [ ] Very long text input → Truncates/wraps correctly
- [ ] Special characters → Properly escaped
- [ ] Network error on submit → Error message with retry option

### Navigation Edge Cases

- [ ] Manual URL edit with invalid params → StateResolver corrects
- [ ] Rapid back/forward clicks → State remains consistent

---

## 11. Error Handling

- [ ] API errors show user-friendly messages
- [ ] Console has no critical errors (check DevTools)
- [ ] Failed chart load shows retry option
- [ ] Failed auth shows clear error message

---

## Test Execution Notes

**Before Testing:**

1. Clear browser cache/cookies
2. Start dev server: `npm run dev`
3. Have test accounts ready (regular user, admin if testing admin pages)

**During Testing:**

- Keep DevTools console open for errors
- Screenshot any bugs
- Note exact steps to reproduce issues

**Priority Order:**

1. Explorer page (most complex, highest traffic)
2. Ranking page
3. Authentication flows
4. Profile/My Charts
5. Static pages (About, Sources, Methods)
