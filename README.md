<img width="742" height="382" alt="readme-image" src="https://github.com/user-attachments/assets/97e3a33b-c9f5-4b43-94d1-0707a77c421e" />



# AI-Watch

> Give your AI a sense of time.

Local time context for AI chat interfaces — date, exact time, timezone,
session length, and time elapsed since your last message. 100% local — zero
network requests, verifiable in this codebase (`grep -r "fetch(" src/`
returns nothing).

Works with ChatGPT, Claude, Gemini, Mistral, Perplexity, and Grok out of the
box, plus any other web AI interface (including local ones like Open WebUI,
Ollama, and LM Studio) via the opt-in Free Wrist.

**Status: Calibre 1.0 — GM. Shipping as "AI-Watch Clock" on the Chrome Web
Store and Firefox Add-ons; source and releases live here.**

## Development

```bash
npm install
npm run dev            # Chrome with HMR
npm run dev:firefox    # Firefox
npm test               # unit tests (core is pure & fully testable)
npm run build && npm run build:firefox
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Key invariants: display
name centralized in `src/shared/brand.ts`, dials are themes only,
generic-first adapters, zero network, honest injection.

## Privacy

No data collection, no network requests, nothing leaves your device. See
`src/shared/brand.ts` and the content scripts in `src/content/` for the
full injection logic — there is nothing else to audit.

## License

MIT
