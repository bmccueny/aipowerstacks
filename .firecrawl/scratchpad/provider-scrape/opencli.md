v1.3.1 — Now with Desktop App Support

# Make Any Website  Your CLI

Turn any website or Electron app into a powerful command-line interface. Zero risk. Reuse Chrome login. AI-powered discovery.

[Get Started](https://www.npmjs.com/package/@jackwener/opencli) [View on GitHub](https://github.com/jackwener/opencli)

zsh — opencli

$npm install -g @jackwener/opencli

$opencli bilibili hot --limit 5

┌─ Bilibili Hot Videos ──────────────────────┐

│ # │ Title │ Views │ Score │

│ 1 │ 你不知道的编程技巧 │ 1.2M │ 98 │

│ 2 │ 2026年最佳开源项目 │ 890K │ 95 │

└────────────────────────────────────────────┘

$opencli twitter trending  # reuses Chrome login

Features

## Built for power users  & AI agents alike

A dual-engine architecture that bridges websites and desktop apps into a unified CLI experience.

🛡️

### Account Safe

Reuses Chrome's logged-in state. Your credentials never leave the browser — zero security risk.

🤖

### AI Agent Ready

Built-in explore, synthesize, and cascade commands. AI discovers APIs and generates adapters automatically.

🖥️

### Desktop Apps Too

CLI-ify Electron apps like Cursor, Codex, ChatGPT, Notion, Discord — AI can now control itself natively.

⚡

### Dual Engine

YAML declarative pipelines for simple flows. TypeScript adapters for robust browser runtime injection.

🔄

### Self-Healing

Built-in setup wizard and doctor command. Auto-diagnoses daemon, extension, and browser connectivity.

📦

### Dynamic Loader

Drop .ts or .yaml adapters into the clis/ folder — auto-registered, zero config. Extend in seconds.

Integrations

## 30+ platforms,  one interface

Browser APIs, desktop apps, and public feeds — all accessible through clean CLI commands.

| Platform | Mode | Available Commands |
| --- | --- | --- |
| Twitter / X | browser | trendingbookmarksprofilesearchtimelinepostreplydownload |
| Cursor | desktop | statussendreadnewcomposermodelaskscreenshot |
| Bilibili | browser | hotsearchmefavoritehistoryfeedsubtitledownload |
| Reddit | browser | hotfrontpagepopularsearchsubredditreadcommentsave |
| Codex | desktop | statussendreadnewextract-diffmodelaskhistory |
| Notion | desktop | statussearchreadnewwritesidebarfavoritesexport |
| YouTube | browser | searchvideotranscript |
| 小红书 | browser | searchnotificationsfeedmeuserdownload |
| ChatGPT | desktop | statusnewsendreadask |
| Discord | desktop | statussendreadchannelsserverssearch |
| GitHub | public | search |
| Hacker News | public | top |

How It Works

## From install to  CLI in 60 seconds

No tokens. No scraping. Just your browser session, bridged securely to a CLI.

01

### Install

One npm command. Works globally, instantly.

npm i -g @jackwener/opencli

02

### Bridge

Load the Browser Bridge extension in Chrome. Auto-connects with zero config.

opencli setup

03

### Login

Just browse normally. OpenCLI reuses your existing logged-in sessions.

04

### Command

Run any supported command. Data flows from your browser to your terminal.

opencli bilibili hot

## Ready to CLI everything?

Join developers who turn the web into their terminal.

npm install -g @jackwener/opencli📋 [Star on GitHub ⭐](https://github.com/jackwener/opencli)