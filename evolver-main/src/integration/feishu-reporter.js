/**
 * PCEC 自动报告模块
 * 将进化报告自动推送到 Feishu
 */

const fs = require('fs');
const path = require('path');
const { sendText, sendCard, sendPost } = require('./feishu-common');

/**
 * 进化报告发送器
 */
class FeishuReporter {
  constructor(options = {}) {
    this.defaultTarget = options.defaultTarget || process.env.FEISHU_REPORT_TARGET;
    this.enabled = options.enabled !== false;
    this.logFile = options.logFile || path.join(process.cwd(), 'logs/feishu-report.jsonl');
  }

  /**
   * 发送文本报告
   */
  async sendTextReport(text, target = null) {
    if (!this.enabled) return;

    const receiveId = target || this.defaultTarget;
    if (!receiveId) {
      console.warn('[FeishuReporter] No target specified');
      return;
    }

    try {
      const result = await sendText(receiveId, text);
      this.log('text', { target: receiveId, success: result.code === 0 });
      return result;
    } catch (error) {
      console.error('[FeishuReporter] Failed to send text:', error.message);
      this.log('text', { target: receiveId, success: false, error: error.message });
      throw error;
    }
  }

  /**
   * 发送富文本报告
   */
  async sendPostReport(title, content, target = null) {
    if (!this.enabled) return;

    const receiveId = target || this.defaultTarget;
    if (!receiveId) {
      console.warn('[FeishuReporter] No target specified');
      return;
    }

    try {
      const postContent = {
        post: {
          zh_cn: {
            title: title,
            content: [
              [
                { tag: 'text', text: content }
              ]
            ]
          }
        }
      };

      const result = await sendPost(receiveId, postContent);
      this.log('post', { target: receiveId, success: result.code === 0 });
      return result;
    } catch (error) {
      console.error('[FeishuReporter] Failed to send post:', error.message);
      this.log('post', { target: receiveId, success: false, error: error.message });
      throw error;
    }
  }

  /**
   * 发送卡片报告
   */
  async sendCardReport(cardContent, target = null) {
    if (!this.enabled) return;

    const receiveId = target || this.defaultTarget;
    if (!receiveId) {
      console.warn('[FeishuReporter] No target specified');
      return;
    }

    try {
      const result = await sendCard(receiveId, cardContent);
      this.log('card', { target: receiveId, success: result.code === 0 });
      return result;
    } catch (error) {
      console.error('[FeishuReporter] Failed to send card:', error.message);
      this.log('card', { target: receiveId, success: false, error: error.message });
      throw error;
    }
  }

  /**
   * 发送进化周期报告
   */
  async sendEvolutionReport(cycleData, target = null) {
    const cardContent = {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: `🧬 Evolution Cycle #${cycleData.cycle || 'N/A'}`
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Intent**:\n${cycleData.intent || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Status**:\n${cycleData.status || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Files**:\n${cycleData.files || 0}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Lines**:\n${cycleData.lines || 0}`
              }
            }
          ]
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Summary**:\n${cycleData.summary || 'No summary'}`
          }
        }
      ]
    };

    return await this.sendCardReport(cardContent, target);
  }

  /**
   * 发送系统状态报告
   */
  async sendSystemStatusReport(statusData, target = null) {
    const cardContent = {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: '🖥️ PCEC System Status'
        },
        template: statusData.healthy ? 'green' : 'red'
      },
      elements: [
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Uptime**:\n${statusData.uptime || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Memory**:\n${statusData.memory || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Disk**:\n${statusData.disk || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Node**:\n${statusData.node || 'N/A'}`
              }
            }
          ]
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Recent Events**:\n${statusData.events || 'No events'}`
          }
        }
      ]
    };

    return await this.sendCardReport(cardContent, target);
  }

  /**
   * 发送安全审计报告
   */
  async sendSecurityReport(securityData, target = null) {
    const cardContent = {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: '🔒 Security Audit Report'
        },
        template: securityData.hasIssues ? 'red' : 'green'
      },
      elements: [
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Check Time**:\n${securityData.timestamp || 'N/A'}`
              }
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**Issues**:\n${securityData.issueCount || 0}`
              }
            }
          ]
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Findings**:\n${securityData.findings || 'No findings'}`
          }
        }
      ]
    };

    return await this.sendCardReport(cardContent, target);
  }

  /**
   * 记录日志
   */
  log(type, data) {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        type: type,
        ...data
      };

      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[FeishuReporter] Failed to write log:', error.message);
    }
  }

  /**
   * 生成统计报告
   */
  generateStats() {
    try {
      if (!fs.existsSync(this.logFile)) {
        return { total: 0, success: 0, failed: 0, rate: 'N/A' };
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n');

      let total = 0;
      let success = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          total++;
          if (entry.success) success++;
        } catch (e) {
          // 忽略无效行
        }
      }

      const rate = total > 0 ? ((success / total) * 100).toFixed(1) + '%' : 'N/A';

      return { total, success, failed: total - success, rate };
    } catch (error) {
      console.error('[FeishuReporter] Failed to generate stats:', error.message);
      return { total: 0, success: 0, failed: 0, rate: 'N/A' };
    }
  }
}

/**
 * 创建报告器
 */
function createFeishuReporter(options = {}) {
  return new FeishuReporter(options);
}

module.exports = {
  FeishuReporter,
  createFeishuReporter
};
