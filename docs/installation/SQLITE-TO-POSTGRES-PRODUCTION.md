# 生產環境：應用庫遷到獨立 PostgreSQL

LimeSurvey / ITMS 連線不要改（問卷分析、權限仍讀那些庫）。  
應用庫（`databases.agent` / `DATABASE_URL`）不要用 `itmsdb`、不要用 `limesurveydb`。

上生產前先決定**要搬哪一份資料**。自動 sqlite 匯入只在目標庫 `chats` / `sfc_question_m` 為空時才跑，避免覆蓋。

---

## 先選資料來源

| 情況 | 生產要的資料 | 做法 |
|------|----------------|------|
| **A** | 這份 `data/db.sqlite` | 建**空的**新庫，掛上 sqlite，啟動時自動 INSERT（下方步驟 0–5） |
| **B** | 現有應用 PostgreSQL（比 sqlite 新） | `pg_dump` / `pg_restore` 到生產空庫，**不要**再跑 sqlite 匯入 |

對筆數：

```bash
node scripts/inspect-sqlite.cjs
node scripts/verify-pg.cjs
```

`verify-pg.cjs` 連線順序：`DATABASE_URL` → `data/config.json` 的 `databases.agent` → `databases.secondary`。

### 本機盤點（2026-08-24）

| 來源 | chats | messages | sfc_question_m | 其他 |
|------|------:|---------:|---------------:|------|
| `data/db.sqlite` | 251 | 1819 | 1033 | 無 `user_files` / `pi_sessions` / `documentId` |
| `itmsagentdb`（`192.168.56.150`，`config.json` 的 `databases.agent`） | 278 | 1932 | 1033 | `pi_sessions` 27 筆 |

當時 PG 已比 sqlite 多 27 條 chat、113 則 message。若生產要最新對話，走 **情況 B**，不要把 sqlite 蓋過去。上線前再跑一次兩個 inspect 腳本，數字會變。

SQLite 表結構（當日）：`chats`（id, title, createdAt, focusMode, files, userId）、`messages`（id, type, chatId, createdAt, messageId, content, sources, userId）、`sfc_question_m`（id, year, answerNo, questionNo, enLink, tcLink）。沒有 `user_files`。

---

## 會搬什麼

| 來源 | 目標表 | 說明 |
|------|--------|------|
| `data/db.sqlite` → `chats` | `chats` | 對話列表；sqlite 沒有 `documentId`，匯入後為 NULL |
| `data/db.sqlite` → `messages` | `messages` | 訊息與 sources |
| `data/db.sqlite` → `sfc_question_m` | `sfc_question_m` | SFC 題目對照 |
| （無） | `pi_sessions` | 新表；舊 Kode `agents.db` **不搬**；sqlite 裡也沒有 |
| （無） | `user_files` | sqlite 沒這張表；寫作附件在檔案系統 |

**不在 DB 裡、要跟 volume 一起帶：**

- `data/config.json`
- `data/documents/`
- `data/prompts/`
- `data/writing-attachments/`

情況 A 搬法：新 image 第一次連上**空的新庫**時，啟動會自動讀 volume 裡的 `data/db.sqlite` 並 INSERT。  
生產 container 裡沒有 `npm run db:migrate`，靠啟動時的 instrumentation（`src/lib/db/migrate.ts` → `importSqliteIfNeeded`）。

本機若已能連到空的目標庫，也可手動：

```bash
npm run db:migrate
# 或只匯入（表必須已存在，且 chats / sfc 為空）
npm run db:import-sqlite
```

---

## 情況 A：空庫自動匯入 sqlite

適用：

- 生產還在用 `data/db.sqlite`
- **不用** itmsdb
- 用一個**新的、空的** PostgreSQL database 承載應用資料

### 0. 維護窗前

- [ ] 已建好含 Postgres 程式的新 image（含 `drizzle/pg/0000_init.sql`）
- [ ] 正式 Postgres 已建好**空庫**
- [ ] 知道 data volume 路徑（compose 裡掛到 `/home/aiagent/data` 的那份）
- [ ] 準備好新庫連線字串

在正式 Postgres：

```sql
CREATE DATABASE aiagent;
CREATE USER aiagent WITH PASSWORD '<強密碼>';
GRANT ALL PRIVILEGES ON DATABASE aiagent TO aiagent;
```

```sql
\c aiagent
GRANT ALL ON SCHEMA public TO aiagent;
ALTER SCHEMA public OWNER TO aiagent;
```

連線字串範例：

```text
postgresql://aiagent:<密碼>@<正式PG主機>:5432/aiagent
```

不要用 `itmsdb`、不要用 `limesurveydb`。

### 1. 停機

```bash
docker compose stop aiagent
```

