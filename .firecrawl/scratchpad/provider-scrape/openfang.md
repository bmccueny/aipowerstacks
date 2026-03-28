[![OpenFang](https://www.openfang.sh/_next/image?url=%2Fopenfang-logo.png&w=64&q=75&dpl=dpl_97vj5kCWN6eFkCeDkFY5us5QnFRd)openfang](https://www.openfang.sh/#overview)

[01Introduction](https://www.openfang.sh/#overview) [02Runtime](https://www.openfang.sh/#runtime) [03Features](https://www.openfang.sh/#features) [04Compare](https://www.openfang.sh/#compare) [05Hands](https://www.openfang.sh/#hands) [06Code](https://www.openfang.sh/#sdk) [07Resources](https://www.openfang.sh/#resources) [08Community](https://www.openfang.sh/#community)

[Buy me a coffee](https://www.buymeacoffee.com/openfang) [RightNow-AI/openfang\\
\\
Open-source Agent OS. 14 crates, 1,700+ tests, zero clippy warnings.\\
\\
Star on GitHub](https://github.com/RightNow-AI/openfang)

[Discord](https://discord.gg/sSJqgNnq6X) [Twitter](https://x.com/openfangg) v0.1.0

●AGENT OPERATING SYSTEM

# The Agent  Operating System

Open-source Agent OS built in Rust. 7 autonomous Hands that run on schedules, build knowledge graphs, and report to your dashboard. 30 agents, 40 channels, 38 tools, 26 LLM providers. 16 security systems. One binary.

14 crates. 137K lines of Rust. Zero clippy warnings. Battle-tested architecture.

macOS / LinuxWindows

InstallUpdate

>`curl -fsSL https://openfang.sh/install | sh`

[Read the Docs →](https://www.openfang.sh/docs) [View on GitHub](https://github.com/RightNow-AI/openfang)

![OpenFang](https://www.openfang.sh/_next/image?url=%2Fassets%2Fopenfang-logo.png&w=640&q=75&dpl=dpl_97vj5kCWN6eFkCeDkFY5us5QnFRd)

7

Hands

16

Security Systems

40+

Channels

27

LLM Providers

●FEATURES

## What OpenFang Does

The core primitives for building, running, and deploying autonomous agents.

●HANDS

### 7 Autonomous Capability Packages

Pre-built agents that work FOR you. Clip turns video into shorts. Lead generates qualified leads. Collector monitors targets. Predictor forecasts with Brier scores. Researcher fact-checks with CRAAP. Twitter manages your X account. Browser automates the web. Activate, configure, check your dashboard.

●SECURITY

### 16 Security Systems

WASM dual-metered sandbox, Ed25519 manifest signing, Merkle audit trail, taint tracking, SSRF protection, secret zeroization, HMAC-SHA256 mutual auth, GCRA rate limiter, subprocess isolation, prompt injection scanner, path traversal prevention, and more.

●RUNTIME

### Sandboxed Execution

Tool code runs inside WASM with dual metering (fuel + epoch interruption). File operations are workspace-confined. Subprocesses are env-cleared and timeout-enforced. 10-phase graceful shutdown.

●AGENTS

### 30 Pre-Built Agents

From orchestrators to code reviewers to customer support. Four performance tiers across Anthropic, Gemini, Groq, and DeepSeek. Spawn one in a single command.

●TOOLS

### 38 Built-In Tools + MCP

38 native tools plus Model Context Protocol client and server. Connect external MCP servers and expose OpenFang tools to other agents. Includes web search, browser automation, image generation, TTS, Docker, knowledge graphs.

●MEMORY

### Persistent Memory

SQLite-backed storage with vector embeddings. Cross-channel canonical sessions, automatic LLM-based compaction, and JSONL session mirroring. Agents recall context across conversations and channels.

●CHANNELS

### 40 Channel Adapters

Telegram, Discord, Slack, WhatsApp, Teams, IRC, Matrix, and 33 more. Per-channel model overrides, DM/group policies, rate limiting, and output formatting. One agent, every platform.

●PROTOCOLS

### MCP + A2A + OFP

Model Context Protocol (client + server), Google A2A agent-to-agent tasks, and OpenFang Protocol for P2P networking with HMAC-SHA256 mutual authentication. Your agents talk to the world.

●DESKTOP

### Tauri 2.0 Native App

Native desktop application with system tray, notifications, single-instance enforcement, auto-start on login, and global shortcuts. Full dashboard in a native window.

●COMPARE

## OpenFang vs The Landscape

6 frameworks. 10 dimensions. See how OpenFang's kernel-grade Rust architecture compares to OpenClaw, ZeroClaw, CrewAI, AutoGen, and LangGraph.

$openfang compare --all

\[10 features × 6 frameworks\]

Feature

OpenFang

OpenClaw

ZeroClaw

CrewAI

AutoGen

LangGraph

01Language

Rust

TypeScript

Rust

Python

Python

Python

02Autonomous Hands

7 built-in

None

None

None

None

None

03Security Layers

16 discrete

3 basic

6 layers

1 basic

Docker

AES enc.

04Agent Sandbox

WASM dual

None

Allowlists

None

Docker

None

05Channel Adapters

40

13

15

0

0

0

06Built-in Tools

53 + MCP

50+

12

Plugins

MCP

LC tools

07Memory

SQLite + vec

File-based

SQLite FTS5

4-layer

External

Checkpoints

08Desktop App

Tauri 2.0

None

None

None

Studio

None

09Audit Trail

Merkle chain

Logs

Logs

Tracing

Logs

Checkpoints

10License

MIT

MIT

MIT

MIT

Apache 2.0

MIT

OpenFang9

ZeroClaw1

// feature-by-feature comparison

●BENCHMARKS

## Measured, Not Marketed

Cold start time, memory footprint, install size, security depth, channel coverage, and provider support — benchmarked across 6 leading agent frameworks.

OpenFang

OpenClaw

ZeroClaw

CrewAI

AutoGen

LangGraph

Cold Start Timelower is better

ZeroClaw

10ms

OpenFang

180 ms

LangGraph

2500 ms

CrewAI

3000 ms

AutoGen

4000 ms

OpenClaw

5980 ms

Idle Memory Usagelower is better

ZeroClaw

5 MB

OpenFang

40 MB

LangGraph

180 MB

CrewAI

200 MB

AutoGen

250 MB

OpenClaw

394 MB

Install Sizelower is better

ZeroClaw

8.8 MB

OpenFang

32 MB

CrewAI

100 MB

LangGraph

150 MB

AutoGen

200 MB

OpenClaw

500 MB

Security Systemshigher is better

OpenFang

16 layers

ZeroClaw

6 layers

OpenClaw

3 layers

AutoGen

2 layers

LangGraph

2 layers

CrewAI

1 layers

Channel Adaptershigher is better

OpenFang

40 built-in

ZeroClaw

15 built-in

OpenClaw

13 built-in

CrewAI

0

AutoGen

0

LangGraph

0

LLM Providershigher is better

ZeroClaw

28 native

OpenFang

27 native

LangGraph

15 native

CrewAI

10 native

OpenClaw

10 native

AutoGen

8 native

// benchmarks from official docs and public repos — February 2026

●HANDS

## Agents That Work For You

Hands are pre-built autonomous capability packages. Unlike regular agents you chat with, Hands run on schedules, build knowledge graphs, and report results to your dashboard. Activate one and check in on its progress.

>

Traditional agents wait for you to type. Hands work for you.

Each Hand bundles a HAND.toml manifest, system prompt with multi-phase operational playbook, SKILL.md expert knowledge, configurable settings, and dashboard metrics — all compiled into the binary at build time.

🎬

### Clip

Content

Turns long-form video into viral short clips with captions, thumbnails, and optional AI voice-overs. Publishes to Telegram and WhatsApp.

8-phase pipelineFFmpeg + yt-dlp5 STT backendsAuto-publish

📊

### Lead

Data

Autonomous lead generation. Discovers, enriches, scores, and deduplicates qualified leads on a daily schedule. Builds ICP profiles and knowledge graphs.

ICP scoring 0-100Web research loopsCSV/JSON/Markdown exportScheduled delivery

🔍

### Collector

Intelligence

OSINT-style intelligence collector. Monitors any target continuously with change detection, sentiment tracking, and knowledge graph construction.

Change detectionSentiment analysisKnowledge graphsCritical alerts

🔮

### Predictor

Forecasting

Superforecasting engine. Collects signals, builds calibrated reasoning chains, makes predictions, and tracks accuracy with Brier scores.

Brier score calibrationContrarian modeEvidence chainsAccuracy tracking

🔬

### Researcher

Productivity

Deep autonomous researcher. Cross-references sources, fact-checks claims with CRAAP evaluation, and generates cited reports in multiple languages.

CRAAP fact-checkingMulti-languageAPA citationsSource verification

𝕏

### Twitter

Communication

Autonomous Twitter/X manager. Creates content in 7 rotating formats, schedules posts, engages with mentions, and tracks performance metrics.

Approval queue7 content typesEngagement trackingBrand voice control

🌐

### Browser

Automation

Web automation agent. Navigates sites, fills forms, clicks buttons, and completes multi-step workflows. Mandatory purchase approval gate.

Purchase gatePlaywright bridgeSession persistenceCAPTCHA detection

+

### Build Your Own

Define a HAND.toml with tools, settings, requirements, and a system prompt. Publish to FangHub.

[Hand development guide →](https://www.openfang.sh/docs/hands)

$openfang hand --help

activate<hand> Activate a Hand (spawns autonomous agent)

deactivate<hand> Stop a running Hand

status<hand> Check Hand metrics and status

list List all available Hands

pause<hand> Pause a running Hand

resume<hand> Resume a paused Hand

●COOKBOOK

## Recipes for Every Use Case

Guides, examples, and references to help you build with OpenFang.

$openfang search\[12\]

allguidereferenceexamplesecurity

[guide→\\
**Quick Start Guide** \\
Install OpenFang and spawn your first agent in under 2 minutes.\\
\\
guide](https://www.openfang.sh/docs/getting-started) [reference→\\
**Architecture Overview** \\
14-crate Rust workspace, kernel design, and subsystem overview.\\
\\
reference](https://www.openfang.sh/docs/architecture) [reference→\\
**Configuration Reference** \\
Every config.toml field, 62 environment variables, validation rules.\\
\\
reference](https://www.openfang.sh/docs/configuration) [reference→\\
**Security Model** \\
16 security systems: WASM sandbox, taint tracking, audit trail, SSRF protection.\\
\\
referencesecurity](https://www.openfang.sh/docs/security) [guide→\\
**LLM Providers** \\
26 providers, 50+ models, cost rates, and intelligent routing.\\
\\
guide](https://www.openfang.sh/docs/providers) [guide→\\
**40 Channel Adapters** \\
Connect agents to Telegram, Discord, Slack, WhatsApp, and 36 more platforms.\\
\\
guide](https://www.openfang.sh/docs/channel-adapters) [example→\\
**Agent Templates** \\
30 pre-built agents across 4 performance tiers, ready to deploy.\\
\\
example](https://www.openfang.sh/docs/agent-templates) [guide→\\
**Hands System** \\
7 autonomous capability packages. Activate, configure, and let them work for you.\\
\\
guide](https://www.openfang.sh/docs/architecture) [guide→\\
**Skill Development** \\
60 bundled skills, SKILL.md format, FangHub marketplace.\\
\\
guide](https://www.openfang.sh/docs/skill-development) [guide→\\
**Workflow Engine** \\
Multi-agent pipelines with fan-out, conditional, and loop step modes.\\
\\
guide](https://www.openfang.sh/docs/workflows) [reference→\\
**MCP & A2A Protocols** \\
Model Context Protocol and Agent-to-Agent communication.\\
\\
reference](https://www.openfang.sh/docs/mcp-a2a) [reference→\\
**REST API Reference** \\
140+ endpoints — agents, memory, workflows, channels, models, skills, A2A, hands.\\
\\
reference](https://www.openfang.sh/docs/api-reference)

Built & maintained by [![RightNow AI](https://www.openfang.sh/_next/image?url=%2Frightnow-logo.webp&w=96&q=75&dpl=dpl_97vj5kCWN6eFkCeDkFY5us5QnFRd)RightNow](https://www.rightnowai.co/)

OpenFang is built by [Jaber](https://x.com/Akashi203), Founder of [RightNow](https://www.rightnowai.co/).

[rightnowai.co](https://www.rightnowai.co/) [@Akashi203](https://x.com/Akashi203)