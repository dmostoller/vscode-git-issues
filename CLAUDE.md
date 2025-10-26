# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**IMPORTANT: This project uses pnpm exclusively. Never use npm or yarn.**

All commands must use `pnpm`:

- Install dependencies: `pnpm install`
- Run scripts: `pnpm run <script>`
- Add packages: `pnpm add <package>`
- Update packages: `pnpm update <package>`

## Project Overview

A VSCode extension for viewing and managing GitHub issues with a React-based webview interface. The extension uses a dual-build architecture: Node.js for the extension host and React/Vite for the webview.

## Build Commands

```bash
# Build everything (extension + webview)
pnpm run build

# Build only the extension (TypeScript compilation)
pnpm run build:extension

# Build only the webview (Vite + React)
pnpm run build:webview

# Watch mode for development (runs both builds in watch mode)
pnpm run watch

# Lint the codebase
pnpm run lint

# Run tests
pnpm run test

# Package the extension for distribution
pnpm run package
```

## Architecture

### Dual-Build System

The project has two separate build processes that must both complete successfully:

1. **Extension Build** (`tsconfig.json`):
   - Compiles TypeScript files in `src/extension/` to Node.js CommonJS
   - Output: `out/extension/` directory
   - Entry point: `out/extension/extension.js`
   - Uses Node.js module resolution (Node16)

2. **Webview Build** (`vite.config.mts` + `tsconfig.webview.json`):
   - Bundles React app in `src/webview/` with Vite
   - Output: `dist/webview/webview.js` and `dist/webview/webview.css`
   - Entry point: `src/webview/index.tsx`
   - Uses ESM module resolution (bundler mode)

### Directory Structure

```
github-issues/
├── src/
│   ├── extension/          # Extension host code (Node.js)
│   │   ├── extension.ts    # Main extension entry point
│   │   ├── AuthManager.ts  # GitHub token storage
│   │   ├── GitHubService.ts # Octokit wrapper
│   │   ├── IssueTreeProvider.ts # Tree view data provider
│   │   ├── WebviewManager.ts # Webview lifecycle manager
│   │   └── types.ts        # Shared TypeScript types
│   └── webview/            # Webview UI code (React)
│       ├── index.tsx       # React entry point
│       ├── App.tsx         # Main React component
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       └── styles/         # Tailwind CSS
├── src/components/ui/      # shadcn/ui components (shared)
├── src/lib/               # Utility functions (shared)
├── src/hooks/             # Additional hooks (shared)
├── out/                   # Extension build output (gitignored)
├── dist/                  # Webview build output (gitignored)
└── package.json           # Main package.json at project root
```

## Tailwind CSS v4 Setup

This project uses **Tailwind CSS v4** (not v3), which has significant differences:

### Key Tailwind v4 Differences

1. **No `tailwind.config.js` file needed** - Configuration is done via CSS `@theme` layer
2. **Uses `@import "tailwindcss"`** instead of `@tailwind` directives
3. **Uses `@tailwindcss/vite` plugin** for Vite integration
4. **CSS variables use `--color-*` prefix** for theme colors

### Current Configuration

- **Vite Plugin**: `@tailwindcss/vite` is added to `vite.config.mts`
- **CSS Entry**: `src/webview/styles/index.css` uses `@import "tailwindcss"`
- **Theme Variables**: Defined in `@theme` layer, mapped to VSCode CSS variables
- **Version**: Both `tailwindcss` and `@tailwindcss/vite` must be the same version (currently 4.1.16)

### Troubleshooting Tailwind v4

If you see errors like "Cannot convert undefined or null to object":

1. **Check version consistency**:

   ```bash
   pnpm ls tailwindcss
   pnpm ls @tailwindcss/vite
   ```

   Both should show the same version.

2. **Update and deduplicate**:

   ```bash
   pnpm update tailwindcss @tailwindcss/vite
   pnpm dedupe
   pnpm install
   ```

3. **Verify CSS syntax**: Ensure `src/webview/styles/index.css` uses `@import "tailwindcss"` not `@tailwind`

4. **Never create a `tailwind.config.js`** - v4 uses CSS-based configuration

### VSCode Theme Integration

All colors are mapped to VSCode's theme variables in the `@theme` layer:

- `--color-background` → `var(--vscode-editor-background)`
- `--color-foreground` → `var(--vscode-editor-foreground)`
- `--color-primary` → `var(--vscode-button-background)`
- etc.

This ensures the webview automatically matches the user's VSCode theme.

## Message Passing Between Extension and Webview

Communication between the Node.js extension host and the React webview happens via message passing:

### Extension → Webview

```typescript
webviewPanel.webview.postMessage({
  command: 'loadIssue',
  issue: { /* issue data */ }
});
```

