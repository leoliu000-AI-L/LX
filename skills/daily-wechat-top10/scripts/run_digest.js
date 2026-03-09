const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');

const SKILL_DIR = '/root/.openclaw/workspace/skills/daily-wechat-top10';
const READER_DIR = '/root/.openclaw/workspace/wechat-article-reader';
const CHANNEL = '8455844508'; // Telegram channel

const accountsPath = path.join(SKILL_DIR, 'references/accounts.json');
const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8')).accounts;

function req(url, headers={}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0', ...headers } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d, url }));
    }).on('error', reject);
  });
}

function parseSearch(html, targetAccount) {
  const re = /<a target="_blank" href="([^"]+)" id="sogou_vr_11002601_title_\d+"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span class="all-time-y2">([\s\S]*?)<\/span><span class="s2"><script>document.write\(timeConvert\('(\d+)'\)\)<\/script><\/span>/g;
  let m;
  let best = null;
  while ((m = re.exec(html))) {
    const href = m[1].replace(/&amp;/g, '&');
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    const account = m[3].replace(/<[^>]+>/g, '').trim();
    const ts = +m[4];
    if (account.includes(targetAccount) || targetAccount.includes(account)) {
      if (!best || ts > best.ts) {
        best = { href, title, account, ts };
      }
    }
  }
  return best;
}

function extractMpFromBridge(html) {
  const lines = [...html.matchAll(/url \+= '([^']*)';/g)].map(m => m[1]);
  if (lines.length) { return lines.join('').replace(/@/g, ''); }
  const m = html.match(/https?:\/\/mp\.weixin\.qq\.com\/s\?[^'"\s<]+/);
  return m ? m[0] : null;
}

async function resolveLink(item, searchUrl, cookie) {
  let href = 'https://weixin.sogou.com' + item.href;
  const idx = href.indexOf('url=');
  if (idx < 0) return null;
  const b = 42;
  const h = href.substr(idx + 4 + 21 + b, 1);
  href += `&k=${b}&h=${h}`;
  const r = await req(href, { Referer: searchUrl, Cookie: cookie });
  if (r.status !== 200) return null;
  return extractMpFromBridge(r.body);
}

(async () => {
  let report = "## 📊 科技/AI 每日公众号 Top 10 精华\n\n";
  const dateStr = new Date().toISOString().slice(0, 10);
  report += `*日期：${dateStr}*\n\n`;

  for (const acc of accounts) {
    console.log(`Searching for: ${acc}...`);
    try {
      const searchUrl = 'https://weixin.sogou.com/weixin?type=2&ie=utf8&query=' + encodeURIComponent(acc);
      const r = await req(searchUrl);
      const cookie = (r.headers['set-cookie'] || []).map(x => x.split(';')[0]).join('; ');
      
      const item = parseSearch(r.body, acc);
      if (!item) {
        console.log(`  No recent article found for ${acc}`);
        continue;
      }

      // Check if it's within the last 24-48 hours roughly, skipping very old ones for a "daily" digest
      // const ageHours = (Date.now() / 1000 - item.ts) / 3600;
      // if (ageHours > 72) {
      //    console.log(`  Article too old (${Math.round(ageHours)}h) for ${acc}`);
      //    continue;
      // }

      const mpUrl = await resolveLink(item, searchUrl, cookie);
      if (!mpUrl) {
        console.log(`  Could not resolve direct link for ${acc}`);
        continue;
      }

      console.log(`  Found: ${item.title}`);
      
      // Extract content
      const cmd = `bash -c "source ${READER_DIR}/.venv/bin/activate && cd ${READER_DIR} && python scripts/read_wechat_cli.py '${mpUrl}' --no-browser"`;
      const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const result = JSON.parse(output);

      if (result.error) {
        console.log(`  Extraction failed: ${result.error}`);
        continue;
      }

      const content = (result.content_md || '').split('\n---\n').slice(1).join('\n---\n').trim();
      
      report += `### 🔹 ${acc}：[${result.title || item.title}](${mpUrl})\n\n`;
      report += `${content}\n\n---\n\n`;

    } catch (e) {
      console.error(`  Error processing ${acc}:`, e.message);
    }
    // Polite delay
    await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
  }

  // Save report
  const reportPath = `/tmp/wechat_top10_${Date.now()}.md`;
  fs.writeFileSync(reportPath, report);
  
  // Send via openclaw
  try {
    console.log('Sending report to Telegram...');
    execSync(`openclaw message send --channel telegram --target ${CHANNEL} --message "$(cat ${reportPath})"`);
  } catch (e) {
    console.error('Failed to send message:', e.message);
  }

})();
