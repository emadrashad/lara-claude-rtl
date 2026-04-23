# Changelog

## 0.0.11

- Stopped applying direction heuristics to broad root containers to avoid whole-response right-shift in deep analysis views.
- Restored non-user mixed Arabic/English blocks to `dir="auto"` (with no forced `direction: rtl`) for more natural BiDi flow.

## 0.0.10

- Fixed RTL unordered/ordered list rendering in Claude responses (`ul/ol/li::marker`) for mixed Arabic/English blocks.
- Added fallback list rules for both `dir="rtl"` and `dir="auto"`.
- Switched non-user Arabic response containers from `dir="auto"` to explicit `dir="rtl"` so list marker alignment is consistent.

## 0.0.6

- Kept input/composer behavior unchanged.
- Added isolated LTR-run wrapping only for rendered non-input RTL text nodes to fix user-message punctuation/order.

## 0.0.5

- Rolled back aggressive text rewriting and isolate insertion.
- New safe runtime: only sets direction on input fields and visible text blocks by first strong character.
- Keeps textarea/contenteditable behavior stable with `unicode-bidi: plaintext`.

## 0.0.4

- Added LTR-run isolation inside RTL lines using Unicode isolates to fix punctuation/ordering (`.on time` style issues).
- Stopped applying direction heuristics to broad `root_*` containers to avoid layout side effects.
- Kept composer direction updates live while typing.

## 0.0.3

- Added first-strong-character direction inference (`rtl`/`ltr`) for mixed Arabic/English lines.
- Applied direction logic to composer input/contenteditable fields while typing.
- Kept escaped BiDi control decoding and mutation observer updates.

## 0.0.2

- Added runtime JS patch injection for Claude `webview/index.js` builds without HTML files.
- Expanded RTL selectors to include obfuscated renderer classes used by Claude webview bundles.

## 0.0.1

- Initial release.
- Added apply/revert/status commands.
- Added CSS/HTML patch and backup flow for Claude extension assets.
