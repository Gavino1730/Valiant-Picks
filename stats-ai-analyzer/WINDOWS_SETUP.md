# Windows Setup for PDF to Image Conversion

## Install Poppler (Required for pdf2image)

The app needs Poppler to convert PDF pages to images for visual analysis.

### Option 1: Quick Install with Chocolatey (Recommended)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run:
     ```powershell
     Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
     ```

2. **Install Poppler**:
   ```powershell
   choco install poppler
   ```

### Option 2: Manual Install

1. **Download Poppler for Windows**:
   - Go to: https://github.com/oschwartz10612/poppler-windows/releases/
   - Download the latest release (e.g., `Release-24.02.0-0.zip`)

2. **Extract the ZIP file**:
   - Extract to: `C:\Program Files\poppler`
   - You should have: `C:\Program Files\poppler\Library\bin\`

3. **Add to System PATH**:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit" → "New"
   - Add: `C:\Program Files\poppler\Library\bin`
   - Click OK on all dialogs
   - Restart your terminal/command prompt

4. **Verify Installation**:
   ```bash
   pdftoppm -h
   ```
   - Should show help text if installed correctly

## If You Get Errors

**"Unable to get page count. Is poppler installed?"**
- Make sure Poppler is in your PATH
- Restart your terminal after adding to PATH
- Try the Chocolatey method for easier setup

**Vision analysis will still work without Poppler!**
- The app will fall back to text-only analysis if image conversion fails
- You'll see a warning but analysis will continue

## Alternative: Windows WSL

If you have Windows Subsystem for Linux:
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

Then run the Python app from WSL.
