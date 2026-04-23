# Claude RTL Fix (VS Code Extension)

Local helper extension that patches installed **Claude Code for VS Code** webview assets to improve Arabic/RTL mixed-text rendering.

## What it does

- Finds installed Claude extension(s) by id.
- Patches `.css`, `.html`, and `.js` files in that extension folder.
- Adds BiDi/RTL rendering rules (`unicode-bidi: plaintext`, `text-align: start`).
- Adds a small DOM post-processor for escaped BiDi control literals (for example `\\u2067`).
- Creates backup files per patched file: `<file>.claude-rtl-fix.bak`.
- Supports one-click revert.

## Commands

- `Claude RTL Fix: Apply Patch`
- `Claude RTL Fix: Revert Patch`
- `Claude RTL Fix: Show Patch Status`

## Local run

1. Open `/Users/macbook/Sites/claude-rtl-fix` in VS Code.
2. Run:

```bash
npm install
npm run build
```

3. Press `F5` to launch Extension Development Host.
4. In the new VS Code window, run command palette and execute `Claude RTL Fix: Apply Patch`.
5. Reload window when prompted.

## Package as VSIX

```bash
npm run package
```

Then install generated `.vsix` manually.

## Notes

- This is a local patcher workaround, not an official Anthropic fix.
- Claude extension updates may overwrite patched files; run `Apply Patch` again after updates.
