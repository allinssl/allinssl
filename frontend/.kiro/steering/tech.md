# Technology Stack

## Build System & Package Management
- **Monorepo**: Turborepo for build orchestration and caching
- **Package Manager**: pnpm (v10.14.0+)
- **Node.js**: >= 18
- **Build Tool**: Vite for fast development and optimized builds

## Frontend Stack
- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Language**: TypeScript (ES2022 target)
- **Syntax**: TSX for Vue components (`.tsx` files preferred)
- **UI Library**: Naive UI
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Pinia with persistence plugin
- **Routing**: Vue Router
- **Utilities**: VueUse, Axios for HTTP requests

## Development Tools
- **Linting**: ESLint with Vue and TypeScript support
- **Formatting**: Prettier
- **Testing**: Vitest
- **Type Checking**: vue-tsc
- **Auto-imports**: unplugin-auto-import for Vue APIs
- **Component Auto-import**: unplugin-vue-components with Naive UI resolver

## Custom Plugins
- **@baota/vite-plugin-i18n**: Internationalization generator
- **@baota/vite-plugin-ftp-sync**: FTP deployment synchronization
- **@baota/vite-plugin-turborepo-deploy**: Git project synchronization

## Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start all apps
pnpm dev --filter app-name  # Start specific app

# Building
pnpm build                  # Build all apps
pnpm build --filter app-name # Build specific app

# Testing & Quality
pnpm test                   # Run tests
pnpm lint                   # Lint all code
pnpm check-types           # Type checking
pnpm format                # Format code

# Utilities
pnpm clear                 # Clean temp files
pnpm sync                  # Sync project files
```

## Workspace Structure
- Apps use `workspace:*` dependencies for internal packages
- Shared packages under `@baota/` namespace
- All packages support both ESM and CJS exports