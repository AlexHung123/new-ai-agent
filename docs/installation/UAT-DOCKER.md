# Deploy the Agent HTML image to UAT

Use this when replacing the UAT `aiagent` container with the master build that adds Agent HTML.

The app is served at base path `/itms/ai`. Leave the UAT volume and `data/config.json` in place. This build does not change database hosts or the model URL.

## What this image changes

- Agent HTML card. It edits WCMS TinyMCE HTML in a live canvas. The card is shown only when iTMS grants `chatHtmlAgent:execute`.
- WCMS open URL (query string on `/itms/ai/`):

  `wcmsContentId`, `pageIndex`, `lang` (`en`, `tc`, or `sc`), and optional `itmsOrigin` (the parent iTMS origin).

  HTML is read from UAT `itmsdb` table `wcms_content` (`tiny_mce_content_en` / `_tc` / `_sc`), using `databases.secondary` in the volume `data/config.json`. Insert back posts `{ type: "agent-html-apply", wcmsContentId, pageIndex, lang, html }` to the parent frame.
- Agent database columns on `chats`, applied on container start:
  - `0005_chat_wcms_lang.sql` adds `wcmsLang`
  - `0006_chat_wcms_content.sql` adds `wcmsContentId` and `wcmsPageIndex`
- Self-hosted TinyMCE. Both `Dockerfile` and `Dockerfile.slim` run `scripts/copy-tinymce.js` during the image build and copy `public/tinymce` into the runtime image. That directory is gitignored. A git pull alone does not update a running container.
- Chat top bar on every page: Plus (new conversation, goes to `/itms/ai/`) and Close X. Share is not in this build.
- Agent HTML and Agent Writing use the docked right panel. Survey answers include the red accuracy line `AI生成的回覆可能不準確，使用前請仔細核實。` on every reply.
- `skills/` and `vendor/answer-me-with-html` are still copied into the image. Agent Writing and Agent Document need `vendor/answer-me-with-html/scripts/am.mjs` at runtime.

There is no `0004_*.sql` in this tree. `ran_migrations.name` is the numeric prefix only. If UAT already has `0004` from an older `ppt_decks` migration, leave that row. Do not add another `0004` file.

## Before the swap

1. On UAT iTMS, grant `chatHtmlAgent:execute` to the roles that should see Agent HTML. Without that permission the card stays hidden. A permissions API error also hides it.
2. Record the current image so you can roll back:

   ```bash
   docker inspect --format "{{.Config.Image}}" aiagent
   docker tag aiagent aiagent:uat-previous
   ```

   If the container name is not `aiagent`, use the name from `docker ps`.
3. Back up the **agent** database (`databases.agent` or `DATABASE_URL` / `PI_SESSION_DATABASE_URL`). Do not dump `itmsdb` or `limesurveydb` for this step. The migration only adds nullable columns on `chats`.
4. Confirm the UAT volume `data/config.json` already points at UAT:
   - `databases.agent` — agent application database (migrations run here)
   - `databases.secondary` — UAT `itmsdb` (WCMS reads `wcms_content` here)
   - `databases.limesurvey` — leave as-is
   - `base.baseURL` and `base.modelId` — UAT model

   Do not copy `data/config.json` from a developer machine. That file has local hosts and is not part of the git commit.
5. Leave `DATA_DIR` unset. The process working directory is `/home/aiagent`, so:
   - config is `/home/aiagent/data/config.json` (the data volume)
   - migrations are `/home/aiagent/drizzle/pg` (inside the image, not the volume)

   If `DATA_DIR` is set to the data volume, startup looks for migrations under that volume and logs `No postgres migrations folder`.

## Build

On the UAT build host, from a master checkout that contains this document:

```bash
git pull origin master
docker build -f Dockerfile -t aiagent:uat .
```

Use `Dockerfile` (not `Dockerfile.slim`) unless UAT is already on the slim image. The full file also generates the Prisma client. Slim received the same TinyMCE copy lines.

Check the image before you replace the container:

