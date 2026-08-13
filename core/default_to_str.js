const fs = require('fs');
const path = require('path');

// --- STATIC CFG  ---
const IGNORED_DIRS = new Set([ '_prompts', '.gradle', '.sourcemaps', '.tmp', 'node_modules', '.git', '.vscode', '.idea', '.angular', '.cache' ]);
const IGNORED_FILES = new Set([ 'package-lock.json', 'tsconfig.tsbuildinfo', '.editorconfig', 'LICENSE', '.gitignore' ]);
const LANG_MAP = {
  php: 'php',
  go: 'go',
  ts: 'typescript',
  js: 'javascript',
  json: 'json',
  html: 'html',
  scss: 'scss',
  css: 'css',
  xml: 'xml',
  md: 'markdown',
  env: 'properties',
  tsx: 'tsx',
  jsx: 'jsx',
  vue: 'vue',
  svelte: 'svelte',
  py: 'python',
  java: 'java',
  rs: 'rust',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash'
};
const ALLOWED_EXTENSIONS = new Set(Object.keys(LANG_MAP).map(ext => ('.' + ext)));

/**
 * Main exported function
 * @param {string} instructions - Custom instructions appended to prompt output.
 * @param {string} rootPath - Project root directory path.
 * @param {string|string[]} folderToInclude - List of subfolders to explicitly include (e.g. ['login', 'home']).
 * @param {string[]} restrictedFolders - Parent container folders that trigger filtering (e.g. ['restrictedFolder']).
 * @param {string[]} cfgFiles - Additional configuration files to include.
 */
function generateProjectPrompt(instructions = '', rootPath, folderToInclude = [], restrictedFolders = [], cfgFiles = []) {

    // 1. Initial Configuration (No global variables)
    const absolutePath = path.resolve(rootPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`The specified path does not exist: ${absolutePath}`);
    }

    // Convert to Sets for O(1) lookups and normalize inputs
    const whitelistSet = new Set(Array.isArray(folderToInclude) ? folderToInclude : [folderToInclude]);
    const restrictedSet = new Set(restrictedFolders);

    console.log(`Project: ${absolutePath}`);

    // 2. Header
    let prompt = `CONTEXT: Project structure.\n`

    // 3. Directory Tree
    prompt += `--- PROJECT STRUCTURE ---\n`;
    prompt += getDirectoryStructure(absolutePath);
    prompt += `\n\n`;

    // 4. Configuration
    prompt += `--- CONFIGURATION FILES ---\n`;
    const configFiles = ['package.json', 'tsconfig.json', 'ionic.config.json', 'angular.json', 'config.xml'].concat((Array.isArray(cfgFiles) && cfgFiles.length) ? cfgFiles : []);
    configFiles.forEach(file => {
        const filePath = path.join(absolutePath, file);
        if (fs.existsSync(filePath)) prompt += formatFileContent(filePath, absolutePath);
    });

    // 5. Root Folder Source Code
    prompt += `\n--- SOURCE CODE IN ROOT FOLDER ---\n`;
    const mainPath = path.join(absolutePath);

    if (fs.existsSync(mainPath)) {
        prompt += readDirRecursively(mainPath, absolutePath, restrictedSet, whitelistSet);
    } else {
        prompt += `[WARNING: Root folder not found]\n`;
    }


    prompt += `\n--- END OF CONTEXT ---\n\n`;
    if(instructions){ prompt += instructions + '\n'; }
    return prompt;
}

/**
 * Generates visual directory tree
 */
function getDirectoryStructure(dir, prefix = '') {
    let output = '';
    let items;
    try { items = fs.readdirSync(dir); } catch (e) { return ''; }

    items = items.filter(item => {
        const fullPath = path.join(dir, item);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) return !IGNORED_DIRS.has(item);
            return !IGNORED_FILES.has(item) && ALLOWED_EXTENSIONS.has(path.extname(item));
        } catch { return false; }
    });

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const marker = isLast ? '└── ' : '├── ';
        output += `${prefix}${marker}${item}\n`;

        // let _dir = path.basename(dir);
        const fullPath = path.join(dir, item);
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                output += getDirectoryStructure(fullPath, newPrefix);
            }
        } catch {}
    });
    return output;
}

