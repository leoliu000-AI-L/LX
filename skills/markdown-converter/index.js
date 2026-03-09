const fs = require('fs/promises');
const path = require('path');
const { marked } = require('marked');

async function toHtml(markdown, options = {}) {
  const {
    title = 'Markdown Document',
    includeStyle = true,
    template = null
  } = options;

  const htmlContent = marked(markdown);
  
  if (template) {
    return template.replace('{{content}}', htmlContent).replace('{{title}}', title);
  }

  if (includeStyle) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2rem; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    h3 { font-size: 1.25rem; }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 1rem;
      overflow-x: auto;
    }
    code {
      background-color: rgba(175, 184, 193, 0.2);
      border-radius: 3px;
      padding: .2em .4em;
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      margin: 0;
      padding: 0 1em;
      color: #6a737d;
      border-left: .25em solid #dfe2e5;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: .6em 1em;
    }
    table tr {
      background-color: #fff;
      border-top: 1px solid #c6cbd1;
    }
    table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  }

  return htmlContent;
}

async function toText(markdown) {
  // Simple markdown to text conversion
  return markdown
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/`{3}[\s\S]*?`{3}/g, match => match.replace(/`{3}/g, '')) // Remove code blocks fences
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/^\s*[-+*]\s+/gm, '• ') // Convert lists to bullets
    .replace(/^\s*\d+\.\s+/gm, match => match) // Keep numbered lists
    .replace(/<[^>]*>/g, ''); // Remove any HTML tags
}

async function convertFile(inputPath, outputFormat = 'html', outputPath = null) {
  const content = await fs.readFile(inputPath, 'utf8');
  let result;

  if (outputFormat === 'html') {
    const title = path.basename(inputPath, path.extname(inputPath));
    result = await toHtml(content, { title });
  } else if (outputFormat === 'text') {
    result = await toText(content);
  } else {
    throw new Error(`Unsupported output format: ${outputFormat}`);
  }

  if (outputPath) {
    await fs.writeFile(outputPath, result);
  }

  return {
    content: result,
    format: outputFormat,
    inputPath,
    outputPath
  };
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputFormat = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'html';
  const outputPath = args.includes('--outfile') ? args[args.indexOf('--outfile') + 1] : null;
  const dryRun = args.includes('--dry-run');

  if (!inputPath) {
    console.error('Usage: node skills/markdown-converter/index.js <input.md> [--output html|text] [--outfile <output-file>] [--dry-run]');
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Would convert ${inputPath} to ${outputFormat} format${outputPath ? `, saving to ${outputPath}` : ''}`);
    process.exit(0);
  }

  convertFile(inputPath, outputFormat, outputPath)
    .then(result => {
      if (result.outputPath) {
        console.log(`✅ Conversion complete! Saved to: ${result.outputPath}`);
      } else {
        console.log(result.content);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Conversion failed:', err.message);
      process.exit(1);
    });
}

module.exports = { toHtml, toText, convertFile };
