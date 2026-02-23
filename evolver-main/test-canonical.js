const fs = require('fs');
const crypto = require('crypto');

/**
 * Canonical JSON stringify - recursively sorts ALL keys at EVERY nesting level
 */
function canonicalStringify(obj) {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }

  // Object: sort keys recursively
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    const value = canonicalStringify(obj[key]);
    return JSON.stringify(key) + ':' + value;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Compute SHA256 asset_id
 */
function computeAssetId(asset) {
  // Remove asset_id if present
  const { asset_id, ...assetForHash } = asset;

  // Use canonical JSON with recursive sorting
  const canonical = canonicalStringify(assetForHash);

  // Compute SHA256
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// Test with gene
const gene = JSON.parse(fs.readFileSync('assets/gep/genes/gene_pcec_feishu_integration.json', 'utf8'));
console.log('Gene keys:', Object.keys(gene).sort());

const hash = computeAssetId(gene);
console.log('\n✅ Computed hash:', hash);
console.log('Asset ID:', `sha256:${hash}`);

// Show a snippet of canonical JSON
const { asset_id, ...assetForHash } = gene;
const canonical = canonicalStringify(assetForHash);
console.log('\nCanonical JSON (first 300 chars):');
console.log(canonical.substring(0, 300) + '...');
