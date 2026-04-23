import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Dirent } from 'node:fs';
import * as vscode from 'vscode';

const PATCH_STATE_KEY = 'claudeRtlFix.patchedFiles.v1';

const CSS_PATCH_START = '/* __CLAUDE_RTL_FIX_START__ */';
const CSS_PATCH_END = '/* __CLAUDE_RTL_FIX_END__ */';
const HTML_PATCH_START = '<!-- __CLAUDE_RTL_FIX_HTML_START__ -->';
const HTML_PATCH_END = '<!-- __CLAUDE_RTL_FIX_HTML_END__ -->';
const JS_PATCH_START = '/* __CLAUDE_RTL_FIX_JS_START__ */';
const JS_PATCH_END = '/* __CLAUDE_RTL_FIX_JS_END__ */';

const CSS_PATCH_BLOCK = `${CSS_PATCH_START}
:where(
  .markdown-body,
  .prose,
  .message,
  .message-content,
  .chat-message,
  [class*="root_"],
  [class*="toolBodyRowContent_"],
  .userMessage_07S1Yg,
  .message_07S1Yg.userMessageContainer_07S1Yg
) {
  text-align: start !important;
}

:where(
  .markdown-body,
  .prose,
  .message,
  .message-content,
  .chat-message,
  [class*="root_"],
  [class*="toolBodyRowContent_"],
  .userMessage_07S1Yg
) :where(p, li, div, span, td, th, blockquote) {
  unicode-bidi: plaintext !important;
}

:where(pre, code, kbd, samp) {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: isolate !important;
}
${CSS_PATCH_END}`;

const HTML_PATCH_BLOCK = `${HTML_PATCH_START}
<style id="claude-rtl-fix-style">
  :where(.markdown-body, .prose, .message, .message-content, .chat-message) {
    text-align: start !important;
  }

  :where(.markdown-body, .prose, .message, .message-content, .chat-message) * {
    unicode-bidi: plaintext !important;
  }

  :where(pre, code, kbd, samp) {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: isolate !important;
  }
</style>
<script id="claude-rtl-fix-script">
(() => {
  const ESCAPE_RE = /\\\\u206[6-9]|\\\\u200[e-f]/g;
  const ARABIC_RE = /[\\u0590-\\u08FF]/;
  const USER_MESSAGE_SELECTOR = '.userMessage_07S1Yg';
  const TARGET_DIR_SELECTOR = '.root_-a7MRw, .content_mLrg7g, .secondaryLine_mLrg7g, .toolBodyRowContent_ZUQaOA, .userMessage_07S1Yg';

  const map = {
    "\\\\u2066": "\\u2066",
    "\\\\u2067": "\\u2067",
    "\\\\u2068": "\\u2068",
    "\\\\u2069": "\\u2069",
    "\\\\u200e": "\\u200e",
    "\\\\u200f": "\\u200f"
  };

  const decodeEscapedBidi = (input) => input.replace(ESCAPE_RE, (token) => map[token] ?? token);

  const processTextNode = (node) => {
    const value = node.nodeValue ?? '';
    if (!value.includes('\\\\u20')) {
      return;
    }

    const decoded = decodeEscapedBidi(value);
    if (decoded !== value) {
      node.nodeValue = decoded;
    }
  };

  const processElement = (element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    if (element.closest('pre, code')) {
      return;
    }

    if (!element.matches(TARGET_DIR_SELECTOR)) {
      return;
    }

    const text = (element.textContent ?? '').trim();
    if (!text) {
      return;
    }

    if (element.matches(USER_MESSAGE_SELECTOR)) {
      const dir = ARABIC_RE.test(text) ? 'rtl' : 'ltr';
      element.setAttribute('dir', dir);
      element.style.direction = dir;
      element.style.textAlign = 'start';
      element.style.unicodeBidi = 'plaintext';
      return;
    }

    if (ARABIC_RE.test(text)) {
      element.setAttribute('dir', 'auto');
      element.style.direction = 'rtl';
      element.style.textAlign = 'start';
      element.style.unicodeBidi = 'plaintext';
    }
  };

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    processElement(node);
    for (const child of node.childNodes) {
      walk(child);
    }
  };

  const run = () => {
    if (document.body) {
      walk(document.body);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' && mutation.target) {
        walk(mutation.target);
      }

      for (const addedNode of mutation.addedNodes) {
        walk(addedNode);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
</script>
${HTML_PATCH_END}`;