```bash
docker run --rm --entrypoint ls aiagent:uat public/tinymce/tinymce.min.js
docker run --rm --entrypoint ls aiagent:uat vendor/answer-me-with-html/scripts/am.mjs
docker run --rm --entrypoint ls aiagent:uat drizzle/pg/0006_chat_wcms_content.sql
```

Each command must print the file path. If TinyMCE is missing, the image was built without `scripts/copy-tinymce.js`.

## Replace the container

Keep the same port, env, and volume mounts as the current container. Inspect them first:

```bash
docker inspect aiagent --format "{{json .HostConfig.Binds}}"
docker inspect aiagent --format "{{json .Config.Env}}"
```

The data volume must stay mounted at `/home/aiagent/data`. That volume holds `config.json`, documents, prompts, writing files, and `html-pages/` (WCMS working HTML). Do not mount a volume over `/home/aiagent/public` or `/home/aiagent/drizzle`.

Compose:

```bash
docker compose up -d --no-deps aiagent
docker compose logs -f aiagent
```

Plain `docker run` (match the binds and env you inspected; the example only shows the usual volumes):

```bash
docker stop aiagent
docker rm aiagent
docker run -d --name aiagent -p 3000:3000 \
  -v aiagent-data:/home/aiagent/data \
  -v aiagent-uploads:/home/aiagent/uploads \
  aiagent:uat
docker logs -f aiagent
```

## Startup logs

Expect:

```text
Running database migrations...
Applied migration: 0005_chat_wcms_lang.sql
Applied migration: 0006_chat_wcms_content.sql
Database migrations completed successfully
```

If those prefixes are already in `ran_migrations`, the log says `Skipping already-applied migration` instead of `Applied`. That is fine.

| Log | What to do |
|-----|------------|
| `Applied migration: 0005...` and `0006...` | Continue to the checks below |
| `Skipping already-applied migration: 0005` / `0006` | Columns were recorded earlier. Still run the SQL check |
| `No postgres migrations folder` | `DATA_DIR` is not `/home/aiagent`. Fix env and recreate the container |
| `Duplicate migration prefix` | Two SQL files share a numeric prefix. Do not send traffic. The image on master has one file per prefix |
| `Failed to run database migrations` | Agent DB connection or permission. Do not send traffic. The previous image tag is `aiagent:uat-previous` |

Confirm columns on the agent database:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'chats'
  AND column_name IN ('wcmsLang', 'wcmsContentId', 'wcmsPageIndex')
ORDER BY column_name;
```

Expect three rows.

## Checks

1. Open `https://<uat-host>/itms/ai/agents`. Plus and Close X are on the top bar. Share is absent.
2. A user with `chatHtmlAgent:execute` sees Agent HTML. A user without it does not.
3. From UAT iTMS, open a WCMS content item in Agent HTML. The canvas loads the page. Edit, then insert back. The parent TinyMCE receives `agent-html-apply`.
4. Direct check, while logged in, of `GET /itms/ai/api/wcms-content?wcmsContentId=<id>&pageIndex=0&lang=en`. It returns that page's HTML. Unauthenticated calls are rejected.
5. `GET /itms/ai/tinymce/tinymce.min.js` returns the script, not 404.
6. Agent Writing: the file list and the composer are both usable, and the right preview panel opens.
7. Plus starts a new conversation at `/itms/ai/`.
8. An Agent Survey reply includes the red accuracy line.
9. Container logs do not show `Cannot find module '/home/aiagent/vendor/answer-me-with-html/scripts/am.mjs'`.

## Rollback

```bash
docker stop aiagent
docker rm aiagent
docker run -d --name aiagent <same port, env, and volumes> aiagent:uat-previous
```

Or point compose back at the previous image and `docker compose up -d aiagent`.

The new `chats` columns can stay. They are nullable and the previous image ignores them. Working copies under `data/html-pages/` can stay. There is no down migration.

## Do not

- Do not replace the UAT `data/config.json` with a developer copy.
- Do not point `databases.agent` at `itmsdb` or `limesurveydb`.
- Do not delete the `0004` row from `ran_migrations` if it is already there.
- Do not mount a host `public/` over the image `public/` directory. TinyMCE lives in the image.
