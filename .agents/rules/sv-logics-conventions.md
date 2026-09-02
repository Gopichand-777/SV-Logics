# SV Logics — Workspace Coding Conventions & Agent Rules

These rules apply to every AI agent working in this workspace.
Load `C:\Users\dell\.gemini\antigravity-ide\knowledge\sv-logics-codebase\artifacts\codebase_map.md` before any code change.

---

## Rule 1: Always Read the KI First

Before touching any file, read the codebase map KI:
`C:\Users\dell\.gemini\antigravity-ide\knowledge\sv-logics-codebase\artifacts\codebase_map.md`

This gives you the full architecture — routes, tables, components, contexts — without scanning files.

---

## Rule 2: Surgical Edits Only — No Full File Rewrites

**MANDATORY**: Use ONLY `multi_replace_file_content` or `replace_file_content` tools.
Never use `write_to_file` with `Overwrite: true` on existing source files.

✅ CORRECT — edit only the lines that change:
```
multi_replace_file_content → target specific lines
replace_file_content       → target a specific block
```

❌ WRONG — never do this for existing source files:
```
write_to_file(Overwrite: true) on an existing .jsx/.js/.css file
```

Exception: new files (don't exist yet) — use `write_to_file`.

---

## Rule 3: Log Every Change in CHANGELOG.md

After EVERY file modification, append a row to `d:\SV_LOGICS_2\CHANGELOG.md`:

```markdown
| {next_number} | {date IST} | {conversation topic} | {file(s)} | {what changed} | {why} |
```

Do this even for tiny changes like fixing a typo or adding a comment.

---

## Rule 4: No Schema Changes Without a Migration Script

If the DB schema (`backend/src/db/schema.js`) needs to change:
1. Create a migration script in `backend/src/db/migrate_*.js`
2. Tell the user to run `npm run db:push` after the change
3. Document the change in CHANGELOG.md

Never silently alter schema.js without a migration path.

---

## Rule 5: Environment Variables — Never Hardcode

- All secrets/URLs must use `process.env.*` (backend) or `import.meta.env.VITE_*` (frontend/admin)
- Backend reads `.env.development` or `.env.production` based on `NODE_ENV`
- Never write literal URLs, passwords, or API keys in source code

---

## Rule 6: Module System — ESM Only in Source, CJS in scripts/

- All `backend/src/**`, `frontend/src/**`, `admin/src/**` → use `import/export`
- Root `scripts/` and `*.cjs` files → CommonJS is allowed
- Never mix `require()` into ESM source files

---

## Rule 7: Naming Conventions

| Item | Convention | Example |
|---|---|---|
| JS variables & functions | camelCase | `sessionToken`, `getStudentById` |
| React components | PascalCase | `CourseDetail`, `LiveClasses` |
| CSS class names | kebab-case | `admin-layout`, `loader-spinner` |
| DB column names | snake_case | `created_at`, `password_hash` |
| Drizzle schema fields | camelCase | `passwordHash`, `createdAt` |
| Route files | `*.routes.js` | `auth.routes.js` |
| Controller files | `*.controller.js` | `auth.controller.js` |

---

## Rule 8: Price / Money Values

All monetary values are stored and transmitted in **paise** (integer).
₹1 = 100 paise. Display conversion: `(paise / 100).toLocaleString('en-IN')`.

---

## Rule 9: Video URL Priority (Frontend)

When rendering a chapter video:
1. Check `videoUrl` first (YouTube/external) — embed directly
2. Fall back to `videoKey` (R2 private) — fetch signed URL from `/api/chapters/:id/video`

---

## Rule 10: Session Token Enforcement

Single-session policy:
- Student logs in → new `sessionToken` written to DB → old sessions invalidated
- Middleware checks JWT's `sessionToken` claim against DB on every protected request
- On mismatch → 401 with `error: 'SESSION_INVALIDATED'`
- Frontend axios interceptor handles this by clearing localStorage and showing a toast before redirect

---

## Rule 11: Keep Swagger Docs Updated

Any new or modified route must have corresponding JSDoc `@swagger` annotations in the route file.
Swagger is served at `/api/docs`.
