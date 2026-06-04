PreviHTML - Modified Mantine Vite Template

What I added:

- components/Editor/Editor.tsx: single editable textarea, localStorage autosave every 5s, settings modal to store OpenRouter API key in localStorage, collapsible persistent log viewer, generate/copy/download HTML functionality. Uses client-side OpenRouter POST request if API key present, falls back to local formatter if not.
- scripts/autocommit.js: optional script to run locally to commit changes to git.
- scripts/copy_to_sd.sh: script to copy the project to an Android SD card Downloads folder.

How to run:

1) Install deps (yarn recommended as project uses yarn in template):
   cd previhtml-app
   yarn
2) Run dev server:
   yarn dev
3) Open http://localhost:5173

Notes:
- Client-side calls to OpenRouter may be blocked by CORS depending on your network/provider. If you run into CORS issues, consider running a small local proxy to forward requests with your API key.
- API key is stored only in localStorage in the browser.
- To copy the project to your SD card:
   cd previhtml-app
   bash scripts/copy_to_sd.sh /storage/emulated/0/Download

- To run autocommit (will try to create a git commit in this repo):
   node scripts/autocommit.js

Generated with Continue
