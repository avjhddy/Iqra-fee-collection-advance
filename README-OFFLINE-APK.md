# Iqra School Recorder — Offline Android APK

This version is converted to **offline-first** mode.

### What it does
- Stores students, teachers, fees, salaries, expenses and photos in the phone's **IndexedDB** database.
- Does not require PostgreSQL, a server, internet, or a login to use the app.
- Keeps data after closing/restarting the app.
- Includes **Backup** and **Restore** through the existing Settings screen.
- Uses static Next.js export + Capacitor Android packaging.
- GitHub Actions builds a downloadable debug APK.

### Build the APK from GitHub
1. Upload this whole project to a GitHub repository.
2. Open **Actions**.
3. Select **Build Offline Android APK**.
4. Tap **Run workflow**.
5. Open the completed workflow run.
6. Download the artifact **Iqra-School-Recorder-Offline-APK**.
7. Extract the ZIP and install `app-debug.apk` on the Android phone.

### Important backup rule
The database is local to the phone/app installation. **Always make a backup before uninstalling, clearing app data, or changing phones.** Restore the backup from Settings on the new installation.

### Capacity
IndexedDB is much more suitable for a large school database than localStorage. Actual capacity depends on Android/device storage. Photos and receipt images use storage, so periodic backups are recommended.

### If GitHub Actions fails
Open the failed workflow and copy the red error section. The project is designed so the Android folder is generated during CI, avoiding a huge generated Android directory in the ZIP.


## Android offline APK build (fixed)
This project is packaged as a fully local Capacitor Android app. The app uses IndexedDB in the WebView for students, teachers, fees, salaries, expenses, settings, photos/attachments, and backup data. It does not require an internet connection after installation.

The dynamic `/students/[id]` and `/teachers/[id]` routes were replaced with static `/students/profile?id=...` and `/teachers/profile?id=...` pages because Next.js static export cannot generate unknown local database IDs at build time.

### GitHub Actions
Push the project root contents to the repository root (not one extra nested folder), then run:
**Actions → Build Offline Android APK → Run workflow**.

The workflow installs dependencies, builds the static web app, creates/synchronizes the Android project with Capacitor, builds the debug APK, and uploads it as an artifact named `Iqra-School-Recorder-Offline-APK`.

If the repository does not contain a lock file, the workflow intentionally does not use npm dependency caching, so GitHub Actions will not stop with the "Dependencies lock file not found" error.
