# AI Integration

## Supported Providers

The backend supports four provider modes:

- `gemini`
- `openai`
- `claude`
- `ollama`

The active provider is selected through `AI_PROVIDER`.

## Current Default Runtime

Current default settings:

- provider: `openai`
- model: `qwen2.5:7b`
- gateway: configured from `OPENAI_BASE_URL`

This uses an OpenAI-compatible chat endpoint rather than the official OpenAI API.

## Why `qwen2.5:7b` Is the Operational Default

The gateway also exposes `qwen2.5:14b`, but the 14B model is more likely to:

- respond slowly
- hit timeouts during screening
- amplify batch latency

`qwen2.5:7b` is the safer default for interactive screening flow.

## Provider Selection Logic

Provider construction happens in `backend/app/services/ai_service.py`.

The service:

- reads environment configuration
- initializes the correct provider implementation
- attaches `_meta.provider` and `_meta.model` to screening results

## OpenAI-Compatible Mode

The app originally used the OpenAI Python SDK for OpenAI-compatible mode, but the current gateway rejected SDK-originated requests while accepting raw HTTP requests.

The `OpenAIProvider` now:

- sends direct HTTP requests to `/chat/completions`
- uses bearer auth from `OPENAI_API_KEY`
- parses `choices[0].message.content`

This makes the gateway usable without depending on SDK-specific behavior.

## Retry and Rate-Limit Strategy

Provider base behavior now includes:

- configurable retry count
- exponential backoff
- `Retry-After` header support when present
- retry on common transient statuses:
  - `408`
  - `409`
  - `425`
  - `429`
  - `500`
  - `502`
  - `503`
  - `504`

It also retries on message patterns such as:

- `rate limit`
- `too many request`
- `resource exhausted`
- `quota exceeded`

## Batch Screening Delay

During `POST /api/screening`, the backend applies a small delay between candidate requests.

Why this exists:

- lowers burst pressure on the AI provider
- reduces repeat 429s in small batch runs
- smooths gateway utilization

## Failure Normalization

If an AI call fails, the screening layer returns a structured fallback result:

- all scores become `0`
- `weaknesses` contains the error text
- `summary` indicates AI screening failed

This keeps the frontend stable even during provider outages.

## Stale Result Refresh Rules

The backend refreshes stored screenings when:

- the old result is an AI failure
- the old result was produced by a different provider
- the old result was produced by a different model

This is important after switching from Gemini to the current gateway.

## Environment Variables

Primary variables:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://your-ollama-gateway.example.com/v1
OPENAI_MODEL=qwen2.5:7b
AI_MAX_RETRIES=3
AI_RETRY_BASE_DELAY_SECONDS=2
AI_SCREENING_DELAY_SECONDS=1
AI_REQUEST_TIMEOUT_SECONDS=180
```

Fallback/provider-specific variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-3-haiku-20240307
OLLAMA_BASE_URL=https://your-ollama-gateway.example.com
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_API_KEY=
```

## Public Documentation Guidance

If this repository is published publicly:

- keep real gateway URLs in `.env` or deployment secrets
- document examples with placeholder domains such as `your-ollama-gateway.example.com`
- never commit API keys, bearer tokens, or tunnel tokens into docs

## Operational Recommendations

- keep the default model on `qwen2.5:7b` for day-to-day screening
- switch to heavier models only when quality gains justify latency
- avoid selecting very large batches in one click if the gateway is under load
- watch `/api/health` in the frontend shell to confirm the active model after config changes