const CSS_BLOCK_RE = /\/\* __CLAUDE_RTL_FIX_START__ \*\/[\s\S]*?\/\* __CLAUDE_RTL_FIX_END__ \*\//g;
const HTML_BLOCK_RE = /<!-- __CLAUDE_RTL_FIX_HTML_START__ -->[\s\S]*?<!-- __CLAUDE_RTL_FIX_HTML_END__ -->/g;
const JS_BLOCK_RE = /\/\* __CLAUDE_RTL_FIX_JS_START__ \*\/[\s\S]*?\/\* __CLAUDE_RTL_FIX_JS_END__ \*\//g;

const JS_PATCH_BLOCK = `
${JS_PATCH_START}
(() => {
  try {
    const STYLE_ID = 'claude-rtl-fix-style-runtime';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = \`
        :where(.markdown-body, .prose, .message, .message-content, .chat-message, [class*="root_"], [class*="toolBodyRowContent_"], .userMessage_07S1Yg, .message_07S1Yg.userMessageContainer_07S1Yg) {
          text-align: start !important;
        }
        :where(.markdown-body, .prose, .message, .message-content, .chat-message, [class*="root_"], [class*="toolBodyRowContent_"], .userMessage_07S1Yg) :where(p, li, div, span, td, th, blockquote) {
          unicode-bidi: plaintext !important;
        }
        :where(pre, code, kbd, samp) {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: isolate !important;
        }
      \`;
      document.head.appendChild(style);
    }

    const ESCAPE_RE = /\\\\u206[6-9]|\\\\u200[e-f]/g;
    const ARABIC_RE = /[\\u0590-\\u08FF]/;
    const USER_MESSAGE_SELECTOR = '.userMessage_07S1Yg';
    const TARGET_DIR_SELECTOR = '.root_-a7MRw, .content_mLrg7g, .secondaryLine_mLrg7g, .toolBodyRowContent_ZUQaOA, .userMessage_07S1Yg';
    const map = {
      '\\\\u2066': '\\u2066',
      '\\\\u2067': '\\u2067',
      '\\\\u2068': '\\u2068',
      '\\\\u2069': '\\u2069',
      '\\\\u200e': '\\u200e',
      '\\\\u200f': '\\u200f'
    };

    const decodeEscapedBidi = (input) => input.replace(ESCAPE_RE, (token) => map[token] ?? token);

    const processTextNode = (node) => {
      const value = node.nodeValue ?? '';
      if (!value.includes('\\\\u20')) {
        return;
      }
      const decoded = decodeEscapedBidi(value);
      if (decoded !== value) {
        node.nodeValue = decoded;
      }
    };

    const processElement = (element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }
      if (element.closest('pre, code')) {
        return;
      }

      if (!element.matches(TARGET_DIR_SELECTOR)) {
        return;
      }

      const text = (element.textContent ?? '').trim();
      if (!text) {
        return;
      }

      if (element.matches(USER_MESSAGE_SELECTOR)) {
        const dir = ARABIC_RE.test(text) ? 'rtl' : 'ltr';
        element.setAttribute('dir', dir);
        element.style.direction = dir;
        element.style.textAlign = 'start';
        element.style.unicodeBidi = 'plaintext';
        return;
      }

      if (ARABIC_RE.test(text)) {
        element.setAttribute('dir', 'auto');
        element.style.direction = 'rtl';
        element.style.textAlign = 'start';
        element.style.unicodeBidi = 'plaintext';
      }
    };

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      processElement(node);
      for (const child of node.childNodes) {
        walk(child);
      }
    };

    const run = () => {
      if (document.body) {
        walk(document.body);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target) {
          walk(mutation.target);
        }
        for (const addedNode of mutation.addedNodes) {
          walk(addedNode);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch {
    // no-op
  }
})();
${JS_PATCH_END}
`;

