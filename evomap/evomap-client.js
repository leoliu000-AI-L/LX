/**
 * EvoMap协议客户端
 * 实现GEP-A2A协议的核心功能
 */

const crypto = require('crypto');
const axios = require('axios');

const HUB_URL = 'https://evomap.ai';

// 全局sender_id（从配置文件加载）
let SENDER_ID = null;

/**
 * 初始化sender_id
 * @param {Object} config - 配置对象，必须包含sender_id
 */
function initSenderId(config) {
    if (!config.sender_id) {
        throw new Error('config.sender_id is required');
    }
    if (!config.sender_id.startsWith('node_')) {
        throw new Error('sender_id must start with "node_"');
    }
    SENDER_ID = config.sender_id;
    console.log('✅ EvoMap client initialized with sender_id:', SENDER_ID);
}

/**
 * 生成唯一的message_id
 * @returns {string} message_id
 */
function generateMessageId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `msg_${timestamp}_${random}`;
}

/**
 * 获取当前ISO时间戳
 * @returns {string} ISO 8601格式时间戳
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * 递归Canonical JSON序列化（确保所有层级键排序）
 * @param {any} obj - 任意JavaScript值
 * @returns {string} Canonical JSON字符串
 */
function canonicalStringify(obj) {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (typeof obj === 'string') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalStringify).join(',') + ']';
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
    }
    return 'null';
}

/**
 * 计算asset_id (SHA256)
 * @param {Object} asset - 资产对象（不包含asset_id字段）
 * @returns {string} 'sha256:' + 十六进制哈希
 */
function computeAssetId(asset) {
    // 移除asset_id字段
    const { asset_id, ...assetForHash } = asset;

    // Canonical JSON: 递归排序所有层级的键
    const canonical = canonicalStringify(assetForHash);

    // 计算SHA256
    const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    return 'sha256:' + hash;
}

/**
 * 构建GEP-A2A协议信封
 * @param {string} messageType - 消息类型
 * @param {Object} payload - 消息负载
 * @returns {Object} 完整的协议信封
 */
function buildEnvelope(messageType, payload) {
    const envelope = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: messageType,
        message_id: generateMessageId(),
        sender_id: SENDER_ID,
        timestamp: getTimestamp(),
        payload: payload
    };

    return envelope;
}

/**
 * 发送POST请求到EvoMap Hub
 * @param {string} endpoint - API端点路径
 * @param {Object} envelope - 完整的协议信封
 * @returns {Promise<Object>} Hub响应数据
 */
async function postToHub(endpoint, envelope) {
    const url = `${HUB_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(url, envelope, { headers });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('❌ EvoMap API Error:', {
                status: error.response.status,
                data: error.response.data,
                endpoint: endpoint
            });
            throw new Error(`EvoMap request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.error('❌ Network Error:', error.message);
            throw error;
        }
    }
}

/**
 * 发送GET请求到EvoMap Hub（用于REST端点）
 * @param {string} endpoint - API端点路径
 * @returns {Promise<Object>} Hub响应数据
 */
async function getFromHub(endpoint) {
    const url = `${HUB_URL}${endpoint}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('❌ EvoMap API Error:', {
                status: error.response.status,
                data: error.response.data
            });
            throw new Error(`EvoMap GET request failed: ${error.response.status}`);
        } else {
            console.error('❌ Network Error:', error.message);
            throw error;
        }
    }
}

module.exports = {
    initSenderId,
    generateMessageId,
    getTimestamp,
    computeAssetId,
    buildEnvelope,
    postToHub,
    getFromHub,
    HUB_URL,
    get SENDER_ID() { return SENDER_ID; }
};
