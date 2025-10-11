# Auto-Linting & Code Quality Setup

**Modern October 2025 Standards - Fully Automated**

---

## What's Configured

### 🎨 Prettier (Auto-Formatting)

- **Formats on save** in VS Code
- **Consistent style** across entire codebase
- **Tailwind CSS class sorting** (automatic)
- **Single quotes, 2 spaces, 100 char width**

### 🔍 ESLint (Code Quality)

- **TypeScript strict mode** (no `any` types)
- **React 19 best practices** (hooks, JSX patterns)
- **Next.js 15 App Router** (server components, image optimization)
- **Accessibility** (a11y rules enforced)
- **Modern ES2025+ syntax**

### 🪝 Git Hooks (Husky + lint-staged)

- **Pre-commit**: Auto-lint and format before commits
- **Prevents bad code** from entering the repository
- **Fast**: Only lints changed files

---

## Technologies

| Tool               | Version | Purpose                        |
| ------------------ | ------- | ------------------------------ |
| ESLint             | Latest  | Code quality & error detection |
| Prettier           | Latest  | Code formatting                |
| Husky              | Latest  | Git hooks management           |
| lint-staged        | Latest  | Lint only changed files        |
| @typescript-eslint | Latest  | TypeScript-specific rules      |
| eslint-config-next | Latest  | Next.js 15 best practices      |

---

## How It Works

### On Save (VS Code):

```
1. You save a file
2. Prettier auto-formats it
3. ESLint shows any errors
4. You see formatted code instantly
```

### On Commit:

```
1. You run: git commit -m "..."
2. Husky triggers pre-commit hook
3. lint-staged lints changed files
4. ESLint fixes auto-fixable issues
5. Prettier formats everything
6. Commit proceeds (or fails if errors)
```

### On Push (CI/CD):

```
1. GitHub Actions runs
2. Lints entire codebase
3. Runs type check
4. Fails if any errors
5. Prevents broken code in main branch
```

---

## ESLint Rules (October 2025 Standards)

### TypeScript: Strict Typing

```javascript
"@typescript-eslint/no-explicit-any": "error"
// ❌ Bad:  catch (error: any)
// ✅ Good: catch (error: unknown)

"@typescript-eslint/consistent-type-imports": "error"
// ❌ Bad:  import { User } from './types'
// ✅ Good: import type { User } from './types'

"@typescript-eslint/no-unused-vars": "warn"
// Prefix unused variables with _ to silence warning
// Example: function foo(_unusedParam: string)
```

### React 19: Modern Patterns

```javascript
"react/jsx-no-leaked-render": "error"
// ❌ Bad:  {count && <Component />}  // Shows "0" when count is 0
// ✅ Good: {count > 0 && <Component />}

"react/jsx-key": "error"
// ❌ Bad:  <>
//            <div>Item 1</div>
//            <div>Item 2</div>
//          </>
// ✅ Good: <>
//            <div key="1">Item 1</div>
//            <div key="2">Item 2</div>
//          </>

"react-hooks/exhaustive-deps": "warn"
// Warns about missing dependencies in useEffect
```

### Next.js 15: App Router

```javascript
"@next/next/no-html-link-for-pages": "error"
// ❌ Bad:  <a href="/about">About</a>
// ✅ Good: <Link href="/about">About</Link>

"@next/next/no-img-element": "error"
// ❌ Bad:  <img src="/logo.png" alt="Logo" />
// ✅ Good: <Image src="/logo.png" alt="Logo" width={100} height={100} />
```

### Code Quality

```javascript
"prefer-const": "error"
// ❌ Bad:  let name = "John"; // Never reassigned
// ✅ Good: const name = "John";

"prefer-template": "error"
// ❌ Bad:  "Hello, " + name + "!"
// ✅ Good: `Hello, ${name}!`

"no-console": ["warn", { allow: ["warn", "error", "info"] }]
// ⚠️  Warn:  console.log("debug")
// ✅ Allow: console.error("error")
```

### Accessibility

```javascript
"jsx-a11y/alt-text": "error"
// ❌ Bad:  <img src="/logo.png" />
// ✅ Good: <img src="/logo.png" alt="Company logo" />

"jsx-a11y/aria-props": "error"
// Validates ARIA attributes

"jsx-a11y/aria-role": "error"
// Validates ARIA roles
```

---

## Prettier Configuration

```json
{
  "semi": true, // Use semicolons
  "singleQuote": true, // Single quotes for strings
  "tabWidth": 2, // 2 space indentation
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "printWidth": 100, // Max line length
  "arrowParens": "always", // (x) => x
  "endOfLine": "lf", // Unix line endings
  "bracketSpacing": true, // { foo: bar }
  "jsxSingleQuote": false, // Double quotes in JSX
  "plugins": [
    "prettier-plugin-tailwindcss" // Auto-sort Tailwind classes
  ]
}
```

