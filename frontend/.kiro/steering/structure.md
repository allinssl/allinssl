# Project Structure

## Monorepo Organization

```
├── apps/                   # Applications
├── packages/               # Shared packages
├── plugin/                 # Custom Vite plugins
├── scripts/                # Build and utility scripts
├── types/                  # Global type definitions
└── environment/            # Environment configurations
```

## Application Structure (`apps/`)

Each app follows a consistent structure:

```
apps/app-name/
├── src/
│   ├── api/               # API layer and HTTP clients
│   ├── assets/            # Static assets (images, icons, fonts)
│   ├── components/        # Reusable Vue components
│   ├── config/            # App configuration
│   ├── lib/               # App-specific utilities
│   ├── locales/           # i18n translation files
│   ├── router/            # Vue Router configuration
│   ├── styles/            # Global styles and themes
│   ├── types/             # TypeScript type definitions
│   ├── views/             # Page components
│   ├── App.tsx            # Root component
│   └── main.ts            # Application entry point
├── public/                # Public static files
├── types/                 # Generated type definitions
├── mock/                  # Mock data for development
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Shared Packages (`packages/`)

- **@baota/utils**: Common utilities (browser, data, string, crypto, etc.)
- **@baota/vue/**: Vue-specific packages
  - `hooks/`: Composable functions
  - `i18n/`: Internationalization utilities
  - `naive-ui/`: Naive UI components and themes
  - `pinia/`: State management utilities
  - `router/`: Router utilities
  - `vite/`: Vite configuration helpers

## Custom Plugins (`plugin/`)

- **vite-plugin-i18n**: Translation file generation
- **vite-plugin-ftp-sync**: FTP deployment automation
- **vite-plugin-turborepo-deploy**: Git synchronization
- **vite-plugin-html-to-php-template**: HTML to PHP conversion
- **vite-plugin-timestamp-cache**: Cache busting utilities

## Naming Conventions

- **Files**: kebab-case for directories, camelCase for TypeScript files
- **Components**: PascalCase for Vue components (`.tsx` preferred)
- **Views**: Organized by feature in `src/views/`
- **API**: Grouped by domain in `src/api/`
- **Types**: Descriptive names ending in `.d.ts`

## Path Aliases

Standard aliases used across apps:
- `@/`: `src/` directory
- `@api/`: `src/api/`
- `@components/`: `src/components/`
- `@views/`: `src/views/`
- `@assets/`: `src/assets/`
- `@types/`: `src/types/`
- Feature-specific aliases (e.g., `@login/`, `@certManage/`)

## Architecture Patterns

- **MVC Separation**: Separate state (stores), controllers (composables), and views
- **Composition API**: Use `<script setup>` syntax
- **TSX Components**: Prefer `.tsx` over `.vue` for complex components
- **Feature-based Organization**: Group related files by feature/domain