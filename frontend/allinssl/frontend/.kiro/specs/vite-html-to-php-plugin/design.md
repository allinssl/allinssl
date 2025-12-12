# Design Document

## Overview

The Vite HTML to PHP Template plugin is a post-build transformation tool that converts standard HTML files into PHP template format. The plugin integrates with Vite's build lifecycle, executing after the build process completes to perform secondary transformations on generated HTML files. It uses HTML parsing to extract specific content sections and reorganizes them into a structured PHP template format compatible with template engines like ThinkPHP.

## Architecture

### Plugin Architecture

The plugin follows Vite's plugin architecture pattern and implements the following hooks:

- **closeBundle**: Executes after the build is complete and all files are written
- **buildEnd**: Fallback hook for error handling and cleanup

### Core Components

```
vite-plugin-html-to-php-template/
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── parser.ts             # HTML parsing and content extraction
│   ├── template-generator.ts # PHP template generation
│   ├── file-processor.ts     # File system operations
│   └── types.ts              # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Components and Interfaces

### Plugin Interface

```typescript
interface PluginOptions {
  // Input directory containing HTML files (default: 'dist')
  inputDir?: string;
  
  // Output directory for PHP templates (default: same as inputDir)
  outputDir?: string;
  
  // Glob pattern for HTML files to process (default: '**/*.html')
  include?: string | string[];
  
  // Glob pattern for files to exclude (default: [])
  exclude?: string | string[];
  
  // Template configuration
  template?: {
    extend?: string;           // Default: 'main/newMain'
    blocks?: BlockConfig;      // Block name mappings
    footer?: string;           // Default: 'footer2'
  };
  
  // Processing options
  preserveOriginal?: boolean;  // Keep original HTML files (default: false)
  encoding?: string;          // File encoding (default: 'utf-8')
}

interface BlockConfig {
  title?: string;      // Default: 'title'
  keywords?: string;   // Default: 'keywords'
  description?: string; // Default: 'description'
  csslink?: string;    // Default: 'csslink'
  main?: string;       // Default: 'main'
  script?: string;     // Default: 'script'
}
```

### HTML Parser Interface

```typescript
interface ParsedContent {
  title: string;
  keywords: string;
  description: string;
  stylesheets: string[];
  scripts: string[];
  bodyContent: string;
}

interface ParserOptions {
  preserveComments?: boolean;
  minifyContent?: boolean;
}
```

### Template Generator Interface

```typescript
interface TemplateConfig {
  extend: string;
  blocks: BlockConfig;
  footer: string;
}

interface GeneratedTemplate {
  content: string;
  blocks: {
    [key: string]: string;
  };
}
```

## Data Models

### HTML Content Extraction Model

The parser extracts content using the following mapping:

1. **Title**: `<title>` element text content
2. **Keywords**: `<meta name="keywords" content="...">` attribute value
3. **Description**: `<meta name="description" content="...">` attribute value
4. **Stylesheets**: All `<link rel="stylesheet" ...>` elements (complete tags)
5. **Scripts**: All `<script>` elements with `type="text/javascript"` or `type="module"` (complete tags)
6. **Body Content**: Complete innerHTML of `<body>` element

### PHP Template Structure Model

```php
<!-- 引入公共 -->
{extend name="main/newMain"/}
<!-- 标题 -->
{block name="title"}[TITLE_CONTENT]{/block}
<!-- 关键字 -->
{block name="keywords"}[KEYWORDS_CONTENT]{/block}
<!-- 描述 -->
{block name="description"}[DESCRIPTION_CONTENT]{/block}
<!-- 自定义css -->
{block name="csslink"}
[STYLESHEET_LINKS]
{/block}
<!-- 主体内容 -->
{block name="main"}
[BODY_CONTENT]
{/block}
<!-- 自定义js -->
{block name="script"}
[SCRIPT_TAGS]
{/block}

<!-- 底部 -->
{block name="footer2"}{/block}
```

## Error Handling

### Error Categories

1. **File System Errors**
   - File not found
   - Permission denied
   - Disk space issues

2. **HTML Parsing Errors**
   - Malformed HTML
   - Missing required elements
   - Encoding issues

3. **Template Generation Errors**
   - Invalid template configuration
   - Content encoding issues

### Error Handling Strategy

```typescript
class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public file?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ViteHtmlToPhpPluginError';
  }
}

// Error codes
enum ErrorCodes {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR'
}
```

### Recovery Mechanisms

- **Graceful Degradation**: Continue processing other files when one fails
- **Detailed Logging**: Provide file paths and line numbers in error messages
- **Validation**: Validate configuration and input files before processing
- **Rollback**: Option to preserve original files during processing

## Testing Strategy

### Unit Tests

1. **HTML Parser Tests**
   - Test extraction of each content type
   - Test handling of missing elements
   - Test malformed HTML scenarios
   - Test different HTML structures

2. **Template Generator Tests**
   - Test PHP template generation
   - Test custom block configurations
   - Test content escaping and encoding
   - Test template structure validation

3. **File Processor Tests**
   - Test file reading/writing operations
   - Test glob pattern matching
   - Test directory creation
   - Test error handling

### Integration Tests

1. **Plugin Integration**
   - Test with Vite build process
   - Test with different Vite configurations
   - Test with various HTML structures
   - Test error scenarios in build context

2. **End-to-End Tests**
   - Test complete HTML to PHP conversion
   - Test with real-world HTML files
   - Test configuration variations
   - Test performance with large files

### Test Data

Create test fixtures with:
- Simple HTML files
- Complex HTML with multiple scripts/styles
- Malformed HTML files
- HTML files with missing elements
- HTML files with special characters
- Large HTML files for performance testing

## Implementation Considerations

### Performance

- **Streaming**: Use streaming for large files
- **Parallel Processing**: Process multiple files concurrently
- **Memory Management**: Avoid loading entire files into memory when possible
- **Caching**: Cache parsed templates for repeated builds

### Security

- **Path Traversal**: Validate file paths to prevent directory traversal
- **Content Sanitization**: Ensure extracted content doesn't contain malicious code
- **File Permissions**: Respect file system permissions

### Compatibility

- **Node.js Versions**: Support Node.js 16+
- **Vite Versions**: Support Vite 4+ and 5+
- **HTML Standards**: Support HTML5 and XHTML
- **Encoding**: Support UTF-8 and other common encodings

### Extensibility

- **Plugin Hooks**: Allow custom processing hooks
- **Template Customization**: Support custom template formats
- **Content Processors**: Allow custom content transformation functions
- **Output Formats**: Support different template engine formats