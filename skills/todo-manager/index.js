const fs = require('fs/promises');
const path = require('path');
const { glob } = require('glob');

const DEFAULT_IGNORE = [
  '**/.git/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.min.js',
  '**/*.bundle.js',
  '**/package-lock.json',
  '**/yarn.lock'
];

const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME|BUG|NOTE|OPTIMIZE|HACK):?\s*(.*)/i,
  /#\s*(TODO|FIXME|BUG|NOTE|OPTIMIZE|HACK):?\s*(.*)/i,
  /\/\*\s*(TODO|FIXME|BUG|NOTE|OPTIMIZE|HACK):?\s*(.*?)\s*\*\//is,
  /<!--\s*(TODO|FIXME|BUG|NOTE|OPTIMIZE|HACK):?\s*(.*?)\s*-->/is
];

const METADATA_PATTERNS = {
  author: /@(\w+)\b/g,
  date: /@(\d{4}-\d{2}-\d{2})\b/g,
  priority: /!(high|medium|low)\b/i
};

async function scan(repoPath, options = {}) {
  const {
    ignore = [],
    verbose = false,
    dryRun = false
  } = options;

  const fullIgnore = [...DEFAULT_IGNORE, ...ignore];
  const files = await glob('**/*.{js,ts,jsx,tsx,py,go,rs,java,sh,bash,zsh,md,html,css,scss}', {
    cwd: repoPath,
    ignore: fullIgnore,
    nodir: true,
    dot: true
  });

  if (dryRun) {
    return {
      dryRun: true,
      filesFound: files.length,
      message: `Would scan ${files.length} files for TODOs in ${repoPath}`
    };
  }

  const stats = {
    totalFiles: files.length,
    todos: [],
    byType: {},
    byPriority: { high: 0, medium: 0, low: 0, unknown: 0 },
    byAuthor: {}
  };

  for (const file of files) {
    const filePath = path.join(repoPath, file);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of TODO_PATTERNS) {
          const match = line.match(pattern);
          if (match) {
            const type = match[1].toUpperCase();
            let description = match[2].trim();
            
            // Parse metadata
            const metadata = {
              type,
              file,
              line: i + 1,
              author: null,
              date: null,
              priority: 'unknown'
            };

            // Extract author
            const authorMatch = description.match(METADATA_PATTERNS.author);
            if (authorMatch) {
              metadata.author = authorMatch[0].substring(1);
              description = description.replace(METADATA_PATTERNS.author, '').trim();
            }

            // Extract date
            const dateMatch = description.match(METADATA_PATTERNS.date);
            if (dateMatch) {
              metadata.date = dateMatch[0].substring(1);
              description = description.replace(METADATA_PATTERNS.date, '').trim();
            }

            // Extract priority
            const priorityMatch = description.match(METADATA_PATTERNS.priority);
            if (priorityMatch) {
              metadata.priority = priorityMatch[1].toLowerCase();
              description = description.replace(METADATA_PATTERNS.priority, '').trim();
            }

            metadata.description = description;

            // Add to stats
            stats.todos.push(metadata);
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            stats.byPriority[metadata.priority] = (stats.byPriority[metadata.priority] || 0) + 1;
            
            if (metadata.author) {
              stats.byAuthor[metadata.author] = (stats.byAuthor[metadata.author] || 0) + 1;
            }

            break;
          }
        }
      }
    } catch (e) {
      // Skip binary/unreadable files
    }
  }

  // Generate summary
  stats.summary = [
    `✅ Todo Scan Results for ${repoPath}`,
    ``,
    `Total files scanned: ${stats.totalFiles}`,
    `Total TODOs found: ${stats.todos.length}`,
    ``,
    `By type:`,
    ...Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `  ${type}: ${count}`),
    ``,
    `By priority:`,
    ...Object.entries(stats.byPriority)
      .filter(([_, count]) => count > 0)
      .map(([priority, count]) => `  ${priority}: ${count}`),
    ``,
    ...(Object.keys(stats.byAuthor).length > 0 ? [
      `By author:`,
      ...Object.entries(stats.byAuthor)
        .sort((a, b) => b[1] - a[1])
        .map(([author, count]) => `  @${author}: ${count}`),
      ``
    ] : []),
    `High priority tasks:`,
    ...stats.todos
      .filter(t => t.priority === 'high')
      .map(t => `  🚨 ${t.description} (${t.file}:${t.line}${t.author ? ` @${t.author}` : ''})`),
    ...(stats.todos.filter(t => t.priority === 'high').length === 0 ? ['  None'] : []),
    ``,
    `Recent tasks:`,
    ...stats.todos
      .filter(t => t.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(t => `  📅 ${t.date}: ${t.description} (${t.file}:${t.line})`)
  ].join('\n');

  return stats;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || '.';
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');
  const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

  scan(path.resolve(targetPath), { verbose, dryRun })
    .then(async stats => {
      console.log(stats.summary || stats.message);
      
      if (verbose && stats.todos) {
        console.log('\n📋 Full TODO list:');
        stats.todos.forEach(t => {
          const priorityIcon = t.priority === 'high' ? '🚨' : t.priority === 'medium' ? '⚠️' : 'ℹ️';
          console.log(`  ${priorityIcon} ${t.type}: ${t.description}`);
          console.log(`     Location: ${t.file}:${t.line}`);
          if (t.author) console.log(`     Author: @${t.author}`);
          if (t.date) console.log(`     Date: ${t.date}`);
          console.log();
        });
      }

      if (outputFile && stats.todos) {
        await fs.writeFile(outputFile, JSON.stringify(stats, null, 2));
        console.log(`\n💾 Results saved to: ${outputFile}`);
      }

      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error scanning for TODOs:', err.message);
      process.exit(1);
    });
}

module.exports = { scan };
