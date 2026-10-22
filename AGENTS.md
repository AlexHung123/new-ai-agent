# new-ai-agent

Next.js chat app at `D:\Projects\new-ai-agent`, basePath `/itms/ai`.

## Chat topbar

Keep **Plus** (new conversation) and **Close X**. Do not restore Share.

- Plus (`lucide-react` Plus) lives in `src/components/Navbar.tsx`. It navigates to `/itms/ai/` and shows on every page, including `/agents`.
- Close X is `CloseBackToItms` in `WorkspaceChrome`. It shows on every page. Click still posts to the parent when embedded, otherwise goes back or closes the window.
- Share / `exportAsMarkdown` / Headless UI export popover was removed from `Navbar.tsx`. `chatTopbar.test.ts` asserts Plus is present and Share / `exportAsMarkdown` are absent.
- Unused pi-web actions stay gone: Full history, Generate title, System, Tools, hide-sidebar.

## Verification

Do not verify UI in the browser or with Playwright unless the user asks. Contract tests (`src/lib/chat/chatTopbar.test.ts` and similar `readFileSync` checks) are enough.
