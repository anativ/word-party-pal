# Project Rules

- External word/verb management must go through the `words-api` edge function, authenticated by the `WORDS_ADMIN_API_KEY` secret via the `x-api-key` header. Never widen the `words`/`verbs` RLS write policies to support it, and never hardcode the key in frontend code.
- See `API.md` for the endpoint contract (table/action/items JSON body).