### Tailwind Class Sorting (Automatic)

```jsx
// Before:
<div className="text-red-500 p-4 bg-white hover:bg-gray-100" />

// After (automatic):
<div className="bg-white p-4 text-red-500 hover:bg-gray-100" />
```

---

## VS Code Integration

### Auto-Format on Save

Already configured in `.devcontainer/devcontainer.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Recommended Extensions (Auto-installed in Codespace)

- ✅ ESLint (`dbaeumer.vscode-eslint`)
- ✅ Prettier (`esbenp.prettier-vscode`)
- ✅ Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

---

## Commands

### Lint Entire Codebase

```bash
npm run lint
```

### Lint with Auto-Fix

```bash
npm run lint -- --fix
```

### Format All Files

```bash
npx prettier --write .
```

### Check Formatting (CI/CD)

```bash
npx prettier --check .
```

### Type Check

```bash
npx tsc --noEmit
```

---

## Pre-Commit Hook

### What It Does:

1. Stages files with `git add`
2. Pre-commit hook runs automatically
3. Lints only staged files (fast!)
4. Auto-fixes what it can
5. Formats with Prettier
6. Commit succeeds or fails

### Manual Trigger (Testing):

```bash
npx lint-staged
```

### Bypass Hook (NOT RECOMMENDED):

```bash
git commit --no-verify -m "emergency fix"
# Only use for genuine emergencies!
```

---

## CI/CD Integration

### GitHub Actions Workflow

`.github/workflows/ci-cd.yml` includes:

```yaml
- name: Run linter
  run: npm run lint

- name: Type check
  run: npx tsc --noEmit

- name: Check formatting
  run: npx prettier --check .
```

**Result**: No broken code can reach `main` branch!

---

## Troubleshooting

### ESLint Errors on Commit

```bash
# See what's wrong:
npm run lint

# Auto-fix:
npm run lint -- --fix

# If still failing, fix manually
```

### Prettier Format Conflicts

```bash
# Format entire project:
npx prettier --write .

# Specific file:
npx prettier --write path/to/file.ts
```

### Git Hook Not Running

```bash
# Reinstall hooks:
npm run prepare

# Or manually:
npx husky install
```

### "Husky command not found"

```bash
# Install dev dependencies:
npm install

# Hooks should auto-install via "prepare" script
```

---

## Best Practices

### ✅ DO:

- Let Prettier handle formatting (don't fight it)
- Use `unknown` instead of `any` for error types
- Prefix unused variables with `_`
- Import types with `type` keyword
- Use `const` by default, `let` only when needed
- Add alt text to images
- Use Next.js `<Link>` and `<Image>` components

### ❌ DON'T:

- Disable ESLint rules without good reason
- Use `any` type (use `unknown` with type guards)
- Use `var` (it's 2025!)
- Concatenate strings (use template literals)
- Use `<a>` tags for internal links
- Use `<img>` tags (use `<Image>` from `next/image`)
- Skip the pre-commit hook (unless emergency)

---

## Migration from Old Code

### Fixing `any` Types:

```typescript
// ❌ Old:
catch (error: any) {
  console.error(error.message);
}

// ✅ New:
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}
```

### Fixing Reserved `module` Variable:

```typescript
// ❌ Old:
const module = await getModule();

// ✅ New:
const moduleData = await getModule();
```

### Fixing Unescaped Apostrophes:

```jsx
// ❌ Old:
<p>Don't forget to save!</p>

// ✅ New:
<p>Don&apos;t forget to save!</p>
// OR
<p>{"Don't forget to save!"}</p>
```

---

## Performance

### lint-staged Speed:

- Only lints changed files
- Typical commit: < 3 seconds
- Large commit (50 files): < 10 seconds

### CI/CD Speed:

- Lint entire codebase: ~30-45 seconds
- Type check: ~20-30 seconds
- Total quality checks: ~1 minute

---

## Future Enhancements

### Potential Additions:

- [ ] Biome (faster alternative to ESLint+Prettier)
- [ ] Conventional Commits (commit message linting)
- [ ] Commitizen (interactive commit wizard)
- [ ] Semantic Release (automatic versioning)
- [ ] Dependabot (automated dependency updates)

---

## Summary

**Before This Setup:**

- ❌ Inconsistent formatting
- ❌ Manual linting
- ❌ `any` types everywhere
- ❌ Bad code reaches main branch
- ❌ Style debates

**After This Setup:**

- ✅ Auto-formatting on save
- ✅ Auto-linting on commit
- ✅ Strict TypeScript
- ✅ CI/CD blocks bad code
- ✅ Zero style debates
- ✅ Modern 2025 best practices
- ✅ Fast developer experience

**Result**: Focus on building features, not formatting code! 🚀
