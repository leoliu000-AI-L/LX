const fs = require('fs');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node parser.js <input-json-file>');
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let report = "## 每日 Twitter 精华\\n\\n";

// Format Trends
report += "### 📈 今日热点\\n";
const trends = rawData.trends.aria.children
  .find(c => c.role === 'region' && c.name === 'Timeline: Trending now')?.children
  .filter(c => c.role === 'listitem')
  .slice(0, 10)
  .map((item, i) => {
    const trendName = item.children.find(c => c.role === 'link')?.name;
    return `${i + 1}. ${trendName || 'N/A'}`;
  });
report += trends.join('\\n') + "\\n\\n";

// Format Tweets
report += "### 👤 重点关注\\n";
for (const [account, data] of Object.entries(rawData.tweets)) {
  report += `#### @${account}\\n`;
  const tweets = data.aria.children
    .find(c => c.role === 'region' && c.name === 'Timeline: Conversation')
    ?.children.filter(c => c.role === 'article')
    .slice(0, 3)
    .map(article => {
      const text = article.children.find(c => c.role === 'text')?.name || '[无法提取内容]';
      return `- ${text.replace(/\\n/g, ' ')}`;
    });
  if (tweets && tweets.length > 0) {
    report += tweets.join('\\n') + "\\n\\n";
  } else {
    report += "_无法提取到最新推文。_\\n\\n";
  }
}

console.log(report);
