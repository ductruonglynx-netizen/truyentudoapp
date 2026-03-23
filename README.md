<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9e613df0-6bf5-4998-83d9-3a939cf7475d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Phase 0 Demo (Roadmap trial)

- Open the demo workspace at: `http://localhost:3000/?phase0=1`
- Optional environment keys (for provider routing):
  - `VITE_OPENAI_API_KEY`
  - `VITE_ANTHROPIC_API_KEY`
  - `VITE_GEMINI_API_KEY`
- If no key is configured, the app falls back to a mock provider so the UI flow still runs.

## Phase 1 MVP Trial

- Open the phase 1 workspace at: `http://localhost:3000/?phase1=1`
- Included in this trial:
  - API key input directly in UI for OpenAI / Anthropic / Gemini
  - Configurable provider fallback order (multi-source AI routing)
  - Split-screen translator workspace with segment statuses (`pending/translated/reviewed`)
  - Glossary CRUD with glossary version bump
  - AI translation with 3 alternatives + apply flow
  - Glossary hard-lock validation (invalid options are blocked)
  - Translation Memory save and match (exact + fuzzy)
  - Bulk translate whole chapter
  - Export translated chapter to `.txt`
