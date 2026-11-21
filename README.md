# AshCrypt

A thoughtful, entirely client-side text toolkit built with React, TypeScript, Vite, and a liquid-glass interface. The application starts in `src/App.tsx`.

## Run

Requires Node.js 22 or newer (Capacitor 8 CLI).

```sh
npm install
npm run dev
```

Build with `npm run build`, then serve the build with `npm run preview`. Deploy the complete `dist` directory, including its image and favicon assets.

## Android Release APK

The repository also contains a complete native Android wrapper:

- `capacitor.config.ts` - app id, app name, web asset directory, HTTPS WebView scheme
- `android/` - Gradle project, branded launcher icons, splash screens, release signing hook
- `.github/workflows/android-release.yml` - builds a signed `.apk` and `.aab` on every `v*` tag
- `docs/ANDROID_RELEASE.md` - the full step-by-step guide, in Bangla

Quick path:

```sh
git push origin main
git tag v1.0.0 && git push origin v1.0.0
```

The `Android Release` workflow builds, tests, signs, and attaches `AshCrypt-1.0.0.apk` plus `AshCrypt-1.0.0.aab` to the GitHub Release. Add these four repository secrets first: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`. Generating the keystore and every Android-specific edit is documented in `docs/ANDROID_RELEASE.md`.

## The Toolkit

- 25 real tools: Base64, URL encoding, binary, UTF-8 hex, HTML entities, ASCII, UTF-8 bytes, UTF-16 LE/BE, Unicode decimal, ROT13, MD5, SHA-1, SHA-256, SHA-512, JSON/XML formatters, minifiers and validators, deep URL decoding, Base32, Bitcoin Base58, and URL-safe Base64.
- Smart encoding detection in Decode mode, automatic JSON/XML selection in formatter mode, and input-script recognition. Manual selection takes priority for the current input.
- Unicode-safe encoding, strict malformed-input handling, reversible editor swapping, examples, and optional debounced live conversion.
- Local text-file import, clipboard actions, output downloads, and expanded editors.
- Searchable command palette, pinned tools, keyboard shortcuts, light/dark/system appearance, and responsive mobile navigation.
- Optional 20-entry tab-session history with restoration, individual deletion, and clearing. Preferences and pinned tool IDs are stored in local storage. Content is never sent to a conversion server.
- Locally served fonts and artwork, reduced-motion support, labeled controls, dialog focus management, and friendly error states.

## Important Details

Automatic format detection is a best-effort guess. Base58, ROT13, and hashes cannot be identified reliably from their characters alone. Script recognition is not natural-language translation.

Encoding is not encryption. Hashes cannot be decoded. MD5 and SHA-1 are included for legacy checksums, not for new security designs. None of these simple text hashes is a password-storage scheme.

Input is limited to 1 million characters. File import supports UTF-8, plus UTF-16 files with a byte-order mark, up to 1 MB. Base58 is limited to 2 KB of source text because its radix conversion is quadratic. Results with more than 100,000 combined input/output characters are not added to history.

XML tools preserve mixed text, CDATA, namespaces, and `xml:space`. Custom entity declarations are rejected for safety. HTML entity decoding never renders or executes the decoded HTML.

Clipboard permissions depend on the browser and normally require HTTPS or localhost. Permission failures have actionable fallback instructions. Session history usually ends with the tab, although a browser's session-restore feature can restore session storage.

## Verify

```sh
npx tsc --noEmit
npx tsx --test tests/conversions.test.ts
npx playwright install --with-deps chromium
npx playwright test
npm run build
```

The browser suite starts the development server automatically if one is not already running. Unit tests cover Unicode round trips, standard hash vectors, real Base58 vectors, strict validation, and detection. Browser tests cover editor actions, XML preservation, auto-selection, live mode, history, file import/export, clipboard, themes, keyboard access, and responsive layouts.

## Source

- `src/App.tsx`: workspace state and application flows.
- `src/components/WorkspaceUI.tsx`: reusable glass controls, dialogs, and format picker.
- `src/lib/conversions.ts`: conversion engine, tool registry, examples, and detection.
- `src/index.css`: the glass material system, typography, themes, and responsive styling.

AshCrypt, precision tools by Akhil Rashed.
