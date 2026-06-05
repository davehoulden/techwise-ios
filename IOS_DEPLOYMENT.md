# TechWise → iOS (TestFlight) deployment guide

This app is a Base44 (Vite + React) web app wrapped as a native iOS app with
**Capacitor**, built and signed in the cloud by **Codemagic** (no Mac needed),
and installed on your iPhone via **TestFlight**.

## What's already set up (done locally)

- ✅ Capacitor installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`)
- ✅ `capacitor.config.json` — appId `com.techwise.divelog`, app name `TechWise`,
  `CapacitorHttp` enabled (so the Base44 SDK's network calls bypass webview CORS)
- ✅ Native iOS project scaffolded in `ios/`
- ✅ `codemagic.yaml` — cloud build → sign → TestFlight pipeline
- ✅ Git repo initialized + first commit

## Your remaining steps

### 1. Push to GitHub
Create a new **empty** repo at https://github.com/new (e.g. `techwise-ios`), then:
```powershell
cd "C:\Users\daveh\OneDrive\Desktop\techwise-app-main\techwise-app-main"
git branch -M main
git remote add origin https://github.com/<you>/techwise-ios.git
git push -u origin main
```
> Note: this is a separate repo from any Base44↔GitHub sync, so the mobile
> wrapper won't clutter your Base44 Builder.

### 2. Create an App Store Connect API key
At https://appstoreconnect.apple.com/access/integrations/api → **Generate API Key**
with **App Manager** role. Download the `.p8` file and note the **Key ID** and
**Issuer ID** (you can't re-download the `.p8`).

### 3. Set up Codemagic
1. Sign up at https://codemagic.io with your GitHub account (free tier includes
   cloud-Mac minutes — enough for personal builds).
2. Add your `techwise-ios` repo.
3. **Team → Integrations → App Store Connect → Connect**: upload the `.p8`,
   Key ID, and Issuer ID. **Name the integration exactly:**
   `techwise_app_store_connect` (this name is referenced in `codemagic.yaml`).
4. Start a build of the `ios-testflight` workflow.

Codemagic auto-creates the bundle ID (`com.techwise.divelog`) and a managed
distribution profile, builds the `.ipa`, and uploads it to TestFlight.

### 4. First TestFlight processing
After the first successful upload, in App Store Connect the build appears under
**TestFlight** (processing takes ~5–15 min). Add yourself as an **Internal
Tester**. No App Review is required for internal testing.

### 5. Install on your iPhone
Install the **TestFlight** app from the App Store, sign in with your Apple ID,
and your TechWise build will be there to install.

## Updating the app later
Make changes → commit → push. Codemagic rebuilds and ships a new TestFlight
build automatically. Build numbers auto-increment via `$BUILD_NUMBER`.

---

## ⚠️ Known risk to verify on first run: Base44 login

Your app is currently **private / unpublished** (`VITE_BASE44_APP_BASE_URL=https://app.base44.com`).
Inside the native webview the app loads from `capacitor://localhost` but calls
the Base44 backend cross-origin. `CapacitorHttp` handles CORS, but the **login /
OAuth redirect** flow may not complete cleanly in a webview.

**If login fails on the device, the robust fix is to point the native shell at a
published Base44 URL instead of bundling the build:**

1. In Base44, **Publish** the app to get a public URL like
   `https://techwise-xxxxxxxx.base44.app`.
2. Add a `server` block to `capacitor.config.json`:
   ```json
   "server": { "url": "https://techwise-xxxxxxxx.base44.app", "cleartext": false }
   ```
3. Commit + push. Now the native app simply displays the live hosted app, so
   auth/CORS behave exactly as in mobile Safari.

Trade-off: the `server.url` approach requires a network connection (it's not a
fully offline bundle), but for a hosted Base44 app that's expected anyway.

## Optional polish before shipping
- **App icon:** replace the default Capacitor icon. Drop a 1024×1024 PNG at
  `resources/icon.png`, run `npx @capacitor/assets generate --ios`, commit.
- **Splash screen:** same tool generates splash assets.
