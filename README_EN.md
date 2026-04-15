# UI Design to Vue Component Converter

English | [中文](README.md)

[![GitHub license](https://img.shields.io/github/license/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/issues)
[![npm version](https://img.shields.io/npm/v/ui-to-vue-converter)](https://www.npmjs.com/package/ui-to-vue-converter)

One-click batch conversion of UI design screenshots (LanHu, Figma, etc.) to Vue 3 components. Supports multiple UI libraries, automatic public component extraction, and can be used as a Claude Code/OpenClaw/Trace skill.

## Features

- ✅ Batch scan design directories, auto-detect pages and different states
- ✅ UI library options: Vant (mobile), Element Plus, Ant Design Vue (PC)
- ✅ Auto-detect and extract public components, reduce duplicate code
- ✅ **Support design cut images/assets for more accurate UI restoration**
- ✅ Generate Vue 3 Composition API compliant code
- ✅ Auto-generate router configuration
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

## API Key Configuration

Priority: `--config` > `.ui-to-vue.config.json` > `DASHSCOPE_API_KEY` environment variable

```json
// .ui-to-vue.config.json
{
  "apiKey": "your_dashscope_key",
  "input": "./designs",
  "ui": "vant",
  "output": "./src"
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