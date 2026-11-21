# AshCrypt — Android এর জন্য Release APK বানানোর পুরো গাইড

এই ডকুমেন্টে দুটো জিনিসই আছে: **GitHub-এ কোড চেপে দেওয়া** এবং ওখান থেকে **সাইন করা Release APK (এবং Play Store-এর AAB)** বানানো।
কোনো জিনিস হাতে লিখতে হবে না — ব্রাউজার থেকেই হয়ে যাবে।

---

## ০। যা যা লাগবে

| জিনিস | কোথায় | নোট |
| --- | --- | --- |
| GitHub account | ব্রাউজার | তোমার আছেই |
| **Node.js 22+** | লোকালি + GitHub Actions | Capacitor 8 CLI এটা চায়, Node 20 দিয়ে `cap sync` চলবে না |
| `gh` CLI (ঐচ্ছিক) | টার্মিনাল | না থাকলেও হবে |
| JDK 17 | GitHub Actions-এ নিজে থেকেই আসে | লোকালি Android Studio দরকার |
| Android SDK | GitHub Actions-এ আছে | লোকালি Android Studio দরকার |
| একটা ছোট টার্মিনাল | তোমার মেশিন | শুধু `git push` এর জন্য |

লোকালি Java/Android SDK **লাগবে না** — পুরো APK GitHub-এর ফ্রি Linux runner-এ বানানো হচ্ছে।

---

## ১। GitHub-এ কোড আপলোড

প্রজেক্ট ফোল্ডারে (যেখানে `package.json` আছে) টার্মিনাল খুলে চালাও:

```bash
# git identity একবার সেট করো (email GitHub-এর noreply দাও)
git config user.name  "your-github-username"
git config user.email "your_email_id@users.noreply.github.com"

# আগের commit identity ঠিক করে দাও
git add -A
git commit --amend --reset-author --no-edit
```

এরপর GitHub-এ খালি repo বানাও (নাম দাও `ashcrypt`) এবং push করো:

```bash
git remote add origin https://github.com/your-github-username/ashcrypt.git
git branch -M main
git push -u origin main
```

`gh` CLI থাকলে এক লাইনেই হয়ে যায়:

```bash
gh repo create ashcrypt --public --source=. --push
```

> **নিরাপত্তা:** তোমার PAT/password কখনো চ্যাটে/কোডে বসাবে না। HTTPS push-এ ঘরের credentials ব্যবহার করো।

---

## ২। কোন ফাইল কোথায় আছে (কী কোথায় এডিট করতে হবে)

```
capacitor.config.ts ........ অ্যাপের appId, নাম, web dist এর পাথ
package.json ............... web ডিপেন্ডেন্সি
vite.config.ts ............. web build (হাত লাগাবে না)
src/App.tsx ................ UI ও state
src/lib/conversions.ts ..... ২৫টা টুলের কাজ
src/index.css .............. ডিজাইন/থিম

android/ ................... নেটিভ Android প্রজেক্ট (commit করা হয়েছে)
capacitor.config.ts ........ appId / appName / webDir
android/app/build.gradle .... versionCode, versionName, release signing
android/variables.gradle .... minSdk 23, compile/targetSdk 35
android/app/src/main/res/ .. আইকন, স্প্ল্যাশ, colors, strings
.github/workflows/android-release.yml ... অটো APK বিল্ড

android/keystore.properties.example ...... টেমপ্লেট (আছে)
android/keystore.properties ............... তোমার আসল key (gitignored)
*.keystore ................................ তোমার key file (gitignored)
```

**আন্ডারলাইন সতর্কতা:** `android/keystore.properties` আর `*.keystore` — এই দুটো কখনো commit হবে না, `.gitignore`-এ আছে।

---

## ৩। Release keystore বানাও (একবারই)

APK-কে অবশ্যই সাইন করতে হয়, না হলে Android ইনস্টল করবে না। JDK থাকলে:

```bash
keytool -genkey -v \
  -keystore ashcrypt-release.keystore \
  -alias ashcrypt \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass  YOUR_KEY_PASSWORD \
  -dname "CN=Akhil Rashed, OU=Dev, O=AshCrypt, L=Dhaka, ST=Dhaka, C=BD"
```

পাসওয়ার্ড কোথাও রেকর্ড করে রাখো — **হারালে আর আপডেটই দিতে পারবে না** (Google Play হালকা ক্ষেত্রে reset করতে পারে, GitHub-এ APK এর জন্য না)।

`keytool` না থাকলে Android Studio-তে **Build → Generate Signed App Bundle / APK → Create new** দিয়ে বানাও, ফাইলটা প্রজেক্ট রুটে রাখো।

Base64-এ রূপান্তর করো:

```bash
# Linux
base64 -w0 ashcrypt-release.keystore

# macOS
base64 -i ashcrypt-release.keystore | tr -d '\n'
```

আউটপুট কপি করো (এক লাইন, বিশাল)।

---

## ৪। GitHub-এ ৪টা Secret বসাও

GitHub-এ তোমার repo খোঁজো → **Settings → Secrets and variables → Actions → New repository secret**

| Secret নাম | কী বসাবে |
| --- | --- |
| `KEYSTORE_BASE64` | উপরের পুরো base64 স্ট্রিং |
| `KEYSTORE_PASSWORD` | স্টোর পাসওয়ার্ড |
| `KEY_ALIAS` | `ashcrypt` |
| `KEY_PASSWORD` | কী পাসওয়ার্ড (স্টোরের সাথে এক হলেও আলাদা দাও) |

এগুলো ছাড়া build চলবে, তবে APK **unsigned** হবে — workflow শেষে লাল error দেখাবে।

---

## ৫। Release APK বানাও (মূল ধাপ)

