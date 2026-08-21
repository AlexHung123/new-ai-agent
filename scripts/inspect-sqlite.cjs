const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite', { readonly: true });
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log('tables', tables.map((t) => t.name));
for (const t of tables) {
  const n = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(t.name, n.c);
}
if (tables.some((t) => t.name === 'chats')) {
  const sample = db.prepare('SELECT id, title, userId FROM chats LIMIT 3').all();
  console.log('chat sample', sample);
}
if (tables.some((t) => t.name === 'messages')) {
  const cols = db.prepare('PRAGMA table_info(messages)').all();
  console.log('messages cols', cols.map((c) => c.name));
}
if (tables.some((t) => t.name === 'sfc_question_m')) {
  const sample = db
    .prepare('SELECT id, year, questionNo FROM sfc_question_m LIMIT 2')
    .all();
  console.log('sfc sample', sample);
}
db.close();
