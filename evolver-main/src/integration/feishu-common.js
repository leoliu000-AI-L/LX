/**
 * PCEC Feishu 通用模块
 * 基于 feishu-skills 最佳实践
 * 提供 Token 管理、认证、API 请求等核心功能
 */

const fs = require('fs');
const path = require('path');

// 配置
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const TOKEN_CACHE_FILE = path.join(process.cwd(), 'memory/feishu_token.json');

/**
 * 带重试机制的 Fetch（指数退避）
 */
async function fetchWithRetry(url, options = {}, retries = 3) {
  const timeoutMs = options.timeout || 15000;

  for (let i = 0; i < retries; i++) {
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const fetchOptions = { ...options, signal: controller.signal };
      delete fetchOptions.timeout;

      const res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!res.ok) {
        // 速率限制 (429)
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          let waitMs = 1000 * Math.pow(2, i);
          if (retryAfter) waitMs = parseInt(retryAfter, 10) * 1000;
          console.warn(`[FeishuClient] Rate limited. Waiting ${waitMs}ms...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }

        // 不重试 4xx 错误（除了 429）
        if (res.status >= 400 && res.status < 500) {
          const errBody = await res.text();
          throw new Error(`HTTP ${res.status} [${url}]: ${errBody}`);
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} [${url}]`);
      }
      return res;
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      if (e.name === 'AbortError') e.message = `Timeout (${timeoutMs}ms) [${url}]`;

      // 永久错误不重试
      if (e.message.includes('HTTP 4') && !e.message.includes('429')) throw e;

      if (i === retries - 1) throw e;
      const delay = 1000 * Math.pow(2, i);
      console.warn(`[FeishuClient] Fetch failed (${e.message}) [${url}]. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * 获取 Tenant Access Token（带缓存）
 */
async function getToken(forceRefresh = false) {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('FEISHU_APP_ID and FEISHU_APP_SECRET must be set in environment variables');
  }

  const now = Math.floor(Date.now() / 1000);

  // 检查缓存
  if (!forceRefresh && fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'));
      if (cached.token && cached.expire > now + 60) {
        return cached.token;
      }
    } catch (e) {
      console.warn('[FeishuClient] Failed to read token cache:', e.message);
    }
  }

  // 获取新 Token
  try {
    const res = await fetchWithRetry('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    const data = await res.json();

    if (data.code !== 0) {
      throw new Error(`API Error: ${data.msg}`);
    }

    // 缓存 Token
    try {
      const cacheData = { token: data.tenant_access_token, expire: now + data.expire };
      const cacheDir = path.dirname(TOKEN_CACHE_FILE);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cacheData, null, 2));
    } catch (e) {
      console.warn('[FeishuClient] Failed to cache token:', e.message);
    }

    return data.tenant_access_token;
  } catch (e) {
    console.error('[FeishuClient] Failed to get token:', e.message);
    throw e;
  }
}

/**
 * 带认证的 Fetch（自动刷新 Token）
 */
async function fetchWithAuth(url, options = {}) {
  let token = await getToken();
  let headers = { ...options.headers, 'Authorization': `Bearer ${token}` };

  try {
    let res = await fetchWithRetry(url, { ...options, headers });

    // 处理 JSON 逻辑错误（200 OK 但 code != 0）
    const clone = res.clone();
    try {
      const data = await clone.json();
      // Token 无效的错误码: 99991663, 99991664, 99991661, 99991668
      if ([99991663, 99991664, 99991661, 99991668].includes(data.code)) {
        throw new Error('TokenExpired');
      }
    } catch (jsonErr) {
      if (jsonErr.message === 'TokenExpired') throw jsonErr;
    }

    return res;

  } catch (e) {
    if (e.message.includes('HTTP 401') || e.message === 'TokenExpired') {
      console.warn(`[FeishuClient] Token expired. Refreshing...`);
      token = await getToken(true);
      headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
      return await fetchWithRetry(url, { ...options, headers });
    }
    throw e;
  }
}

/**
 * 发送文本消息
 */
async function sendText(receive_id, text) {
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`;
  const body = {
    receive_id,
    msg_type: 'text',
    content: JSON.stringify({ text })
  };
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

/**
 * 发送富文本消息
 */
async function sendPost(receive_id, postContent) {
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`;
  const body = {
    receive_id,
    msg_type: 'post',
    content: JSON.stringify(postContent)
  };
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

/**
 * 发送卡片消息
 */
async function sendCard(receive_id, cardContent) {
  const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`;
  const body = {
    receive_id,
    msg_type: 'interactive',
    content: JSON.stringify(cardContent)
  };
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

/**
 * 敏感信息扫描
 */
function scanSecrets(text) {
  const patterns = [
    /FEISHU_APP_ID\s*[:=]\s*['"]?[\w-]+/gi,
    /FEISHU_APP_SECRET\s*[:=]\s*['"]?[\w-]+/gi,
    /token\s*[:=]\s*['"]?[\w.-]+/gi,
    /password\s*[:=]\s*['"]?[\w-]+/gi,
    /api[_-]?key\s*[:=]\s*['"]?[\w-]+/gi
  ];

  const found = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }

  return found;
}

/**
 * 安全发送消息（扫描敏感信息）
 */
async function sendTextSafe(receive_id, text) {
  const secrets = scanSecrets(text);
  if (secrets.length > 0) {
    throw new Error(`Message contains potential secrets: ${secrets.join(', ')}`);
  }
  return await sendText(receive_id, text);
}

module.exports = {
  getToken,
  fetchWithRetry,
  fetchWithAuth,
  sendText,
  sendPost,
  sendCard,
  sendTextSafe,
  scanSecrets
};
