# UI Design to Vue Component Converter

English | [中文](README.md)

[![GitHub license](https://img.shields.io/github/license/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/issues)
[![npm version](https://img.shields.io/npm/v/ui-to-vue-converter)](https://www.npmjs.com/package/ui-to-vue-converter)

One-click batch conversion of UI design screenshots (LanHu, Figma, etc.) to Vue 3 components. Supports multiple UI libraries, automatic public component extraction, and can be used as a Claude Code/OpenClaw/Trace skill.

## Features

- ✅ Batch scan design directories, auto-detect pages and different states
- ✅ **Smart directory structure detection** — auto-detect module/page hierarchy
- ✅ UI library options: Vant (mobile), Element Plus, Ant Design Vue (PC)
- ✅ Auto-detect and extract public components, reduce duplicate code
- ✅ **Support design cut images/assets for more accurate UI restoration**
- ✅ Generate Vue 3 Composition API compliant code
- ✅ **Support Preset configuration for project-specific output standards**
- ✅ **Multi API Provider support** — Anthropic, DashScope, OpenAI, etc.
- ✅ **Auto router injection** — append routes to existing router file
- ✅ CSS syntax error auto-fix
- ✅ Design image size auto-detection (@1x/@2x/@3x)
- ✅ Redundant import auto-cleanup
- ✅ Auto-format generated code

## Quick Start

### Option 1: Clone from GitHub
```bash
# Clone project
git clone https://github.com/EricLeeN1/ui2VueConverter.git
cd ui2VueConverter

# Install dependencies
npm install

# Configure API key
export DASHSCOPE_API_KEY=your_api_key

# Generate code
node src/cli.js --input ./screenshots --ui vant --output ./src
```

### Option 2: Global Install
```bash
npm install -g ui-to-vue-converter

# Configure API key
export DASHSCOPE_API_KEY=your_api_key

# Generate code
ui-to-vue --input ./screenshots --ui vant --output ./src
```

### Option 3: Claude Code Plugin
```bash
# Add marketplace
claude plugin marketplace add https://github.com/EricLeeN1/ui2VueConverter.git

# Install plugin
claude plugin install ui-to-vue@ui-to-vue-marketplace
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input` | Design image directory | `./screenshots` |
| `--ui` | UI library: vant/element-plus/antd-vue | `vant` |
| `--output` | Output directory | `./src` |
| `--config` | Config file path | `./.ui-to-vue.config.json` |
| `--preset` | Configuration preset | `default` |
| `--inject-router` | Auto inject routes to project router file, e.g. `src/router/index.ts` | - |

## Preset Configuration

The tool supports customizing project standards via `.ui-to-vue.config.json` configuration file, without modifying the tool source code.

### Config File Example

```json
{
  "preset": "default",
  "useTypeScript": true,
  "styleLang": "scss",
  "useUnoCSS": false,
  "designWidth": 375,
  "projectStandardWidth": 750,
  "rootValue": 75,
  "layoutComponent": "BasePages",
  "componentImportMode": "auto",
  "fileNaming": "kebab",
  "outputStructure": "flat",
  "provider": "anthropic",
  "url": "https://coding.dashscope.aliyuncs.com/apps/anthropic/v1/messages",
  "apiKey": "your_api_key",
  "model": "qwen3.6-plus",
  "toast": "custom",
  "customToastCall": "toast.show(\"{message}\")",
  "confirm": "custom",
  "customConfirmCall": "dialog.confirm(\"{title}\", \"{message}\")",
  "customImports": [
    "import toast from '@/utils/toast'",
    "import dialog from '@/utils/dialog'"
  ],
  "customPromptRules": [
    "Project uses TypeScript, `<script setup lang=\"ts\">`",
    "Styles use SCSS (`<style scoped lang=\"scss\">`), do not use UnoCSS atomic classes",
    "All dimensions use px unit, design draft baseline 750px",
    "Layout wrapped uniformly with BasePages component"
  ],
  "nameMap": {
    "Example Page": "example-page",
    "Pending": "pending"
  }
}
```

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `useTypeScript` | boolean | Generate TypeScript code |
| `styleLang` | string | Style language: `css`/`scss`/`less` |
| `useUnoCSS` | boolean | Use UnoCSS atomic classes |
| `designWidth` | number | Design draft baseline width (e.g. 375/750) |
| `projectStandardWidth` | number | Project design standard width (e.g. 750px), for size conversion |
| `rootValue` | number | postcss-pxtorem rootValue |
| `layoutComponent` | string | Layout component name, e.g. `BasePages` |
| `fileNaming` | string | File naming style: `pascal` or `kebab` |
| `outputStructure` | string | Output structure: `nested` or `flat` |
| `provider` | string | API Provider: `anthropic`/`dashscope`/`openai` |
| `url` | string | Custom API URL |
| `apiKey` | string | API key |
| `model` | string | Model name |
| `toast` | string | Toast type: `van`/`el`/`antd`/`custom`/`none` |
| `confirm` | string | Confirm type: `van`/`el`/`antd`/`custom`/`none` |
| `customImports` | string[] | Additional import modules |
| `customPromptRules` | string[] | Custom AI Prompt rules |
| `nameMap` | object | Map Chinese directory names to English |

### nameMap Name Mapping

When design directories use Chinese names, `nameMap` can automatically map them to English file names:

```json
{
  "nameMap": {
    "Example Page": "example-page",
    "Pending": "pending",
    "Processed": "processed"
  }
}
```

## Path Modes

All path parameters support **both relative and absolute paths**:
- **Relative path**: Relative to current working directory (CWD)
- **Absolute path**: Use the full path directly

### Examples
```bash
# Relative path (recommended)
ui-to-vue --input ./designs --output ./src

# Absolute path
ui-to-vue --input /Users/your-username/common-designs --output /Users/your-username/project/src
```

## 🖼️ Design Cut Images/Assets Support

To improve UI restoration accuracy, this tool supports recognizing design cut images (icons, buttons, tags, etc.) and sends them to the AI model for analysis, generating more accurate code for icon styles, colors, and sizes.

### Why Cut Images?

| With Cut Images | Without Cut Images |
|-----------------|-------------------|
| Icon/button styles accurate | May use default component icons |
| Color values more precise | Colors may be inaccurate |
| Spacing/sizes more accurate | Sizes may deviate |
| Custom elements high fidelity | Custom elements may be misinterpreted |

### Cut Image Directory Structure

The tool supports **three-level cut image hierarchy** with priority from high to low:

| Level | Directory Structure | Use Case |
|-------|---------------------|----------|
| Page-level | `Module/PageType/cut-images/` | Cut images for specific page only |
| Module-level | `Module/cut-images/` | Cut images shared across module |
| Global-level | `cut-images/` | Cut images shared across all modules |

```
screenshots/
├── HomePage/                     # Module
│   ├── List/                     # Page type (secondary directory)
│   │   ├── HomePage-List-Default@3x.png  # Page screenshot
│   │   ├── HomePage-List-Loading@3x.png
│   │   └── cut-images/           # Page-level cut images ⭐⭐⭐
│   │       ├── btn-refresh.png   # List page refresh button
│   │       ├── icon-status.png   # List status icon
│   │       └── ...
│   │
│   ├── Detail/                   # Another page type
│   │   ├── HomePage-Detail@3x.png
│   │   ├── cut-images/           # Detail page cut images
│   │   │   ├── btn-action.png    # Detail action button
│   │   │   └── ...
│   │
│   ├── cut-images/               # Module-level cut images ⭐⭐
│   │   ├── icon-back.png         # Back arrow (module shared)
│   │   ├── icon-search.png       # Search icon (module shared)
│   │   └── ...
│   │
│   ├── HomePage-Default@3x.png   # Primary directory structure (compatible)
│   ├── HomePage-Detail@3x.png
│   ├── HomePage-Loading@3x.png
│
├── OrderManagement/
│   ├── List/
│   │   ├── OrderManagement-List@3x.png
│   │   └── cut-images/
│   │       └── ...
│   ├── cut-images/
│   │   └── ...
│
├── cut-images/                   # Global cut images ⭐
│   ├── logo.png                  # Logo (shared across all modules)
│   ├── icon-home.png             # Home icon
│   ├── icon-user.png             # User icon
│   ├── avatar-default.png        # Default avatar
│   └── ...
│
└── index.html                    # Preview page (optional)
```

**Cut Image Priority**: Page-level > Module-level > Global-level

When same-named cut images exist at different levels, page-level ones are used first, ensuring each page uses the most appropriate assets.

### Cut Image Naming Convention

For better type recognition, use these naming prefixes:

| Prefix | Type | Example |
|--------|------|---------|
| `icon-` | Icon | `icon-back.png`, `icon-search.png` |
| `btn-` / `button-` | Button | `btn-primary.png`, `btn-submit.png` |
| `logo` | Logo | `logo.png`, `logo-dark.png` |
| `tab-` | Tab | `tab-active.png`, `tab-inactive.png` |
| `badge-` | Badge | `badge-new.png`, `badge-count.png` |
| `tag-` | Tag | `tag-urgent.png`, `tag-status.png` |
| `arrow-` | Arrow | `arrow-left.png`, `arrow-right.png` |
| `bg-` | Background | `bg-header.png`, `bg-card.png` |
| `avatar-` | Avatar | `avatar-default.png`, `avatar-small.png` |

### Supported Cut Image Directory Names

The tool auto-recognizes these directories as cut image directories:
- `切图` (Chinese)
- `assets`
- `icons`
- `sprites`
- `cut`
- `images`
- `cut-images`

### Supported Formats

- PNG (recommended)
- JPG/JPEG
- SVG

### Generation Output

```bash
# Run generation, tool auto-detects cut image directories
node src/cli.js --input ./screenshots --ui vant --output ./src

# Output example:
# ✅ Detected 5 page groups
# ✅ Detected 12 design cut images/assets  ← Cut images recognized
# ✅ Loaded Vant UI library config
# Generating page: HomePage
```

## UI Library Options

| UI Library | Use Case | Design Width | Style Unit |
|------------|----------|--------------|------------|
| `vant` | Mobile H5/App | 375px | px → rem (rootValue: 37.5) |
| `element-plus` | PC Admin Dashboard | 1920px | px |
| `antd-vue` | PC Enterprise App | 1920px | px |

**Note**: Export design images at corresponding width baseline for accurate size conversion.

## API Configuration

Supports multiple LLM Providers: Anthropic Messages API (DashScope Coding Plan, etc.), OpenAI Chat Completions API.

Priority: `--config` > `.ui-to-vue.config.json` > environment variable

```json
// .ui-to-vue.config.json — DashScope (default)
{
  "provider": "anthropic",
  "url": "https://coding.dashscope.aliyuncs.com/apps/anthropic/v1/messages",
  "apiKey": "your_api_key",
  "model": "qwen3.6-plus"
}

// .ui-to-vue.config.json — OpenAI
{
  "provider": "openai",
  "url": "https://api.openai.com/v1/chat/completions",
  "apiKey": "your_openai_key",
  "model": "gpt-4o"
}
```

**⚠️ Security Warning**: Add `.ui-to-vue.config.json` to `.gitignore` to prevent accidental API key exposure.

```gitignore
# .gitignore
.ui-to-vue.config.json
```

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Contributing

Issues and Pull Requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## ⭐ Support

If this project helps you, please give it a Star!

---

**This project has no official affiliation with Alibaba/Qwen, only uses its public API service.**