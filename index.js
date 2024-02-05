const { app, BrowserWindow } = require("electron");
const koffi = require("koffi");

const lib = koffi.load("user32.dll");
const SetWindowPos = lib.func("__stdcall", "SetWindowPos", "bool", [
  "int",
  "int",
  "int",
  "int",
  "int",
  "int",
  "uint",
]);
const FindWindowA = lib.func("__stdcall", "FindWindowA", "int", [
  "string",
  "string",
]);

const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;
const SWP_NOSIZE = 0x0001;
const SWP_NOMOVE = 0x0002;
const SWP_NOACTIVATE = 0x0010;

// Call native Windows APIs
async function bringToFrontNative(win) {
  console.log("Bringing to front now.");

  // Call win32 APIs to achieve bring to front without stealing focus
  const hWnd = await FindWindowA(null, win.getTitle());
  if (hWnd) {
    SetWindowPos(
      hWnd,
      HWND_TOPMOST,
      0,
      0,
      0,
      0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
    );

    SetWindowPos(
      hWnd,
      HWND_NOTOPMOST,
      0,
      0,
      0,
      0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
    );
  }
}

// Electron APIs workaround
async function bringToFrontWorkaround(win) {
  win.showInactive();
  win.setAlwaysOnTop(true);
  win.setAlwaysOnTop(false);
}

// Option to use either the native calls solution, or the electron workaround solution
const USE_NATIVE_CALLS = true;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL("https://www.electronjs.org/");

  console.log("Bringing to front in 5s...");
  setTimeout(async () => {
    USE_NATIVE_CALLS
      ? await bringToFrontNative(mainWindow)
      : await bringToFrontWorkaround(mainWindow);
  }, 5000);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
