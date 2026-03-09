const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.error('Usage: node ingest.js <url1> [url2] ...');
  process.exit(1);
}

const readerDir = '/root/.openclaw/workspace/wechat-article-reader';
const memPath = '/root/.openclaw/workspace/memory-like-a-tree/data/memory.jsonl';

// Helper to extract a snippet for memory
function pickSnippet(md) {
  const body = md.split('\n---\n').slice(1).join('\n---\n') || md;
  return body.replace(/\s+/g, ' ').trim().slice(0, 220);
}

// Ensure memory file exists and read existing IDs
let existingIds = new Set();
if (fs.existsSync(memPath)) {
  const existing = fs.readFileSync(memPath, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(l => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
  existingIds = new Set(existing.map(x => x.id));
}

let addedCount = 0;

for (const url of urls) {
  if (!url.startsWith('https://mp.weixin.qq.com/s/')) {
    console.warn(`Skipping invalid URL: ${url}`);
    continue;
  }

  console.log(`Processing: ${url}`);

  try {
    // Run the Python extraction tool
    const cmd = `bash -c "source ${readerDir}/.venv/bin/activate && cd ${readerDir} && python scripts/read_wechat_cli.py '${url}' --no-browser"`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    
    const result = JSON.parse(output);

    if (result.error) {
      console.error(`Extraction failed for ${url}: ${result.error} - ${result.message}`);
      continue;
    }

    // Generate a unique ID
    // Create a hash-like ID from the URL suffix
    const urlSuffix = url.split('/s/')[1]?.split('?')[0] || Date.now().toString();
    const id = `wx_${urlSuffix}`;

    if (existingIds.has(id)) {
      console.log(`Article already exists in memory: ${id}`);
      continue;
    }

    // Format for memory-like-a-tree
    const text = `${result.title}\n${pickSnippet(result.content_md)}`;
    
    const entry = {
      id,
      text,
      priority: 'P2',
      tags: ['wechat', 'article'],
      created_at: new Date().toISOString(),
      source: {
        url: result.source_url,
        author: result.author,
        pub_time: result.pub_time,
        strategy: result.strategy
      }
    };

    fs.appendFileSync(memPath, JSON.stringify(entry) + '\n');
    addedCount++;
    console.log(`Successfully ingested: ${result.title}`);

  } catch (err) {
    console.error(`Failed to process ${url}:`, err.message);
  }
}

// Re-index if anything was added
if (addedCount > 0) {
  console.log('Re-indexing memory-like-a-tree...');
  try {
    execSync('cd /root/.openclaw/workspace/memory-like-a-tree && node core/indexer.js --workspace default', { stdio: 'inherit' });
  } catch(e) {
    console.error('Failed to trigger indexer:', e.message);
  }
}

console.log(`Done. Added ${addedCount} articles to memory.`);
