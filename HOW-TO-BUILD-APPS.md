# SAION AI — How to Build Downloadable Apps
## Windows .EXE | Linux .AppImage | Android .APK

---

## ✅ STEP 1 — First make sure the web app works

In VS Code terminal:
```
npm install
npm run dev
```
Open http://localhost:3000 — login should work.

---

## 💻 STEP 2 — Build Windows .EXE Installer

Run this in VS Code terminal:
```
npm run electron:build:win
```

Wait 3-5 minutes. When done, find your file at:
```
saion-ai/
└── release/
    └── SAION-AI-Setup-v1.0.0.exe   ← this is your Windows installer
```

Send this .exe to anyone on Windows — they double-click and install!

---

## 🐧 STEP 3 — Build Linux .AppImage

Run this in VS Code terminal:
```
npm run electron:build:linux
```

Find your file at:
```
saion-ai/
└── release/
    ├── SAION-AI-v1.0.0.AppImage    ← for all Linux distros
    └── SAION-AI-v1.0.0.deb         ← for Ubuntu/Debian
```

---

## 🤖 STEP 4 — Build Android APK

Android needs a separate tool called Capacitor.
Run these commands one by one:

### Install Capacitor:
```
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "SAION AI" "com.saionproduction.saionai"
```

### Build the web app first:
```
npm run build
```

### Add Android platform:
```
npx cap add android
npx cap copy android
```

### Open in Android Studio:
```
npx cap open android
```

Android Studio will open. Then:
1. Click Build → Generate Signed Bundle/APK
2. Choose APK
3. Create a keystore (first time only)
4. Click Finish
5. Find APK at: android/app/release/app-release.apk

### Requirements:
- Download Android Studio from: https://developer.android.com/studio
- Install it, then run the commands above

---

## 📦 Build ALL at once (Windows + Linux)

```
npm run electron:build:all
```

---

## 🗂️ Where to find all your built files:

```
saion-ai/
└── release/
    ├── SAION-AI-Setup-v1.0.0.exe      ← Windows installer
    ├── SAION-AI-v1.0.0.AppImage       ← Linux (all distros)
    ├── SAION-AI-v1.0.0.deb            ← Linux (Ubuntu/Debian)
    └── android/app/release/
        └── app-release.apk            ← Android
```

---

## ❓ Common Errors & Fixes

### Error: "electron-builder not found"
```
npm install -g electron-builder
```

### Error: "Cannot find module electron"
```
npm install
```

### Error: "Wine not found" (on Linux/Mac building for Windows)
Install Wine:
- Mac: brew install wine-stable
- Linux: sudo apt install wine

### Error: "tsc not found"
```
npm install -g typescript
```

---

*Built with ❤️ by Saion Production*