### Webview → Extension

```typescript
vscode.postMessage({
  command: 'addComment',
  issueNumber: 123,
  body: 'Comment text'
});
```

### Message Protocol

Defined in `src/extension/types.ts` and `src/webview/App.tsx`:

**To Webview:**

- `loadIssue` - Load issue details
- `commentAdded` - Notify comment was added
- `issueUpdated` - Notify issue was updated
- `error` - Show error message

**To Extension:**

- `addComment` - Add a comment
- `updateIssue` - Update issue properties
- `closeIssue` - Close an issue
- `reopenIssue` - Reopen an issue

## Key Services

### AuthManager (`src/extension/AuthManager.ts`)

- Manages GitHub personal access tokens
- Uses VSCode's `SecretStorage` API for secure storage
- Prompts user for token when needed

### GitHubService (`src/extension/GitHubService.ts`)

- Wrapper around `@octokit/rest`
- Methods: `listIssues()`, `getIssue()`, `createComment()`, `updateIssue()`
- Handles GitHub API authentication and error handling

### IssueTreeProvider (`src/extension/IssueTreeProvider.ts`)

- Implements `vscode.TreeDataProvider<IssueTreeItem>`
- Provides data for the sidebar tree view
- Groups issues by state (open/closed)
- Includes refresh functionality

### WebviewManager (`src/extension/WebviewManager.ts`)

- Singleton pattern to manage webview panel lifecycle
- Generates HTML with proper Content Security Policy (CSP)
- Loads bundled `webview.js` and `webview.css` from `dist/webview/`
- Handles message passing with the webview

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` → `./src/*`

**Important**: Components in `src/webview/components/` must be imported as:

```typescript
import { IssueHeader } from '@/webview/components/IssueHeader';
```

Not as:

```typescript
import { IssueHeader } from '@/components/IssueHeader'; // ❌ Wrong
```

The shadcn/ui components in `src/components/ui/` can be imported as:

```typescript
import { Button } from '@/components/ui/button';
```

## shadcn/ui Components

The project uses shadcn/ui for UI components. Components are installed in `src/components/ui/`.

To add a new component:

```bash
# This will add components to src/components/ui/
npx shadcn@latest add <component-name>
```

Configuration is in `components.json`.

**Note**: Always verify the component was added to the correct location (`src/components/ui/`) after installation.

## Development Workflow

### First-Time Setup

1. Install dependencies: `pnpm install`
2. Build the project: `pnpm run build`
3. Press F5 in VSCode to launch Extension Development Host

### Active Development

1. Run watch mode: `pnpm run watch`
2. Press F5 to launch Extension Development Host
3. Make changes to extension or webview code
4. Reload the Extension Development Host window (Cmd+R / Ctrl+R)

### Testing the Extension

1. In the Extension Development Host, run the command "GitHub Issues: Sign In"
2. Enter a GitHub personal access token
3. Run "GitHub Issues: Configure Repository" and enter owner/repo
4. View the GitHub Issues sidebar
5. Click an issue to open the webview

### Debugging

- **Extension Host**: Set breakpoints in `src/extension/` files, use VSCode debugger
- **Webview**: Open DevTools in the webview panel (Cmd+Shift+P → "Developer: Open Webview Developer Tools")
- **Console Logs**: Extension logs appear in Debug Console; webview logs appear in Webview DevTools Console

## Common Issues

### Build Fails After Updating Dependencies

If Tailwind or other build tools fail:

```bash
pnpm dedupe
pnpm install
pnpm run build
```

### Import Errors for Webview Components

Verify path aliases are correct:

- Webview components: `@/webview/components/...`
- UI components: `@/components/ui/...`
- Utilities: `@/lib/utils`
- Hooks: `@/webview/hooks/...` or `@/hooks/...`

### Webview Not Updating

1. Make sure watch mode is running: `pnpm run watch`
2. Reload the Extension Development Host window
3. Close and reopen the webview panel

### Extension Commands Not Appearing

1. Ensure `activationEvents` in `package.json` includes your command
2. Rebuild and reload: `pnpm run build` then reload Extension Development Host
3. Check for TypeScript errors in extension code

## Extension Configuration

User settings are defined in `package.json` under `contributes.configuration`:

- `githubIssues.owner` - Repository owner (username or organization)
- `githubIssues.repo` - Repository name

Access configuration in code:

```typescript
const config = vscode.workspace.getConfiguration('githubIssues');
const owner = config.get<string>('owner');
const repo = config.get<string>('repo');
```

## Security Notes

- GitHub tokens are stored in VSCode's `SecretStorage`, never in code or settings
- Webview uses strict Content Security Policy (CSP)
- All GitHub API calls happen in the extension host, never in the webview
- Never expose sensitive data to the webview