interface PatchEntry {
  extensionId: string;
  filePath: string;
  backupPath: string;
}

interface TargetExtension {
  id: string;
  extensionPath: string;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeRtlFix.apply', async () => {
      await applyPatch(context);
    }),
    vscode.commands.registerCommand('claudeRtlFix.revert', async () => {
      await revertPatch(context);
    }),
    vscode.commands.registerCommand('claudeRtlFix.status', async () => {
      await showStatus(context);
    })
  );
}

export function deactivate(): void {
  // no-op
}

async function applyPatch(context: vscode.ExtensionContext): Promise<void> {
  const target = await pickTargetExtension();
  if (!target) {
    void vscode.window.showWarningMessage('Claude extension not found. Install/enable Claude Code for VS Code first.');
    return;
  }

  const files = await collectPatchableFiles(target.extensionPath);
  if (files.length === 0) {
    void vscode.window.showWarningMessage(`No patchable .css/.html files found under ${target.extensionPath}.`);
    return;
  }

  const patched: PatchEntry[] = [];

  for (const filePath of files) {
    const original = await tryReadUtf8(filePath);
    if (original === undefined) {
      continue;
    }

    const updated = applyPatchToFile(filePath, original);
    if (updated === original) {
      continue;
    }

    const backupPath = `${filePath}.claude-rtl-fix.bak`;
    if (!(await exists(backupPath))) {
      await fs.writeFile(backupPath, original, 'utf8');
    }

    await fs.writeFile(filePath, updated, 'utf8');
    patched.push({ extensionId: target.id, filePath, backupPath });
  }

  if (patched.length === 0) {
    void vscode.window.showInformationMessage('No new changes were needed (already patched or no matching insertion points).');
    return;
  }

  const existing = context.globalState.get<PatchEntry[]>(PATCH_STATE_KEY, []);
  const merged = mergePatchEntries(existing, patched);
  await context.globalState.update(PATCH_STATE_KEY, merged);

  const action = await vscode.window.showInformationMessage(
    `Claude RTL Fix applied to ${patched.length} file(s) in ${target.id}.`,
    'Reload Window'
  );

  if (action === 'Reload Window') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function revertPatch(context: vscode.ExtensionContext): Promise<void> {
  const entries = context.globalState.get<PatchEntry[]>(PATCH_STATE_KEY, []);
  if (entries.length === 0) {
    void vscode.window.showInformationMessage('No tracked Claude RTL patches found.');
    return;
  }

  let revertedCount = 0;
  const remaining: PatchEntry[] = [];

  for (const entry of entries) {
    if (await exists(entry.backupPath)) {
      await fs.copyFile(entry.backupPath, entry.filePath);
      await fs.unlink(entry.backupPath);
      revertedCount += 1;
      continue;
    }

    if (!(await exists(entry.filePath))) {
      continue;
    }

    const content = await tryReadUtf8(entry.filePath);
    if (content === undefined) {
      remaining.push(entry);
      continue;
    }

    const stripped = stripPatch(content);
    if (stripped !== content) {
      await fs.writeFile(entry.filePath, stripped, 'utf8');
      revertedCount += 1;
    } else {
      remaining.push(entry);
    }
  }

  await context.globalState.update(PATCH_STATE_KEY, remaining);

  if (revertedCount === 0) {
    void vscode.window.showInformationMessage('No patched files were reverted.');
    return;
  }

  const action = await vscode.window.showInformationMessage(
    `Reverted Claude RTL patch in ${revertedCount} file(s).`,
    'Reload Window'
  );

  if (action === 'Reload Window') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function showStatus(context: vscode.ExtensionContext): Promise<void> {
  const entries = context.globalState.get<PatchEntry[]>(PATCH_STATE_KEY, []);

  if (entries.length === 0) {
    void vscode.window.showInformationMessage('Claude RTL Fix status: no tracked patch files.');
    return;
  }

  let existingPatches = 0;
  for (const entry of entries) {
    if (!(await exists(entry.filePath))) {
      continue;
    }

    const content = await tryReadUtf8(entry.filePath);
    if (!content) {
      continue;
    }

    if (content.includes(CSS_PATCH_START) || content.includes(HTML_PATCH_START)) {
      existingPatches += 1;
    }
  }

  void vscode.window.showInformationMessage(
    `Claude RTL Fix status: ${existingPatches}/${entries.length} tracked file(s) currently patched.`
  );
}

async function pickTargetExtension(): Promise<TargetExtension | undefined> {
  const candidates = vscode.extensions.all
    .filter((extension) => {
      const id = extension.id.toLowerCase();
      return (
        (id.includes('anthropic') && id.includes('claude')) ||
        id.includes('claude-code') ||
        id.includes('claude.code')
      );
    })
    .map<TargetExtension>((extension) => ({
      id: extension.id,
      extensionPath: extension.extensionPath
    }));

  if (candidates.length === 0) {
    return undefined;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const picked = await vscode.window.showQuickPick(
    candidates.map((candidate) => ({
      label: candidate.id,
      description: candidate.extensionPath,
      candidate
    })),
    { title: 'Select Claude extension target for RTL patch' }
  );

  return picked?.candidate;
}

async function collectPatchableFiles(root: string): Promise<string[]> {
  const stack: string[] = [root];
  const output: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true, encoding: 'utf8' });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const lowerName = entry.name.toLowerCase();
      if (lowerName.endsWith('.css') || lowerName.endsWith('.html') || lowerName.endsWith('.htm') || lowerName.endsWith('.js')) {
        output.push(fullPath);
      }
    }
  }

  return output;
}