### 2. 備份並記錄 SQLite 筆數

在 **data volume 所在機器**：

```bash
cp /path/to/data/db.sqlite /path/to/data/db.sqlite.bak.$(date +%Y%m%d%H%M)
```

```bash
sqlite3 /path/to/data/db.sqlite "
SELECT 'chats', COUNT(*) FROM chats
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'sfc', COUNT(*) FROM sfc_question_m;
"
```

或：

```bash
node scripts/inspect-sqlite.cjs
```

把三個數字記在這裡，匯入後要對得上：

| 表 | SQLite 筆數 |
|----|-------------|
| chats | |
| messages | |
| sfc_question_m | |

2026-08-24 本機參考：chats 251、messages 1819、sfc_question_m 1033。

### 3. 只改應用庫連線

改 **volume 上的** `data/config.json`（容器掛載進去的那份）：

```json
"databases": {
  "limesurvey": {
    "connectionString": "<維持原樣，不要改>"
  },
  "secondary": {
    "connectionString": "<維持原樣，不要改>"
  },
  "agent": {
    "connectionString": "postgresql://aiagent:<密碼>@<正式PG主機>:5432/aiagent"
  }
}
```

或在 compose 設環境變數（優先級更高，會蓋過 config）：

```yaml
environment:
  - DATABASE_URL=postgresql://aiagent:<密碼>@<正式PG主機>:5432/aiagent
```

檢查：

- [ ] `data/db.sqlite` 還在同一個 data 目錄（**不要刪、不要搬走**）
- [ ] 新庫是空的
- [ ] `databases.agent` / `DATABASE_URL` 不是 itmsdb、不是 limesurvey

### 4. 換成新 image 並啟動

```bash
docker compose up -d aiagent
docker compose logs -f aiagent
```

成功 log：

```text
Running database migrations...
Applied migration: 0000_init.sql
SQLite import chats=??? messages=??? sfc=???
Database migrations completed successfully
```

三個數字必須對上第 2 步的 SQLite 筆數。

| 看到的 log | 處理 |
|------------|------|
| `SQLite import skipped (no data/db.sqlite)` | volume 沒掛到 sqlite，停機補檔再開 |
| `Failed to run database migrations` | 連線或權限問題，**不要放流量** |
| import 的 chats/messages/sfc 都是 0，但 sqlite 明明有資料 | 新庫可能已經不空，或指錯庫 |

### 5. 核對後再開流量

在新庫：

```sql
SELECT 'chats' AS t, COUNT(*) FROM chats
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'sfc_question_m', COUNT(*) FROM sfc_question_m;
```

或：

```bash
node scripts/verify-pg.cjs
```

手動驗：

1. 開一條**舊**對話，歷史還在
2. 再發一則，重整後還在
3. SFC 問一句會出文件連結的

沒問題再開給使用者。`db.sqlite.bak.*` 先留著。

預估維護窗：**1–3 分鐘**（停機 + 匯入 + 抽查）。

---

## 情況 B：從現有應用 PostgreSQL dump

適用：生產要的是**已經在跑的** `databases.agent` 庫（例如本機 `itmsagentdb`），不是 sqlite。

目標必須是空庫（或先 drop 再建）。來源與目標都不要用 itmsdb / limesurvey。

```bash
pg_dump -h <來源主機> -U <應用用戶> -d <應用庫名> -Fc -f itmsagentdb.dump
pg_restore -h <正式PG> -U aiagent -d aiagent --no-owner --no-acl itmsagentdb.dump
```

然後把生產 `databases.agent`（或 `DATABASE_URL`）指到新庫。

這條路**不要**再跑 sqlite import。若目標已有 `chats`，啟動時的自動匯入會被跳過。

核對筆數必須對上 **dump 當下的來源 PG**，不是 sqlite。dump 前再跑一次 `node scripts/verify-pg.cjs`。

檔案 volume（`config.json`、`documents/`、`prompts/`、`writing-attachments/`）仍要一起帶到生產。

---

## 回滾

情況 A：換回舊 image，volume 裡的 `db.sqlite` 不要動。  
這次已經寫進 Postgres 的新訊息**不會**自動回到 sqlite（沒有反向匯出）。

情況 B：把 `databases.agent` / `DATABASE_URL` 指回 dump 前的庫，或 restore 另一份 dump。

---

## 不要做

- 不要把 `databases.agent` 設成 itmsdb / limesurvey
- 不要在新庫已有 `chats` 之後指望再自動匯入 sqlite
- 不要在確認穩定前刪 `db.sqlite`
- 不要期待舊 Kode `data/agents.db` 會搬進 `pi_sessions`
- 不要在 PG 已經比 sqlite 新時，把 sqlite 當最新來源蓋過去
