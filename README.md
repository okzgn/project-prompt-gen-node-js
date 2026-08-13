# Project Prompt Generator

A lightweight, **zero-dependency** Node.js CLI tool designed to pack an entire codebase (or specific modules) into a single, structured Markdown context prompt for Large Language Models (LLMs).

It automatically generates a visual directory tree, reads source code files, maps code syntax highlighting, handles file size limits to save LLM tokens, and provides intelligent folder filtering (restricted vs. whitelisted subfolders).

---

## 📌 Features

- **Zero External Dependencies:** Built using 100% native Node.js APIs (`fs`, `path`, `process`, `util`).
- **Visual Directory Tree:** Generates an ASCII tree structure (using `├──`, `└──`) of your project for high-level architectural awareness.
- **Smart Token & File Guardrails:** Automatically omits binary files, lockfiles, minified files (`.min.js`, `.min.css`), and files exceeding **100 KB** or **3,000 lines**.
- **Advanced Whitelist & Restriction Filtering:** Focus deep LLM context on a single subfolder (e.g., `login`) while hiding surrounding modules within a parent directory (e.g., `src/modules`).
- **Automatic Language Mapping:** Maps 20+ file extensions (`.ts`, `.py`, `.rs`, `.go`, `.vue`, `.jsx`, `.env`, etc.) to Markdown code block identifiers for optimal syntax highlighting.
- **Native CLI Argument Parsing:** Flexible flags (`--target`, `--out`, `--include`, `--restrict`, `--instructions`, `--write`).

---

## 📁 Repository Structure

```text
.
├── core/
│   └── default_to_str.js   # Main engine: Directory traversal, tree generator, and file reader
├── _prompts/               # Output directory where generated prompts are saved
├── index.js                # CLI entry point and native argument parser
└── LICENSE                 # Project license
└── README.md               # Project documentation
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v14.0.0 or higher installed.

### Execution

Simply run `index.js` with Node.js:

```bash
node index.js
```

By default, this scans the current directory (`./`) and outputs a timestamped `.txt` file inside the `_prompts/` folder.

---

## 🎛️ CLI Usage & Options

You can pass command-line arguments using flags:

| Flag | Description | Default Value | Example |
| :--- | :--- | :--- | :--- |
| `--target` | Root directory of the project to scan. | `./` | `--target=../my-app` |
| `--out` | Output file name saved in `_prompts/`. | `project_prompt_<timestamp>.txt` | `--out=refactor_context.txt` |
| `--instructions` | Custom prompt instructions appended at the end of the file. | `""` | `--instructions="Refactor login to TypeScript"` |
| `--include` | Comma-separated list of whitelisted subfolder names to read. | `[]` | `--include=login,auth` |
| `--restrict` | Comma-separated list of parent container folders to restrict. | `[]` | `--restrict=modules,services` |
| `--write` | Set to `false` to print output to `stdout` instead of saving a file. | `true` | `--write=false` |

---

## 💡 Usage Examples

### 1. Basic Prompt Generation
Scan current directory and create a prompt file in `_prompts/`:
```bash
node index.js
```

### 2. Scan a Different Project with Custom Output Name
```bash
node index.js --target=../backend-api --out=backend_context.txt
```

### 3. Focus Context on Specific Modules (Restricted vs. Whitelisted)
If you have a large project like `src/modules/` containing 50 folders, but you only want to send the `login` and `user` code:
```bash
node index.js --target=./ --restrict=modules --include=login,user
```
*Result:* The LLM will see the overall directory structure, but source code will **only** be extracted for the `login` and `user` folders inside `modules`. All other folders in `modules` will be marked as `[CONTENT OMITTED]`.

### 4. Append Custom Prompt Instructions
```bash
node index.js --instructions="Review this codebase for security vulnerabilities in authentication."
```

### 5. Print Prompt Directly to Terminal (No File Saved)
```bash
node index.js --write=false
```

---

## ⚙️ Default Configurations

### Ignored Directories & Files
The tool automatically ignores standard build artifacts, dependency directories, and system files:
- **Directories:** `node_modules`, `.git`, `.vscode`, `.idea`, `.angular`, `.cache`, `.gradle`, `.sourcemaps`, `.tmp`, `_prompts`
- **Files:** `package-lock.json`, `tsconfig.tsbuildinfo`, `.editorconfig`, `LICENSE`, `.gitignore`, `.min.js`, `.min.css`

### Supported File Extensions
Supported extensions are automatically mapped to Markdown syntax tags:
`.js`, `.ts`, `.jsx`, `.tsx`, `.json`, `.html`, `.css`, `.scss`, `.vue`, `.svelte`, `.py`, `.java`, `.rs`, `.go`, `.php`, `.sql`, `.yaml`, `.yml`, `.xml`, `.sh`, `.md`, `.env`

---

## 📄 Output Format Example

The generated `.txt` file is formatted as follows:

```markdown
CONTEXT: Project structure.
--- PROJECT STRUCTURE ---
├── core
│   └── default_to_str.js
└── index.js

--- CONFIGURATION FILES ---

================ FILE: package.json ================
```json
{
  "name": "project-prompt-generator",
  "version": "1.0.0"
}
```
--------------------------------------------------

--- SOURCE CODE IN ROOT FOLDER ---

================ FILE: index.js ================
```javascript
const { generateProjectPrompt } = require('./core/default_to_str');
...
```
--------------------------------------------------

--- END OF CONTEXT ---

Refactor the authentication logic using best practices.
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

Copyright (c) 2026 [OKZGN](https://okzgn.com)
