<div align="center">

# 🔐 AshCrypt

### Precision text tools. Beautifully simple. 100% private.

**25 encoders, decoders, hashers and formatters in one liquid-glass workspace.**
Everything runs in your browser. Your text never leaves your device.

<br />

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

![Privacy](https://img.shields.io/badge/Privacy-100%25%20client--side-success?style=flat-square)
![Tools](https://img.shields.io/badge/Tools-25-blueviolet?style=flat-square)
![Platforms](https://img.shields.io/badge/Platforms-Web%20%7C%20Android-informational?style=flat-square)
![Node](https://img.shields.io/badge/Node-%E2%89%A5%2022-339933?style=flat-square&logo=nodedotjs&logoColor=white)

</div>

---

## ✨ Why AshCrypt?

Most online converters upload your text to a server. AshCrypt does the opposite: every conversion happens locally, in your own browser, with no backend involved.

| | |
|---|---|
| 🛡️ **Private by design** | No conversion server. Your content is never sent anywhere. |
| ⚡ **Smart detection** | Paste something unknown and AshCrypt guesses the encoding for you. |
| 🪟 **Liquid-glass UI** | Frosted surfaces, smooth motion, light, dark and system themes. |
| 📱 **Mobile ready** | Responsive layout, plus a native Android app built with Capacitor. |
| ⌨️ **Keyboard first** | Command palette, pinned tools and shortcuts for everything. |
| ♿ **Accessible** | Labeled controls, dialog focus management and reduced-motion support. |

---

## 🧰 The Toolkit

<table>
<tr>
<td width="33%" valign="top">

**🔤 Encoders and decoders**

- Base64
- Base64 (URL-safe)
- Base32
- Base58 (Bitcoin)
- URL encoding
- Deep URL decoding
- Binary
- UTF-8 hex
- UTF-8 bytes
- UTF-16 LE / BE
- Unicode decimal
- ASCII
- HTML entities
- ROT13

</td>
<td width="33%" valign="top">

**#️⃣ Hashes**

- MD5
- SHA-1
- SHA-256
- SHA-512

<br />

**🧹 Formatters**

- JSON format
- JSON minify
- JSON validate
- XML format
- XML minify
- XML validate

</td>
<td width="33%" valign="top">

**🚀 Workflow features**

- Auto-detect in Decode mode
- Auto JSON / XML selection
- Input-script recognition
- Reversible editor swap
- Built-in examples
- Optional live conversion
- File import and download
- Clipboard actions
- Expanded editors

</td>
</tr>
</table>

### 🎛️ Built for flow

- **Command palette** to search and jump to any tool instantly
- **Pinned tools** so your favorites are always one tap away
- **Session history** with the last 20 entries, restore, delete one or clear all
- **Light, dark and system** appearance
- **Unicode-safe** encoding with strict handling of malformed input

---

## 🚀 Quick Start

> Requires **Node.js 22 or newer** (needed by the Capacitor 8 CLI).

```sh
# 1. Clone
git clone https://github.com/akhil-rashed/ash-crypt.git
cd ash-crypt

# 2. Install
npm install

# 3. Run
npm run dev
```

**Production build**

```sh
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

Deploy the complete `dist` directory, including its image and favicon assets.

---

## 📱 Android App

AshCrypt ships with a complete native Android wrapper powered by [Capacitor](https://capacitorjs.com).

| Path | Purpose |
|---|---|
| `capacitor.config.ts` | App id, app name, web asset directory, HTTPS WebView scheme |
| `android/` | Gradle project, branded launcher icons, splash screens, release signing hook |
| `.github/workflows/android-release.yml` | Builds a signed `.apk` and `.aab` on every `v*` tag |
| `docs/ANDROID_RELEASE.md` | Full step-by-step guide (in Bangla) |

**Release in two commands**

```sh
git push origin main
git tag v1.0.0 && git push origin v1.0.0
```

The **Android Release** workflow builds, tests and signs the app, then attaches `AshCrypt-1.0.0.apk` and `AshCrypt-1.0.0.aab` to the GitHub Release.

<details>
<summary><b>🔑 Required repository secrets</b></summary>

<br />

Add these four secrets before tagging your first release:

| Secret | Description |
|---|---|
| `KEYSTORE_BASE64` | Your keystore file, base64-encoded |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias inside the keystore |
| `KEY_PASSWORD` | Password for the key |

Generating the keystore and every Android-specific edit is documented in `docs/ANDROID_RELEASE.md`.

</details>

---

## ⚠️ Good to Know

<details>
<summary><b>🔍 Detection is a best guess</b></summary>

<br />

Base58, ROT13 and hashes can't be identified reliably from their characters alone. Script recognition detects writing systems, it is not natural-language translation. Manual selection always takes priority for the current input.

</details>

<details>
<summary><b>🔒 Encoding is not encryption</b></summary>

<br />

Encoding is reversible by anyone. Hashes cannot be decoded. MD5 and SHA-1 are included for legacy checksums only, not for new security designs. None of these simple text hashes is a password-storage scheme.

</details>

<details>
<summary><b>📏 Limits</b></summary>

<br />

- Input is limited to **1 million characters**
- File import supports **UTF-8**, plus **UTF-16 with a byte-order mark**, up to **1 MB**
- Base58 is limited to **2 KB** of source text, because its radix conversion is quadratic
- Results over **100,000** combined input and output characters are not added to history

</details>

<details>
<summary><b>🧼 Safe XML and HTML handling</b></summary>

<br />

XML tools preserve mixed text, CDATA, namespaces and `xml:space`. Custom entity declarations are rejected for safety. HTML entity decoding never renders or executes the decoded HTML.

</details>

<details>
<summary><b>📋 Clipboard and history</b></summary>

<br />

Clipboard permissions depend on the browser and normally require HTTPS or localhost. If permission fails, AshCrypt shows clear fallback instructions. Session history usually ends with the tab, although a browser's session-restore feature can bring it back. Preferences and pinned tool IDs are kept in local storage.

</details>

---

## 🧪 Testing

```sh
npx tsc --noEmit                          # type check
npx tsx --test tests/conversions.test.ts  # unit tests
npx playwright install --with-deps chromium
npx playwright test                       # browser tests
npm run build                             # production build
```

- **Unit tests** cover Unicode round trips, standard hash vectors, real Base58 vectors, strict validation and detection.
- **Browser tests** cover editor actions, XML preservation, auto-selection, live mode, history, file import and export, clipboard, themes, keyboard access and responsive layouts.

The browser suite starts the dev server automatically if one isn't already running.

---

## 🗂️ Project Structure

```text
ash-crypt/
├── src/
│   ├── App.tsx                     # workspace state and app flows
│   ├── index.css                   # glass material system, themes, responsive styles
│   ├── components/
│   │   └── WorkspaceUI.tsx         # glass controls, dialogs, format picker
│   └── lib/
│       └── conversions.ts          # conversion engine, tool registry, detection
├── tests/                          # unit and browser tests
├── android/                        # native Android project
├── docs/
│   └── ANDROID_RELEASE.md          # Android release guide
├── .github/workflows/
│   └── android-release.yml         # automated APK and AAB releases
└── capacitor.config.ts
```

---

<div align="center">

**AshCrypt** · Precision tools by [Akhil Rashed](https://github.com/akhil-rashed)

If you find it useful, a ⭐ on the repo means a lot.

</div>
