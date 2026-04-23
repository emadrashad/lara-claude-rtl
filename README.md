# Lara Claude RTL Patcher

**Lara Claude RTL Patcher** is a VS Code extension that patches installed **Claude Code for VS Code** webview assets to improve Arabic/RTL mixed-text rendering.

## Features

- Detects installed Claude extension targets.
- Patches `.css`, `.html`, and `.js` webview assets.
- Applies RTL/BiDi rendering fixes for mixed Arabic/English content.
- Fixes list marker rendering in RTL contexts.
- Decodes escaped Unicode BiDi control literals (for example `\\u2067`) at runtime.
- Creates per-file backups before patching: `<file>.lara-claude-rtl-patcher.bak`.
- Supports revert and patch status commands.

## Commands

- `Lara Claude RTL Patcher: Apply Patch`
- `Lara Claude RTL Patcher: Revert Patch`
- `Lara Claude RTL Patcher: Show Patch Status`

## Local development

```bash
npm install
npm run build
```

Run extension host with `F5` in VS Code, then trigger commands from Command Palette.

## Build VSIX

```bash
npm run package
```

Install locally:

```bash
code --install-extension lara-claude-rtl-patcher-1.0.0.vsix --force
```

## Publish to Visual Studio Marketplace (Official)

1. Create a publisher in Azure DevOps / VS Marketplace (for example `lara`).
2. Generate a Personal Access Token (PAT) with Marketplace manage scope.
3. Login once:

```bash
npx @vscode/vsce login <publisher-id>
```

4. Publish:

```bash
npm run publish:marketplace
```

## Notes

- This extension patches Claude extension assets locally; Claude updates can overwrite patches.
- Re-run `Apply Patch` after Claude extension updates.
