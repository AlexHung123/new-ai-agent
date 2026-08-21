# 生產環境：SQLite → 獨立 PostgreSQL

適用情況：

- 生產還在用 `data/db.sqlite`
- **不用** itmsdb
- 用一個**新的、空的** PostgreSQL database 承載應用資料

LimeSurvey / ITMS 連線不要改（問卷分析、權限仍讀那些庫）。

---

## 會搬什麼

| 來源 | 目標表 | 說明 |
|------|--------|------|
| `data/db.sqlite` → `chats` | `chats` | 對話列表 |
| `data/db.sqlite` → `messages` | `messages` | 訊息與 sources |
| `data/db.sqlite` → `sfc_question_m` | `sfc_question_m` | SFC 題目對應 |
| （無） | `pi_sessions` | 新表；舊 Kode `agents.db` **不搬** |

搬法：新 image 第一次連上**空的新庫**時，啟動會自動讀 volume 裡的 `data/db.sqlite` 並 INSERT。  
生產 container 裡沒有 `npm run db:migrate`，靠啟動時的 instrumentation。

只在目標庫 `chats` / `sfc_question_m` 為空時匯入，避免覆蓋。

---

## 0. 維護窗前

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

---

## 1. 停機

```bash
docker compose stop aiagent
```

---

## 2. 備份並記錄 SQLite 筆數

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

把三個數字記在這裡，匯入後要對得上：

| 表 | SQLite 筆數 |
|----|-------------|
| chats | |
| messages | |
| sfc_question_m | |

---

## 3. 只改應用庫連線

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

---

## 4. 換成新 image 並啟動

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

---

## 5. 核對後再開流量

在新庫：

```sql
SELECT 'chats' AS t, COUNT(*) FROM chats
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'sfc_question_m', COUNT(*) FROM sfc_question_m;
```

手動驗：

1. 開一條**舊**對話，歷史還在
2. 再發一則，重整後還在
3. SFC 問一句會出文件連結的

沒問題再開給使用者。`db.sqlite.bak.*` 先留著。

---

## 回滾

換回舊 image，volume 裡的 `db.sqlite` 不要動。

這次已經寫進 Postgres 的新訊息**不會**自動回到 sqlite（沒有反向匯出）。

---

## 不要做

- 不要把 `databases.agent` 設成 itmsdb / limesurvey
- 不要在新庫已有 `chats` 之後指望再自動匯入
- 不要在確認穩定前刪 `db.sqlite`
- 不要期待舊 Kode `data/agents.db` 會搬進 `pi_sessions`

預估維護窗：**1–3 分鐘**（停機 + 匯入 + 抽查）。
