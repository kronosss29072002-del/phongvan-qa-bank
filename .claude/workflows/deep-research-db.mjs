export const meta = {
  name: 'deep-research-db-internals',
  description: 'Research PostgreSQL internals facts + real benchmarks for DB blog series',
  phases: [
    { title: 'WAL', detail: 'fan-out WAL internals + fsync' },
    { title: 'Isolation', detail: 'fan-out isolation levels + anomalies' },
    { title: 'Synthesize', detail: 'merge + cite' },
  ],
};

// Searcher góc độ — dùng WebSearch để lấy source + số liệu thực
async function searchAngle(prompt) {
  // @ts-ignore - chạy trong workflow runtime có WebSearch/WebFetch
  const { WebSearch } = globalThis;
  const res = await WebSearch(prompt);
  return res;
}

async function phase(title, prompts) {
  console.log(`### ${title}`);
  const out = [];
  for (const p of prompts) {
    const r = await searchAngle(p);
    out.push({ q: p, raw: r });
  }
  return out;
}

export async function run() {
  // Góc độ 1: WAL + fsync latency
  const wal = await phase('WAL & fsync', [
    'PostgreSQL WAL write-ahead logging how it works wal_buffers 16MB segment COMMIT only fsync WAL not data file',
    'PostgreSQL synchronous_commit on off remote_apply difference latency commit throughput',
    'fsync latency SSD NVMe milliseconds benchmark postgres commit group commit commit_delay commit_siblings',
    'PostgreSQL group commit how it reduces fsync overhead wal_sync_method fdatasync fsync open_sync',
  ]);

  // Góc độ 2: MVCC / rollback
  const mvcc = await phase('MVCC & rollback', [
    'PostgreSQL MVCC no undo log update creates new tuple xmin xmax rollback visibility old version',
    'PostgreSQL InnoDB undo log difference MySQL rollback mechanism comparison',
    'PostgreSQL dead tuples vacuum bloat txid wraparound autovacuum',
  ]);

  // Góc độ 3: Isolation levels
  const iso = await phase('Isolation levels', [
    'PostgreSQL isolation levels READ COMMITTED REPEATABLE READ SERIALIZABLE anomalies dirty read non-repeatable phantom write-skew',
    'PostgreSQL does not have true READ UNCOMMITTED degrades to READ COMMITTED',
    'PostgreSQL Serializable Snapshot Isolation SSI predicate locks SIReadLock theory',
    'PostgreSQL write-skew NOT prevented by REPEATABLE READ only SERIALIZABLE serialization failure 40001 retry',
  ]);

  // Góc độ 4: Lost update / benchmarks thực tế
  const bench = await phase('Benchmarks real numbers', [
    'postgres fsync latency p50 p99 benchmark nvme ssd commit per second 2023 2024',
    'PostgreSQL COMMIT throughput synchronous_commit off improvement factor real measurement',
    'lost update SELECT FOR UPDATE fix postgres concurrent counter example',
  ]);

  // Góc độ 5: Source authority
  const src = await phase('Primary sources', [
    'PostgreSQL official documentation chapter 13 Reliability Durability WAL chapter 28 monitoring chapter 29 streaming replication',
    'Designing Data-Intensive Applications Martin Kleppmann chapter 7 transactions isolation levels summary',
    'PostgreSQL WAL documentation official docs wal_writer_delay wal_buffers default values',
  ]);

  return { wal, mvcc, iso, bench, src };
}
