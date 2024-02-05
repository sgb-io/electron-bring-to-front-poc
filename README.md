# Bring to front (without stealing focus) on Electron (Windows)

## What is this?

This PoC demonstrates the only 2 ways to achieve bring-to-front without stealing focus that is consistent and reliable.

## Limitations on standard bring-to-front APIs

Although Windows has certain APIs (e.g. `SetForegroundWindow` and `BringWindowToTop`) that allow a window to be brought to the front, there are 2 major issues:

**Issue 1**: There are various restrictions that mean the window might _not_ actually get brought to the front:

> The system restricts which processes can set the foreground window. A process can set the foreground window only if one of the following conditions is true:
>
> - The process is the foreground process.
> - The process was started by the foreground process.
> - The process received the last input event.
> - There is no foreground process.
> - The process is being debugged.
> - The foreground process is not a Modern Application or the Start Screen.
> - The foreground is not locked (see LockSetForegroundWindow).
> - The foreground lock time-out has expired (see SPI_GETFOREGROUNDLOCKTIMEOUT in SystemParametersInfo).
> - No menus are active.

**Issue 2** Focus gets stolen

Issue #1 is partially a consequence of #2.

It is possible to work around issue #1 using a trick where you make Windows think the process and target window are related by attaching the threads:

(src: https://stackoverflow.com/questions/19136365/win32-setforegroundwindow-not-working-all-the-time)

```C
void CommonHelpers::forceForegroundWindow(HWND hwnd) {
    DWORD windowThreadProcessId = GetWindowThreadProcessId(GetForegroundWindow(),LPDWORD(0));
    DWORD currentThreadId = GetCurrentThreadId();
    DWORD CONST_SW_SHOW = 5;
    AttachThreadInput(windowThreadProcessId, currentThreadId, true);
    BringWindowToTop(hwnd);
    ShowWindow(hwnd, CONST_SW_SHOW);
    AttachThreadInput(windowThreadProcessId,currentThreadId, false);
}
```

However, we are still left with issue #2.

## Avoiding stealing focus

There are currently only 2 known workarounds to achieve the desired result:

1. Native Windows calls: make 2 calls to the `SetWindowPos` API that control the Z-index of a window (`HWND_TOPMOST` then `HWND_NOTOPMOST`)
2. Electron API calls: make 1 call to `showInactive`, then make 2 calls to the `setAlwaysOnTop` API (`true` then `false`)

These techniques seem to circumvent the various restrictions above: brings the window to the top, and does not steal focus.

Both techniques are demonstrated in this PoC.

## Running the PoC

1. Optionally change `USE_NATIVE_CALLS` depending on which solution to test
2. `npm install`
3. Either run the Electron in dev mode using `npm start`, or build and run the native .exe via: `npx electron-packager . BringToFrontPoc --platform=win32 --arch=x64`.
4. A bring-to-front-without-stealing-focus event should fire 5s after booting

Note: you may need to supply the `--overwrite` argument when building.