/**
 * Unified and Intelligent Recursive Reader
 * @param {string} dir - Current directory
 * @param {string} rootPath - Project root (for relative paths)
 * @param {Set} restrictedSet - Restricted directories (e.g. restrictedFolder)
 * @param {Set} whitelistSet - Whitelisted directories (e.g. login)
 * @param {boolean} forceReadMode - If true, reads all files regardless of rules (inside whitelisted folder)
 */
function readDirRecursively(dir, rootPath, restrictedSet, whitelistSet, forceReadMode = false) {
    let content = '';
    let items;
    try { items = fs.readdirSync(dir); } catch (e) { return ''; }

    items.forEach(item => {
        if (IGNORED_DIRS.has(item) || IGNORED_FILES.has(item)) return;
        if (item.endsWith('.min.js') || item.endsWith('.min.css')) return;

        const fullPath = path.join(dir, item);
        let stat;
        try { stat = fs.statSync(fullPath); } catch { return; }

        if (stat.isDirectory()) {
            const relativePath = path.relative(rootPath, fullPath);

            // DECISION LOGIC:

            // CASE 1: "Forced Read" Mode (Already inside 'restrictedFolder/login')
            if (forceReadMode) {
                content += `\n================ FOLDER: ${relativePath} ================\n`;
                content += readDirRecursively(fullPath, rootPath, restrictedSet, whitelistSet, true);
                content += `\n================ END FOLDER: ${relativePath} ================\n`;
            }
            // CASE 2: Restricted folder matched (e.g. 'src/restrictedFolder')
            else if (restrictedSet.has(item)) {
                content += `\n================ SPECIAL FOLDER: ${relativePath} ================\n`;
                // Enter directory, but do NOT force read yet. Pass false.
                content += readDirRecursively(fullPath, rootPath, restrictedSet, whitelistSet, false);
                content += `\n================ END SPECIAL FOLDER: ${relativePath} ================\n`;
            }
            // CASE 3: INSIDE a restricted folder (e.g. iterating children of 'restrictedFolder')
            // Check if PARENT directory was restricted
            else if (restrictedSet.has(path.basename(dir))) {
                // Currently in 'src/restrictedFolder/X'. Is X whitelisted?
                if (whitelistSet.has(item)) {
                    content += `\n================ ALLOWED FOLDER: ${item}  ================\n`;
                    // Set forceReadMode = true for this whitelisted folder and descendants
                    content += readDirRecursively(fullPath, rootPath, restrictedSet, whitelistSet, true);
                    content += `\n================ END ALLOWED FOLDER: ${item}  ================\n`;
                } else {
                    content += `\n[CONTENT OMITTED from whitelisted folder: '${item}']\n`;
                }
            }
            // CASE 4: Standard folder outside restrictions (e.g. 'src/services')
            else {
                content += `\n================ FOLDER: ${relativePath} ================\n`;
                content += readDirRecursively(fullPath, rootPath, restrictedSet, whitelistSet, false);
                content += `\n================ END FOLDER: ${relativePath} ================\n`;
            }

        } else {
            // FILE LOGIC
            // Read files only if:
            // 1. In forced read mode (inside whitelisted folder)
            // 2. OR NOT an immediate child of a restricted folder.

            const parentDirName = path.basename(dir);
            const isDirectChildOfRestricted = restrictedSet.has(parentDirName);

            // If forceRead is true, read everything.
            // If not forceRead, read only if NOT a direct child of 'restrictedFolder' (to avoid reading loose files in restrictedFolder/)
            if (forceReadMode || !isDirectChildOfRestricted) {
                if (ALLOWED_EXTENSIONS.has(path.extname(item))) {
                    content += formatFileContent(fullPath, rootPath);
                }
            }
        }
    });

    return content;
}

/**
 * Markdown Formatting
 */
function formatFileContent(filePath, rootPath) {
    const relativePath = path.relative(rootPath, filePath);
    const extension = path.extname(filePath).replace('.', '').toLowerCase();

    let fileContent = '';
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');

        if (fileContent.length > 100000 || fileContent.split('\n').length > 3000) {
            return `\n[CONTENT OF "${relativePath}" OMITTED DUE TO EXCESSIVE SIZE (>100KB or >3000 lines)]\n`;
        }


    } catch (e) { return ''; }

    const lang = LANG_MAP[extension] || extension;

    return `\n================ FILE: ${relativePath} ================\n
\`\`\`${lang}
${fileContent}
\`\`\`
--------------------------------------------------
`;
}

module.exports = { generateProjectPrompt };
