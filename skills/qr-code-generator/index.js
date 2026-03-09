const QRCode = require('qrcode');

async function generate(content, options = {}) {
  const {
    output = 'terminal',
    file = null,
    dryRun = false
  } = options;

  if (!content) {
    throw new Error('Content is required to generate QR code');
  }

  if (dryRun) {
    return {
      dryRun: true,
      message: `Would generate QR code for content: "${content}" with output: ${output}${file ? `, file: ${file}` : ''}`
    };
  }

  const result = {
    content,
    output,
    success: true
  };

  if (output === 'terminal') {
    result.terminal = await QRCode.toString(content, { type: 'terminal', small: true });
  } else if (output === 'png' && file) {
    await QRCode.toFile(file, content);
    result.file = file;
  } else if (output === 'png') {
    result.buffer = await QRCode.toBuffer(content);
  } else if (output === 'dataurl') {
    result.dataUrl = await QRCode.toDataURL(content);
  } else {
    throw new Error(`Unsupported output type: ${output}. Use 'terminal', 'png', or 'dataurl'`);
  }

  return result;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const content = args[0];
  const output = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'terminal';
  const file = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
  const dryRun = args.includes('--dry-run');

  if (!content) {
    console.error('Usage: node skills/qr-code-generator/index.js <content> [--output terminal|png|dataurl] [--file <output-path.png>] [--dry-run]');
    process.exit(1);
  }

  generate(content, { output, file, dryRun })
    .then(result => {
      if (result.dryRun) {
        console.log(result.message);
      } else if (result.terminal) {
        console.log(result.terminal);
      } else if (result.file) {
        console.log(`✅ QR code saved to: ${result.file}`);
      } else if (result.dataUrl) {
        console.log(`✅ Data URL: ${result.dataUrl}`);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error generating QR code:', err.message);
      process.exit(1);
    });
}

module.exports = { generate };