function applyPatchToFile(filePath: string, content: string): string {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.endsWith('.css')) {
    if (content.includes(CSS_PATCH_START)) {
      return content;
    }

    return `${content.trimEnd()}\n\n${CSS_PATCH_BLOCK}\n`;
  }

  if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) {
    if (content.includes(HTML_PATCH_START)) {
      return content;
    }

    if (/<\/head>/i.test(content)) {
      return content.replace(/<\/head>/i, `${HTML_PATCH_BLOCK}\n</head>`);
    }

    if (/<\/body>/i.test(content)) {
      return content.replace(/<\/body>/i, `${HTML_PATCH_BLOCK}\n</body>`);
    }
  }

  if (lowerPath.endsWith('.js')) {
    if (content.includes(JS_PATCH_START)) {
      return content;
    }

    return `${content.trimEnd()}\n${JS_PATCH_BLOCK}\n`;
  }

  return content;
}

function stripPatch(content: string): string {
  const stripped = content
    .replace(CSS_BLOCK_RE, '')
    .replace(HTML_BLOCK_RE, '')
    .replace(JS_BLOCK_RE, '')
    .trimEnd();
  return stripped.length > 0 ? `${stripped}\n` : '';
}

function mergePatchEntries(existing: PatchEntry[], incoming: PatchEntry[]): PatchEntry[] {
  const merged = new Map<string, PatchEntry>();

  for (const entry of existing) {
    merged.set(entry.filePath, entry);
  }

  for (const entry of incoming) {
    merged.set(entry.filePath, entry);
  }

  return Array.from(merged.values());
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function tryReadUtf8(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}