**সহজ পথ — tag push করলেই APK + AAB GitHub Release-এ চলে যাবে:**

```bash
# আগে ভার্সন মিলিয়ে নাও (ঐচ্ছিক, workflow না দিলে build.gradle-এ আছে)
git tag v1.0.0
git push origin v1.0.0
```

এরপর repo-র **Actions** ট্যাবে `Android Release` workflow চলবে (৮–১৫ মিনিট):

1. Node install → `npm ci`
2. `tsc` + converter unit test
3. `npm run build`
4. `npx cap sync android`
5. Java 17 + Gradle `assembleRelease` + `bundleRelease`
6. **Artifacts** এবং ট্যাগ হলে **Release** page-এ:
   - `AshCrypt-1.0.0.apk` — সরাসরি ফোনে ইনস্টলের জন্য
   - `AshCrypt-1.0.0.aab` — Google Play-এর জন্য

**Manual চালাতে চাইলে:** Actions ট্যাব → *Android Release* → *Run workflow* → version দাও (যেমন `1.0.1`)।

**Artifacts কোথায়:** Actions-এ সেই run → নিচের *Artifacts* → download (৩০ দিন থাকে)।
**Release কোথায়:** তোমার profile → *Releases* → সবচেয়ে উপরেরটা।

---

## ৬। বিকল্প: নিজের মেশিনে Android Studio দিয়ে

```bash
npm install
npm run build          # web dist/ বানাও (প্রতিবার UI বদলালে)
npx cap sync android   # dist/ কপি হবে android/.../assets/public-এ
```

তারপর Android Studio-তে `android/` ফোল্ডার Open করো →
**Build → Generate Signed App Bundle / APK → APK → Choose existing keystore** → `ashcrypt-release.keystore`
→ **Release** টিক দাও → **Finish**।
আউটপুট: `android/app/build/outputs/apk/release/app-release.apk`

`cap sync` না চালালে অ্যাপ সাদা স্ক্রিন/পুরনো UI দেখাবে — এটাই ৯০% ট্রাবল।

---

## ৭। ভার্সন, নাম, আইকন বদলানো

**ভার্সন:** tag থাকলে workflow নিজে থেকে `versionName` = ট্যাগ, `versionCode` = টাইমস্ট্যাম্প বসায়।
হাতে বদলাতে হলে `android/app/build.gradle`:

```gradle
versionCode 2
versionName "1.1.0"
```

**নাম/আইডি:** `capacitor.config.ts` + `android/app/build.gradle` (`applicationId`) + `android/app/src/main/res/values/strings.xml`
— তিনটাই একসাথে বদলাও। `applicationId` একবার Play Store-এ গেলে **বদলানো যায় না**।

**আইকন:** সব ডেনসিটি আগেই জেনারেট করা আছে
(`android/app/src/main/res/mipmap-*/ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`)।
নতুন আইকন চাইলে অন্যত্র দিয়ে replace করে `./gradlew clean` চালাও।

**স্প্ল্যাশ:** `android/app/src/main/res/drawable*/splash.png` (১১টা সাইজ, আগেই ব্র্যান্ডেড করা)।
কালার: `android/app/src/main/res/values/ic_launcher_background.xml` (`#9F7BC4`)।

---

## ৮। Play Store-এ দিতে চাইলে

- `.aab` ফাইলটাই দিতে হয় (raw APK নয়)।
- Google Play **App Signing** চালু করো — Play একটা নতুন key দেবে, তোমার keystore শুধু upload key হবে।
- Play Console-এ `applicationId` `com.akhilrashed.ashcrypt` হতে হবে।
- Privacy policy URL, Data safety form আর screenshots লাগবেই।
- `targetSdk 35` (Android 15) — Play-এর বর্তমান চাহিদার সাথে মিলে।

---

## ৯। সমস্যা হলে

| সমস্যা | সমাধান |
| --- | --- |
| APK unsigned error | ৪টা secret ঠিক আছে কিনা দেখো, তারপর re-run |
| `keystore.properties does not exist` | লোকালি `cp android/keystore.properties.example android/keystore.properties` করে ভরো |
| সাদা স্ক্রিন / পুরনো UI | `npm run build && npx cap sync android` |
| `Failed to find target with hash string 'android-35'` | SDK Manager থেকে Android 15 platform ইনস্টল |
| Gradle ভাঙল | `cd android && ./gradlew clean` |
| `npm ci` fail | `npm install` চালিয়ে package-lock.json commit করো |
| `The Capacitor CLI requires NodeJS >=22.0.0` | Node 22 LTS ইনস্টল করো (`node -v` দেখো), তারপর `npx cap sync android` |
| Build কিন্তু Release-এ যায়নি | শুধু `v*` ট্যাগে release বানানো হয় |
| WebView-এ clip/copy কাজ করছে না | `androidScheme: https` আছে কিনা দেখো; অ্যাপে Copy বাটন fallback দেয় |
| Back বাটন চাপলে অ্যাপ বন্ধ | `@capacitor/app` backButton listener কাজ করছে কিনা দেখো |

---

## ১০। প্রতিবার যা করতে হবে (শুধু শর্টকাট)

```bash
git add -A
git commit -m "update"
git push origin main
git tag v1.0.1 && git push origin v1.0.1     # → অটো APK + Release
```

ব্যস। এর বাইরে কিছু লাগবে না।

---

**তথ্য:** এই অ্যাপ পুরোটাই ক্লায়েন্ট-সাইড — কোনো সার্ভারে text যায় না। এটা **WebView wrapper**, PWA/হাইব্রিড নয়;
তাই offline-ও সব টুল কাজ করবে। কোডিং ও ডকুমেন্টেশন: **Akhil Rashed**।
