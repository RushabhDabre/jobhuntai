# 🚀 JobHunt AI — Self-Use Job Search & Career Copilot

An autonomous personal job hunt platform built with **Next.js (TypeScript, React 19, Tailwind CSS v4)**, combining **Firecrawl**, **Apify**, and **Google Gemini AI**.

---

## 🌟 Why Distribute Between Firecrawl & Apify?

Instead of relying on a single scraper, JobHunt AI distributes collection tasks to their strengths:

1. **Apify Actors** (`LinkedIn`, `Google Jobs`, `Indeed`):
   - Best for **broad sweeping** across job aggregators and major platforms.
   - Harvests dozens of recent postings matching keywords and locations in seconds.
2. **Firecrawl** (`Single URL Scrape` & `Career Page Crawl`):
   - Best for **deep extraction** directly from company career sites (e.g. `linear.app/careers`, `anthropic.com/careers`, Greenhouse/Lever/Ashby links).
   - Bypasses dynamic JS rendering and extracts pristine markdown and requirements.
3. **Direct ATS Engine** (`Greenhouse`, `Lever`, `Ashby`):
   - **Zero API cost** public board harvester for companies like Stripe, Figma, OpenAI, Vercel, and Supabase.
4. **Gemini AI Matching Engine** (`@google/genai`):
   - Evaluates fit (0-100%) against your customized resume and criteria.
   - Highlights strengths, flags skill gaps, and suggests interview talking points.
   - Generates tailored cover letters, hiring manager cold emails, and LinkedIn outreach DMs.

---

## 🛠️ Features

- 📋 **Pipeline Kanban Board**: Track applications through `Discovered` ➔ `Saved` ➔ `Applied` ➔ `Interviewing` ➔ `Offer` ➔ `Rejected`.
- 🔍 **Multi-Source Harvester**:
  - **Firecrawl Tab**: Scrape single job URLs or crawl whole careers directories.
  - **Apify Tab**: Query Google Jobs, LinkedIn, or Indeed actors with custom limits.
  - **ATS Tab**: 1-click import from Greenhouse, Lever, and Ashby boards.
  - **Manual Drop**: Quick paste job descriptions directly.
- 🎯 **AI Match Scoring (0-100%)**: Instant candidate-to-job analysis with Gemini.
- ✉️ **Custom Pitch Generator**: 1-click tailored cover letters and cold outreach messages.
- 👤 **Resume & Profile Studio**: Set target titles, locations, remote preference, and paste your full background.
- ⚙️ **In-App API Key Manager**: Store Gemini, Firecrawl, and Apify credentials locally in `.data/settings.json` or `.env.local`.

---

## 🚀 Getting Started

The platform is already running at `http://localhost:3000`.

To start manually in the future:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Configuring API Keys

Click the **Settings (gear icon)** in the top right to configure:
- **Gemini API Key**: [Get a free key from Google AI Studio](https://aistudio.google.com/app/apikey)
- **Firecrawl API Key**: [Get key from firecrawl.dev](https://firecrawl.dev)
- **Apify API Token**: [Get token from console.apify.com](https://console.apify.com/account/integrations)
