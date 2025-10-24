# Contributing to Mortality Watch

Thank you for your interest in contributing to Mortality Watch! We welcome contributions from developers, researchers, data scientists, and anyone interested in improving mortality statistics accessibility.

## 🌟 Ways to Contribute

### 1. Report Issues

Found a bug or have a feature request?

- Open an issue on [GitHub](https://github.com/MortalityWatch/)
- Provide a clear description and reproduction steps
- Include screenshots or error messages when relevant

### 2. Improve Documentation

- Fix typos or unclear explanations
- Add examples or use cases
- Improve methodology documentation in `/app/pages/methods.vue`
- Update README or inline code comments

### 3. Add Data Sources

Know of reliable mortality data we're missing?

- Suggest new data sources via GitHub issues
- Provide official source links and data format details
- Help integrate new datasets (see Data Processing section)

### 4. Code Contributions

Submit pull requests for:

- Bug fixes
- New features
- Performance improvements
- UI/UX enhancements
- Test coverage

### 5. Share Feedback

- Tell us how you're using Mortality Watch
- Suggest improvements to analysis tools
- Report usability issues

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** 10+
- **Git** for version control

### Canvas Dependencies

Server-side chart rendering requires native dependencies:

**macOS:**

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

**Ubuntu/Debian:**

```bash
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev
```

**Windows:** See [node-canvas documentation](https://github.com/Automattic/node-canvas#windows)

### Setup Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/MortalityWatch/www.mortality.watch.git
   cd www.mortality.watch
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment** (optional for offline development)

   ```bash
   cp .env.example .env
   ```

   Edit `.env` to configure offline development:

   ```bash
   # Download only these countries for faster dev
   NUXT_PUBLIC_DEV_COUNTRIES=USA,GBR,DEU
   NUXT_PUBLIC_USE_LOCAL_CACHE=true
   ```

4. **Download test data** (optional for offline development)

   ```bash
   npm run download-data
   ```

   Now you can develop completely offline!

5. **Start development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

6. **Run all checks**

   ```bash
   npm run check  # Runs lint + typecheck + tests
   ```

### Project Structure

```
app/
├── pages/           # Route pages (Nuxt auto-routing)
├── components/      # Vue components
├── composables/     # Vue composables (reusable logic)
├── lib/             # Utility libraries
├── model/           # Data models and types
├── data.ts          # Core data fetching logic
├── chart.ts         # Chart.js configuration
└── utils.ts         # Helper functions
.data/               # SQLite database (gitignored)
public/              # Static assets
```

---

## 📝 Contribution Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Vue**: Composition API (`<script setup>`)
- **ESLint**: Run `npm run lint:fix` before committing
- **Formatting**:
  - Comma dangle: never
  - Brace style: 1tbs (one true brace style)
  - No trailing spaces

### Commit Messages

Follow conventional commits format:

```
feat: add new visualization type
fix: correct baseline calculation for flu season
docs: update methodology explanations
refactor: extract chart controls into separate component
test: add tests for date range validation
```

### Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests when applicable
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm run check           # Lint + typecheck + tests
   npm run test:e2e        # E2E tests
   npm run build           # Ensure production build works
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: your descriptive message"
   ```

   **Pre-commit hooks** will automatically:
   - Lint and fix code (ESLint)
   - Format code (Prettier)
   - Check types (TypeScript)

   If hooks fail, fix issues and commit again.

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Link related issues
   - Explain why the change is needed
   - Include screenshots for UI changes

### Code Review

- **CI checks must pass** (lint, typecheck, tests, build, E2E)
- All PRs require review before merging
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Be respectful and constructive in discussions

### CI/CD Pipeline

Every PR triggers automated checks:

1. **Lint & Format** - ESLint with caching
2. **Type Check** - TypeScript strict mode
3. **Unit Tests** - 376 Vitest tests
4. **Build Verification** - Production build
5. **E2E Tests** - Playwright on Chromium

View CI status: [![CI](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml/badge.svg)](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml)

---

## 🧪 Testing

### Unit Tests (Vitest)

**376 unit tests** covering data processing, state management, calculations, and utilities.

```bash
npm test                # Run all unit tests
npm run test:ui         # Interactive test UI
npm run test:coverage   # Coverage report
```

**Writing Unit Tests:**

- Place tests next to the code they test (e.g., `useUrlState.test.ts`)
- Use Vitest for unit tests
- Test edge cases and error conditions
- Aim for meaningful test coverage, not 100% coverage

Example:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFunction";

describe("myFunction", () => {
  it("should handle expected input", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("should handle edge cases", () => {
    expect(myFunction("")).toBe("");
  });
});
```

### E2E Tests (Playwright)

**32+ E2E tests** covering user flows, page interactions, and responsive behavior.

```bash
npm run test:e2e        # Run E2E tests (chromium)
npm run test:e2e:ui     # Interactive E2E UI
npm run test:e2e:debug  # Debug tests with Playwright Inspector
npm run test:e2e:report # View HTML test report
```

**Writing E2E Tests:**

- Place tests in `tests/e2e/`
- Test user-facing features and flows
- Use descriptive test names
- Test on chromium (CI runs chromium only)

Example:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should perform user action", async ({ page }) => {
    await page.goto("/page");
    await page.getByRole("button", { name: /click me/i }).click();
    await expect(page).toHaveURL(/\/success/);
  });
});
```

**E2E Test Tips:**

- Wait for `networkidle` before interactions
- Use semantic locators (roles, labels) over CSS selectors
- Test responsive behavior with `isMobile` fixture
- Add timeouts for slow operations

### Running All Tests

```bash
npm run check           # Unit tests + lint + typecheck
npm run test:e2e        # E2E tests
npm run build           # Build verification
```

---

## 📊 Data Processing

### Adding New Data Sources

1. **Identify the source**
   - Must be from official statistical agencies
   - Provide documentation and API/download links
   - Verify data format and update frequency

2. **Create data integration**
   - Add to R data processing pipeline
   - Map to standard schema
   - Handle edge cases (missing data, format changes)

3. **Update metadata**
   - Add source to `/app/pages/sources.vue`
   - Document in data source constants
   - Update coverage information

4. **Test integration**
   - Verify data loads correctly
   - Check visualizations work
   - Test with various configurations

---

## 🔒 Security

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead, email us privately at: **mortalitywatch@proton.me**

We'll respond promptly and work with you to address the issue.

### Security Best Practices

- Never commit sensitive data (API keys, credentials)
- Validate all user inputs
- Follow OWASP security guidelines
- Use Content Security Policy headers (already configured)

---

## 📖 Documentation

### Where to Document

- **Code comments**: Complex logic, non-obvious decisions
- **Methods page** (`/app/pages/methods.vue`): Statistical methodologies
- **README.md**: Project overview, quick start
- **CONTRIBUTING.md** (this file): Contribution guidelines
- **Inline JSDoc**: Function parameters and return types

### Writing Good Documentation

- Be clear and concise
- Provide examples
- Explain "why", not just "what"
- Keep it up-to-date with code changes

---

## 🤝 Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Email**: mortalitywatch@proton.me
- **X/Twitter**: [@MortalityWatch](https://twitter.com/mortalitywatch)

### Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Assume good intentions
- No harassment or discrimination

---

## 📜 License

By contributing to Mortality Watch, you agree that your contributions will be licensed under the same license as the project.

---

## ❓ Questions?

Not sure where to start? Have questions about contributing?

- Open a GitHub Discussion
- Email us at mortalitywatch@proton.me
- Check existing issues and PRs for examples

**Thank you for helping make mortality data more accessible!** 🙏
