---
name: qr-code-generator
description: Generate QR codes from text or URLs. Use when you need to create QR codes for links, text, or contact information, supporting PNG output and terminal display.
---
# QR Code Generator Skill

Generates QR codes from any text content:
- PNG image file output
- Terminal ASCII art display
- Supports URLs, text, contact info, Wi-Fi credentials, etc.

## Usage
```javascript
const qrGenerator = require('./skills/qr-code-generator');
const result = await qrGenerator.generate('https://example.com', { output: 'terminal' });
console.log(result.terminal);
```

## CLI
```bash
node skills/qr-code-generator/index.js <content> [--output terminal|png] [--file <output-path.png>]
```
