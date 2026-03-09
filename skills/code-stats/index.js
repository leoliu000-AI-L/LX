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

const LANGUAGE_EXTENSIONS = {
  javascript: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  python: ['.py', '.pyc', '.pyo'],
  java: ['.java', '.class', '.jar'],
  rust: ['.rs', '.rlib'],
  go: ['.go'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.sass', '.less'],
  markdown: ['.md', '.markdown'],
  json: ['.json'],
  yaml: ['.yaml', '.yml'],
  shell: ['.sh', '.bash', '.zsh'],
  docker: ['Dockerfile', '.dockerfile']
};

async function analyze(repoPath, options = {}) {
  const {
    ignore = [],
    verbose = false,
    dryRun = false
  } = options;

  const fullIgnore = [...DEFAULT_IGNORE, ...ignore];
  const files = await glob('**/*', {
    cwd: repoPath,
    ignore: fullIgnore,
    nodir: true,
    dot: true
  });

  if (dryRun) {
    return {
      dryRun: true,
      filesFound: files.length,
      message: `Would analyze ${files.length} files in ${repoPath}`
    };
  }

  const stats = {
    totalFiles: files.length,
    byExtension: {},
    byLanguage: {},
    totalLines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0,
    files: []
  };

  for (const file of files) {
    const filePath = path.join(repoPath, file);
    const ext = path.extname(file).toLowerCase() || path.basename(file).toLowerCase();
    
    // Count by extension
    stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

    // Map to language
    for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
      if (exts.includes(ext) || exts.includes(file)) {
        stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;
        break;
      }
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      let fileCode = 0, fileComments = 0, fileBlanks = 0;
      let inMultiLineComment = false;

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed) {
          fileBlanks++;
          continue;
        }

        if (inMultiLineComment) {
          fileComments++;
          if (trimmed.includes('*/')) {
            inMultiLineComment = false;
          }
          continue;
        }

        if (trimmed.startsWith('/*')) {
          fileComments++;
          inMultiLineComment = !trimmed.includes('*/');
          continue;
        }

        if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
          fileComments++;
          continue;
        }

        fileCode++;
      }

      stats.totalLines += lines.length;
      stats.codeLines += fileCode;
      stats.commentLines += fileComments;
      stats.blankLines += fileBlanks;

      if (verbose) {
        stats.files.push({
          path: file,
          lines: lines.length,
          code: fileCode,
          comments: fileComments,
          blanks: fileBlanks
        });
      }
    } catch (e) {
      // Skip binary/unreadable files
      if (verbose) {
        stats.files.push({
          path: file,
          error: e.message
        });
      }
    }
  }

  // Generate summary
  stats.summary = [
    `📊 Code Statistics for ${repoPath}`,
    ``,
    `Total files: ${stats.totalFiles}`,
    `Total lines: ${stats.totalLines.toLocaleString()}`,
    `  Code: ${stats.codeLines.toLocaleString()} (${Math.round(stats.codeLines / stats.totalLines * 100)}%)`,
    `  Comments: ${stats.commentLines.toLocaleString()} (${Math.round(stats.commentLines / stats.totalLines * 100)}%)`,
    `  Blanks: ${stats.blankLines.toLocaleString()} (${Math.round(stats.blankLines / stats.totalLines * 100)}%)`,
    ``,
    `By language:`,
    ...Object.entries(stats.byLanguage)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => `  ${lang}: ${count} files`),
    ``,
    `Top extensions:`,
    ...Object.entries(stats.byExtension)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ext, count]) => `  ${ext}: ${count} files`)
  ].join('\n');

  return stats;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || '.';
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');

  analyze(path.resolve(targetPath), { verbose, dryRun })
    .then(stats => {
      console.log(stats.summary || stats.message);
      if (verbose && stats.files) {
        console.log('\n📁 File breakdown:');
        stats.files.forEach(f => {
          if (f.error) {
            console.log(`  ❌ ${f.path}: ${f.error}`);
          } else {
            console.log(`  ✅ ${f.path}: ${f.lines} lines (${f.code} code, ${f.comments} comments, ${f.blanks} blanks)`);
          }
        });
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error analyzing codebase:', err.message);
      process.exit(1);
    });
}

module.exports = { analyze };
