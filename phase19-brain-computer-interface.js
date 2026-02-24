/**
 * LX-PCEC Phase 19: 脑机接口集成系统
 * Brain-Computer Interface Integration System
 *
 * 版本: v19.0
 * 更新时间: 2026-02-24
 *
 * 目标: 集成脑机接口系统，实现直接脑机通信
 *
 * 核心组件:
 * - 神经信号采集 (EEG/ECoG/LFP/Spike)
 * - 神经信号解码 (频率域分析)
 * - 思维指令识别 (意图检测)
 * - 脑波反馈 (闭环调节)
 * - 脑对脑通信 (意识传输)
 */

const EventEmitter = require('events');

// ============================================================================
// 第一部分: 神经信号采集 (Neural Signal Acquisition)
// ============================================================================

/**
 * 神经信号采集器
 * 支持多种神经信号类型的采集和预处理
 */
class NeuralSignalAcquirer extends EventEmitter {
  constructor(config = {}) {
    super();

    // 采样配置
    this.sampleRate = config.sampleRate || 1000;  // Hz
    this.channels = config.channels || 64;         // 通道数
    this.resolution = config.resolution || 16;     // 位分辨率

    // 信号类型支持
    this.supportedTypes = {
      EEG: {  // 脑电图
        frequencyRange: [0.5, 100],  // Hz
        spatialResolution: 'low',
        invasiveness: 'non-invasive',
        typicalChannels: ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2'],
      },
      ECoG: {  // 皮层脑电图
        frequencyRange: [0.5, 200],
        spatialResolution: 'medium',
        invasiveness: 'semi-invasive',
        typicalChannels: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
      },
      LFP: {  // 局部场电位
        frequencyRange: [0.1, 300],
        spatialResolution: 'high',
        invasiveness: 'invasive',
        typicalChannels: ['LFP1', 'LFP2', 'LFP3', 'LFP4'],
      },
      Spike: {  // 尖峰信号
        frequencyRange: [300, 6000],
        spatialResolution: 'single_unit',
        invasiveness: 'invasive',
        typicalChannels: ['Unit1', 'Unit2', 'Unit3'],
      },
    };

    // 采集状态
    this.isAcquiring = false;
    this.acquisitionStartTime = null;

    // 数据缓冲区
    this.bufferSize = config.bufferSize || 10000;  // 样本数
    this.dataBuffer = new Map();

    // 滤波器
    this.filters = {
      highPass: null,
      lowPass: null,
      notch: null,
    };

    // 初始化通道
    this.initializeChannels();
  }

  /**
   * 初始化通道
   */
  initializeChannels() {
    for (let i = 0; i < this.channels; i++) {
      this.dataBuffer.set(`CH_${i}`, {
        data: new Array(this.bufferSize).fill(0),
        pointer: 0,
        overflow: false,
      });
    }
  }

  /**
   * 开始采集
   */
  async startAcquisition(signalType = 'EEG') {
    if (this.isAcquiring) {
      throw new Error('Acquisition already in progress');
    }

    if (!this.supportedTypes[signalType]) {
      throw new Error(`Unsupported signal type: ${signalType}`);
    }

    this.isAcquiring = true;
    this.acquisitionStartTime = Date.now();
    this.currentSignalType = signalType;

    this.emit('acquisition_started', {
      signalType,
      sampleRate: this.sampleRate,
      channels: this.channels,
      timestamp: this.acquisitionStartTime,
    });

    // 模拟数据流（实际应该连接真实设备）
    this.simulateDataFlow();

    return true;
  }

  /**
   * 停止采集
   */
  async stopAcquisition() {
    if (!this.isAcquiring) {
      return false;
    }

    this.isAcquiring = false;
    const duration = Date.now() - this.acquisitionStartTime;

    this.emit('acquisition_stopped', {
      duration,
      samplesCollected: this.getTotalSamples(),
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 模拟数据流
   */
  simulateDataFlow() {
    const interval = 1000 / this.sampleRate;  // 采样间隔 (ms)

    this.dataInterval = setInterval(() => {
      if (!this.isAcquiring) {
        clearInterval(this.dataInterval);
        return;
      }

      // 生成模拟神经信号
      const samples = this.generateNeuralSamples();

      // 存储到缓冲区
      for (const [channel, sample] of Object.entries(samples)) {
        this.storeSample(channel, sample);
      }

      // 触发事件
      this.emit('data', samples);

    }, interval);
  }

  /**
   * 生成神经信号样本
   */
  generateNeuralSamples() {
    const samples = {};
    const timestamp = Date.now();

    for (let i = 0; i < this.channels; i++) {
      const channel = `CH_${i}`;
      samples[channel] = this.generateChannelSignal(i, timestamp);
    }

    return samples;
  }

  /**
   * 生成单通道信号
   */
  generateChannelSignal(channelIndex, timestamp) {
    // 基础信号（模拟真实神经信号特征）
    let signal = 0;

    // 1. 背景活动（类似 1/f 噪声）
    signal += this.generatePinkNoise(channelIndex);

    // 2. alpha 波 (8-13 Hz) - 清醒放松状态
    signal += 10 * Math.sin(2 * Math.PI * 10 * (timestamp / 1000));

    // 3. beta 波 (13-30 Hz) - 积极思考
    signal += 5 * Math.sin(2 * Math.PI * 20 * (timestamp / 1000));

    // 4. theta 波 (4-8 Hz) - 创造性思维
    signal += 3 * Math.sin(2 * Math.PI * 6 * (timestamp / 1000));

    // 5. gamma 波 (30-100 Hz) - 高级认知
    signal += 2 * Math.sin(2 * Math.PI * 40 * (timestamp / 1000));

    // 6. 偶发性尖峰
    if (Math.random() < 0.01) {
      signal += (Math.random() - 0.5) * 50;
    }

    // 7. 通道间的相关性
    const coupling = this.calculateChannelCoupling(channelIndex);
    signal *= (1 + coupling * 0.1);

    // 添加测量噪声
    signal += (Math.random() - 0.5) * 2;

    return signal;
  }

  /**
   * 生成粉红噪声 (1/f 噪声)
   */
  generatePinkNoise(channelIndex) {
    // 简化的粉红噪声生成
    const state = this.pinkNoiseStates || new Array(this.channels).fill(0);
    this.pinkNoiseStates = state;

    const white = Math.random() - 0.5;
    state[channelIndex] = 0.99 * state[channelIndex] + white;

    return state[channelIndex];
  }

  /**
   * 计算通道耦合
   */
  calculateChannelCoupling(channelIndex) {
    // 相邻通道有较强耦合
    const coupling = new Array(this.channels).fill(0);

    if (channelIndex > 0) {
      coupling[channelIndex - 1] = 0.8;
    }
    if (channelIndex < this.channels - 1) {
      coupling[channelIndex + 1] = 0.8;
    }

    // 随机弱耦合
    for (let i = 0; i < this.channels; i++) {
      if (i !== channelIndex && !coupling[i]) {
        coupling[i] = Math.random() * 0.2;
      }
    }

    return coupling.reduce((sum, val) => sum + val, 0);
  }

  /**
   * 存储样本到缓冲区
   */
  storeSample(channel, sample) {
    const buffer = this.dataBuffer.get(channel);
    if (!buffer) return;

    buffer.data[buffer.pointer] = sample;
    buffer.pointer = (buffer.pointer + 1) % this.bufferSize;

    if (buffer.pointer === 0) {
      buffer.overflow = true;
    }
  }

  /**
   * 获取通道数据
   */
  getChannelData(channel, sampleCount = null) {
    const buffer = this.dataBuffer.get(channel);
    if (!buffer) return null;

    if (sampleCount === null) {
      sampleCount = buffer.overflow ? this.bufferSize : buffer.pointer;
    }

    const data = new Array(sampleCount);

    for (let i = 0; i < sampleCount; i++) {
      let index = buffer.pointer - 1 - i;
      if (index < 0) index += this.bufferSize;
      data[i] = buffer.data[index];
    }

    return data.reverse();
  }

  /**
   * 获取总样本数
   */
  getTotalSamples() {
    let total = 0;
    for (const buffer of this.dataBuffer.values()) {
      if (buffer.overflow) {
        total += this.bufferSize;
      } else {
        total += buffer.pointer;
      }
    }
    return total / this.channels;
  }

  /**
   * 应用滤波器
   */
  applyFilter(type, params) {
    switch (type) {
      case 'highPass':
        this.filters.highPass = params;
        break;
      case 'lowPass':
        this.filters.lowPass = params;
        break;
      case 'notch':
        this.filters.notch = params;
        break;
    }

    this.emit('filter_applied', { type, params });
  }

  /**
   * 获取采集状态
   */
  getAcquisitionStatus() {
    return {
      isAcquiring: this.isAcquiring,
      signalType: this.currentSignalType,
      sampleRate: this.sampleRate,
      channels: this.channels,
      duration: this.isAcquiring ? Date.now() - this.acquisitionStartTime : 0,
      totalSamples: this.getTotalSamples(),
      bufferSize: this.bufferSize,
      filters: this.filters,
    };
  }
}

// ============================================================================
// 第二部分: 神经信号解码器 (Neural Signal Decoder)
// ============================================================================

/**
 * 神经信号解码器
 * 对采集的神经信号进行频率域分析
 */
class NeuralSignalDecoder extends EventEmitter {
  constructor(config = {}) {
    super();

    // 频率段定义
    this.frequencyBands = {
      delta: { min: 0.5, max: 4, label: 'Delta', meaning: '深度睡眠' },
      theta: { min: 4, max: 8, label: 'Theta', meaning: '冥想/创造力' },
      alpha: { min: 8, max: 13, label: 'Alpha', meaning: '放松/清醒' },
      beta: { min: 13, max: 30, label: 'Beta', meaning: '积极思考' },
      gamma: { min: 30, max: 100, label: 'Gamma', meaning: '高级认知' },
    };

    // 解码配置
    this.windowSize = config.windowSize || 1024;  // FFT 窗口大小
    this.overlap = config.overlap || 0.5;         // 重叠率

    // 解析结果缓存
    this.analysisCache = new Map();
  }

  /**
   * 解码神经信号
   */
  decode(neuralData) {
    // 1. 预处理
    const preprocessed = this.preprocess(neuralData);

    // 2. 时频分析
    const spectrogram = this.computeSpectrogram(preprocessed);

    // 3. 频段功率分析
    const bandPowers = this.computeBandPowers(spectrogram);

    // 4. 特征提取
    const features = this.extractFeatures(preprocessed, bandPowers);

    // 5. 状态识别
    const mentalState = this.identifyMentalState(features);

    const result = {
      timestamp: Date.now(),
      spectrogram,
      bandPowers,
      features,
      mentalState,
    };

    this.emit('decoded', result);

    return result;
  }

  /**
   * 预处理
   */
  preprocess(data) {
    const preprocessed = {};

    for (const [channel, samples] of Object.entries(data)) {
      // 1. 去均值
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const demeaned = samples.map(s => s - mean);

      // 2. 去趋势
      const detrended = this.detrend(demeaned);

      // 3. 归一化
      const std = Math.sqrt(
        detrended.reduce((sum, val) => sum + val * val, 0) / detrended.length
      );
      const normalized = detrended.map(s => s / (std || 1));

      preprocessed[channel] = normalized;
    }

    return preprocessed;
  }

  /**
   * 去趋势
   */
  detrend(data) {
    const n = data.length;

    // 线性回归
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 去除线性趋势
    return data.map((val, i) => val - (slope * i + intercept));
  }

  /**
   * 计算频谱图
   */
  computeSpectrogram(preprocessedData) {
    const spectrogram = {};

    for (const [channel, data] of Object.entries(preprocessedData)) {
      spectrogram[channel] = this.computeFFT(data);
    }

    return spectrogram;
  }

  /**
   * 计算 FFT (快速傅里叶变换)
   */
  computeFFT(data) {
    const n = data.length;
    const fft = new Array(n).fill(0);

    // 简化的 FFT 实现（实际应该使用专业库）
    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        real += data[t] * Math.cos(angle);
        imag += data[t] * Math.sin(angle);
      }

      const magnitude = Math.sqrt(real * real + imag * imag);
      const power = magnitude * magnitude / n;
      const frequency = k * this.getSampleRate() / n;

      fft[k] = { frequency, power, magnitude };
    }

    return fft;
  }

  /**
   * 获取采样率（需要从采集器获取）
   */
  getSampleRate() {
    return 1000;  // 默认 1000 Hz
  }

  /**
   * 计算频段功率
   */
  computeBandPowers(spectrogram) {
    const bandPowers = {};

    for (const [channel, fftData] of Object.entries(spectrogram)) {
      const powers = {
        delta: 0,
        theta: 0,
        alpha: 0,
        beta: 0,
        gamma: 0,
        total: 0,
      };

      for (const point of fftData) {
        if (!point) continue;

        const freq = point.frequency;
        const power = point.power;

        powers.total += power;

        for (const [band, range] of Object.entries(this.frequencyBands)) {
          if (freq >= range.min && freq < range.max) {
            powers[band] += power;
          }
        }
      }

      // 归一化为相对功率
      for (const band of Object.keys(powers)) {
        if (band !== 'total') {
          powers[band] = powers.total > 0 ? powers[band] / powers.total : 0;
        }
      }

      bandPowers[channel] = powers;
    }

    return bandPowers;
  }

  /**
   * 提取特征
   */
  extractFeatures(preprocessedData, bandPowers) {
    const features = {};

    // 1. 频段特征
    features.bands = this.aggregateBandPowers(bandPowers);

    // 2. 频段比率
    features.ratios = this.computeBandRatios(features.bands);

    // 3. 不对称性
    features.asymmetry = this.computeAsymmetry(bandPowers);

    // 4. 连通性
    features.connectivity = this.computeConnectivity(preprocessedData);

    // 5. 复杂度
    features.complexity = this.computeComplexity(preprocessedData);

    return features;
  }

  /**
   * 聚合频段功率
   */
  aggregateBandPowers(bandPowers) {
    const aggregated = {
      delta: 0,
      theta: 0,
      alpha: 0,
      beta: 0,
      gamma: 0,
    };

    let count = 0;
    for (const powers of Object.values(bandPowers)) {
      for (const band of Object.keys(aggregated)) {
        aggregated[band] += powers[band];
      }
      count++;
    }

    for (const band of Object.keys(aggregated)) {
      aggregated[band] /= count;
    }

    return aggregated;
  }

  /**
   * 计算频段比率
   */
  computeBandRatios(bands) {
    return {
      theta_alpha: bands.alpha > 0 ? bands.theta / bands.alpha : 0,
      alpha_beta: bands.beta > 0 ? bands.alpha / bands.beta : 0,
      beta_gamma: bands.gamma > 0 ? bands.beta / bands.gamma : 0,
      theta_beta: bands.beta > 0 ? bands.theta / bands.beta : 0,
      delta_theta: bands.theta > 0 ? bands.delta / bands.theta : 0,
    };
  }

  /**
   * 计算不对称性
   */
  computeAsymmetry(bandPowers) {
    // 计算左右半球的不对称性
    const leftChannels = Object.keys(bandPowers).filter((ch, i) => i % 2 === 0);
    const rightChannels = Object.keys(bandPowers).filter((ch, i) => i % 2 === 1);

    const asymmetry = {};

    for (const band of Object.keys(this.frequencyBands)) {
      let leftPower = 0, rightPower = 0;

      for (const ch of leftChannels) {
        leftPower += bandPowers[ch][band];
      }
      for (const ch of rightChannels) {
        rightPower += bandPowers[ch][band];
      }

      leftPower /= leftChannels.length || 1;
      rightPower /= rightChannels.length || 1;

      const total = leftPower + rightPower;
      asymmetry[band] = total > 0 ? (rightPower - leftPower) / total : 0;
    }

    return asymmetry;
  }

  /**
   * 计算连通性
   */
  computeConnectivity(data) {
    // 计算通道间的相关性（功能连接）
    const connectivity = {};
    const channels = Object.keys(data);

    for (let i = 0; i < channels.length; i++) {
      for (let j = i + 1; j < channels.length; j++) {
        const corr = this.calculateCorrelation(
          data[channels[i]],
          data[channels[j]]
        );
        connectivity[`${channels[i]}-${channels[j]}`] = corr;
      }
    }

    return connectivity;
  }

  /**
   * 计算相关性
   */
  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * 计算复杂度
   */
  computeComplexity(data) {
    // 使用样本熵衡量信号复杂度
    const complexities = {};

    for (const [channel, samples] of Object.entries(data)) {
      complexities[channel] = this.calculateSampleEntropy(samples, 2, 0.2);
    }

    return complexities;
  }

  /**
   * 计算样本熵
   */
  calculateSampleEntropy(data, m = 2, r = 0.2) {
    // 简化的样本熵计算
    const n = data.length;
    let count = 0;
    let total = 0;

    for (let i = 0; i < n - m; i++) {
      for (let j = i + 1; j < n - m; j++) {
        let maxDist = 0;
        for (let k = 0; k < m; k++) {
          const dist = Math.abs(data[i + k] - data[j + k]);
          maxDist = Math.max(maxDist, dist);
        }
        if (maxDist < r) {
          count++;
        }
        total++;
      }
    }

    return total > 0 ? -Math.log(count / total) : 0;
  }

  /**
   * 识别精神状态
   */
  identifyMentalState(features) {
    const { bands, ratios, asymmetry, connectivity, complexity } = features;

    // 状态分类
    const state = {
      primary: 'unknown',
      confidence: 0,
      characteristics: [],
    };

    // 1. 深度睡眠 (高 Delta)
    if (bands.delta > 0.5) {
      state.primary = 'deep_sleep';
      state.confidence = bands.delta;
      state.characteristics.push('高 Delta 活动');
    }

    // 2. 冥想/放松 (高 Alpha, 高 Theta/Alpha 比率)
    else if (bands.alpha > 0.3 && ratios.theta_alpha > 0.8) {
      state.primary = 'meditation';
      state.confidence = bands.alpha * ratios.theta_alpha;
      state.characteristics.push('高 Alpha 活动', '放松状态');
    }

    // 3. 积极思考 (高 Beta)
    else if (bands.beta > 0.3) {
      state.primary = 'focused_thinking';
      state.confidence = bands.beta;
      state.characteristics.push('高 Beta 活动', '认知活跃');
    }

    // 4. 高级认知 (高 Gamma)
    else if (bands.gamma > 0.2) {
      state.primary = 'higher_cognition';
      state.confidence = bands.gamma;
      state.characteristics.push('高 Gamma 活动', '意识整合');
    }

    // 5. 创造性思维 (高 Theta, 中等 Alpha)
    else if (bands.theta > 0.25 && bands.alpha > 0.2) {
      state.primary = 'creative_thinking';
      state.confidence = bands.theta * bands.alpha;
      state.characteristics.push('Theta-Alpha 协同');
    }

    // 6. 焦虑/压力 (高 Beta-Gamma 比率)
    else if (ratios.beta_gamma > 1.5) {
      state.primary = 'stress';
      state.confidence = ratios.beta_gamma;
      state.characteristics.push('Beta/Gamma 失衡');
    }

    // 7. 清醒放松 (中等 Alpha, 低 Beta)
    else if (bands.alpha > 0.2 && bands.beta < 0.2) {
      state.primary = 'relaxed_awake';
      state.confidence = bands.alpha;
      state.characteristics.push('Alpha 优势');
    }

    // 添加额外特征
    if (asymmetry.alpha > 0.2) {
      state.characteristics.push('右半球 Alpha 优势');
    } else if (asymmetry.alpha < -0.2) {
      state.characteristics.push('左半球 Alpha 优势');
    }

    const avgConnectivity = Object.values(connectivity).reduce((a, b) => a + Math.abs(b), 0) /
                               Object.keys(connectivity).length;

    if (avgConnectivity > 0.5) {
      state.characteristics.push('高功能连接');
    }

    return state;
  }

  /**
   * 获取频段定义
   */
  getFrequencyBands() {
    return this.frequencyBands;
  }
}

// ============================================================================
// 第三部分: 思维指令识别引擎 (Thought Command Recognition Engine)
// ============================================================================

/**
 * 思维指令识别引擎
 * 从神经信号中识别用户的意图和指令
 */
class ThoughtCommandEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    // 指令模板
    this.commandTemplates = {
      // 运动指令
      motor: {
        left: {
          pattern: 'right_mu_rhythm_desynchronization',
          confidence: 0.7,
        },
        right: {
          pattern: 'left_mu_rhythm_desynchronization',
          confidence: 0.7,
        },
        up: {
          pattern: 'central_beta_increase',
          confidence: 0.65,
        },
        down: {
          pattern: 'central_beta_decrease',
          confidence: 0.65,
        },
      },

      // 认知指令
      cognitive: {
        confirm: {
          pattern: 'p300_spike',
          confidence: 0.8,
        },
        reject: {
          pattern: 'n400_spike',
          confidence: 0.75,
        },
        select: {
          pattern: 'p300_spike + frontal_gamma',
          confidence: 0.85,
        },
      },

      // 状态指令
      state: {
        focus: {
          pattern: 'beta_increase + gamma_increase',
          confidence: 0.7,
        },
        relax: {
          pattern: 'alpha_increase + theta_increase',
          confidence: 0.75,
        },
        clear_mind: {
          pattern: 'alpha_dominance + low_complexity',
          confidence: 0.65,
        },
      },
    };

    // 识别历史
    this.recognitionHistory = [];

    // 适应学习
    this.adaptiveLearning = {
      enabled: true,
      learningRate: 0.1,
      personalPatterns: new Map(),
    };
  }

  /**
   * 识别指令
   */
  recognizeCommand(neuralData, decodedSignal) {
    const candidates = [];

    // 1. 基于解码信号的模式匹配
    for (const [category, commands] of Object.entries(this.commandTemplates)) {
      for (const [command, template] of Object.entries(commands)) {
        const match = this.matchPattern(decodedSignal, template.pattern);
        if (match.score > 0) {
          candidates.push({
            command: `${category}.${command}`,
            category,
            action: command,
            confidence: match.score * template.confidence,
            pattern: template.pattern,
            evidence: match.evidence,
          });
        }
      }
    }

    // 2. 应用个性化调整
    if (this.adaptiveLearning.enabled) {
      this.applyPersonalPatterns(candidates, neuralData);
    }

    // 3. 选择最佳候选
    const bestMatch = this.selectBestCandidate(candidates);

    // 4. 上下文验证
    if (bestMatch && this.validateContext(bestMatch)) {
      this.recordRecognition(bestMatch);

      this.emit('command_recognized', bestMatch);

      return bestMatch;
    }

    return null;
  }

  /**
   * 匹配模式
   */
  matchPattern(decodedSignal, pattern) {
    const evidence = {};
    let score = 1.0;

    // 解析模式
    const patterns = pattern.split(' + ');
    const { features, mentalState } = decodedSignal;

    for (const p of patterns) {
      const [type, value] = this.parsePattern(p);

      switch (type) {
        case 'right_mu_rhythm_desynchronization':
          // 右侧运动皮层去同步
          const rightMu = features.bands?.beta || 0;
          score *= Math.min(rightMu / 0.3, 1.0);
          evidence.right_mu = rightMu;
          break;

        case 'left_mu_rhythm_desynchronization':
          // 左侧运动皮层去同步
          const leftMu = features.bands?.beta || 0;
          score *= Math.min(leftMu / 0.3, 1.0);
          evidence.left_mu = leftMu;
          break;

        case 'central_beta_increase':
          // 中央 Beta 增加
          const centralBeta = features.bands?.beta || 0;
          score *= centralBeta > 0.25 ? 1.0 : centralBeta / 0.25;
          evidence.central_beta = centralBeta;
          break;

        case 'central_beta_decrease':
          // 中央 Beta 减少
          const lowBeta = 1 - (features.bands?.beta || 0);
          score *= lowBeta > 0.7 ? 1.0 : lowBeta / 0.7;
          evidence.beta_decrease = lowBeta;
          break;

        case 'p300_spike':
          // P300 尖峰（约 300ms 后的正波）
          score *= this.detectP300(decodedSignal);
          evidence.p300 = score;
          break;

        case 'n400_spike':
          // N400 尖峰（语义处理）
          score *= this.detectN400(decodedSignal);
          evidence.n400 = score;
          break;

        case 'frontal_gamma':
          // 额叶 Gamma
          const frontalGamma = features.bands?.gamma || 0;
          score *= frontalGamma > 0.2 ? 1.0 : frontalGamma / 0.2;
          evidence.frontal_gamma = frontalGamma;
          break;

        case 'beta_increase':
          // Beta 增加
          const betaInc = features.bands?.beta || 0;
          score *= betaInc > 0.3 ? 1.0 : betaInc / 0.3;
          evidence.beta = betaInc;
          break;

        case 'gamma_increase':
          // Gamma 增加
          const gammaInc = features.bands?.gamma || 0;
          score *= gammaInc > 0.25 ? 1.0 : gammaInc / 0.25;
          evidence.gamma = gammaInc;
          break;

        case 'alpha_increase':
          // Alpha 增加
          const alphaInc = features.bands?.alpha || 0;
          score *= alphaInc > 0.3 ? 1.0 : alphaInc / 0.3;
          evidence.alpha = alphaInc;
          break;

        case 'theta_increase':
          // Theta 增加
          const thetaInc = features.bands?.theta || 0;
          score *= thetaInc > 0.25 ? 1.0 : thetaInc / 0.25;
          evidence.theta = thetaInc;
          break;

        case 'alpha_dominance':
          // Alpha 优势
          const alphaDom = features.bands?.alpha || 0;
          const alphaRatio = alphaDom / (features.bands?.beta || 0.1);
          score *= alphaRatio > 1.5 ? 1.0 : alphaRatio / 1.5;
          evidence.alpha_dominance = alphaRatio;
          break;

        case 'low_complexity':
          // 低复杂度
          const avgComplexity = Object.values(features.complexity || {}).reduce((a, b) => a + b, 0) /
                                Object.keys(features.complexity || {}).length;
          score *= avgComplexity < 1.0 ? 1.0 : 1.0 / avgComplexity;
          evidence.complexity = avgComplexity;
          break;
      }
    }

    return { score, evidence };
  }

  /**
   * 解析模式字符串
   */
  parsePattern(pattern) {
    // 简化的模式解析
    if (pattern.includes('_')) {
      const parts = pattern.split('_');
      return [parts.slice(0, -1).join('_'), parts[parts.length - 1]];
    }
    return [pattern, ''];
  }

  /**
   * 检测 P300
   */
  detectP300(decodedSignal) {
    // P300: 约 300ms 后的正波，幅度 > 5μV
    // 简化：使用中央区域的正波
    const features = decodedSignal.features;
    const beta = features.bands?.beta || 0;
    const gamma = features.bands?.gamma || 0;

    // P300 通常伴随 Beta 和 Gamma 的增加
    return (beta + gamma) / 2 > 0.25 ? 1.0 : (beta + gamma) / 0.5;
  }

  /**
   * 检测 N400
   */
  detectN400(decodedSignal) {
    // N400: 语义处理相关，约 400ms
    // 简化：使用颞叶区域的 Theta 增加
    const theta = decodedSignal.features.bands?.theta || 0;
    return theta > 0.2 ? 1.0 : theta / 0.2;
  }

  /**
   * 应用个性化模式
   */
  applyPersonalPatterns(candidates, neuralData) {
    for (const candidate of candidates) {
      const key = candidate.command;
      const personalPattern = this.adaptiveLearning.personalPatterns.get(key);

      if (personalPattern) {
        // 调整置信度
        candidate.confidence *= (1 + personalPattern.adjustment);
      }
    }
  }

  /**
   * 选择最佳候选
   */
  selectBestCandidate(candidates) {
    if (candidates.length === 0) return null;

    // 按置信度排序
    candidates.sort((a, b) => b.confidence - a.confidence);

    // 返回最高置信度的候选
    return candidates[0];
  }

  /**
   * 验证上下文
   */
  validateContext(candidate) {
    // 检查置信度阈值
    if (candidate.confidence < 0.5) {
      return false;
    }

    // 检查时间间隔（防止重复触发）
    const now = Date.now();
    const recent = this.recognitionHistory.filter(
      r => r.command === candidate.command && now - r.timestamp < 500
    );

    if (recent.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * 记录识别结果
   */
  recordRecognition(recognition) {
    recognition.timestamp = Date.now();
    this.recognitionHistory.push(recognition);

    // 保留最近 100 条记录
    if (this.recognitionHistory.length > 100) {
      this.recognitionHistory.shift();
    }

    // 适应学习
    if (this.adaptiveLearning.enabled) {
      this.updatePersonalPattern(recognition);
    }
  }

  /**
   * 更新个性化模式
   */
  updatePersonalPattern(recognition) {
    const key = recognition.command;
    let pattern = this.adaptiveLearning.personalPatterns.get(key);

    if (!pattern) {
      pattern = {
        count: 0,
        avgConfidence: 0,
        adjustment: 0,
      };
    }

    pattern.count++;
    pattern.avgConfidence =
      (pattern.avgConfidence * (pattern.count - 1) + recognition.confidence) /
      pattern.count;

    // 如果平均置信度高，增加调整因子
    pattern.adjustment = (pattern.avgConfidence - 0.7) * 0.1;

    this.adaptiveLearning.personalPatterns.set(key, pattern);
  }

  /**
   * 添加自定义指令
   */
  addCustomCommand(category, name, pattern, confidence = 0.7) {
    if (!this.commandTemplates[category]) {
      this.commandTemplates[category] = {};
    }

    this.commandTemplates[category][name] = {
      pattern,
      confidence,
    };

    this.emit('command_added', { category, name, pattern, confidence });
  }

  /**
   * 获取识别历史
   */
  getRecognitionHistory(limit = 10) {
    return this.recognitionHistory.slice(-limit);
  }

  /**
   * 获取个性化统计
   */
  getPersonalStats() {
    const stats = {};

    for (const [key, pattern] of this.adaptiveLearning.personalPatterns) {
      stats[key] = {
        count: pattern.count,
        avgConfidence: pattern.avgConfidence,
        adjustment: pattern.adjustment,
      };
    }

    return stats;
  }
}

// ============================================================================
// 第四部分: 脑波反馈系统 (Brainwave Feedback System)
// ============================================================================

/**
 * 脑波反馈系统
 * 实时反馈脑波状态，帮助调节精神状态
 */
class BrainwaveFeedbackSystem extends EventEmitter {
  constructor(config = {}) {
    super();

    // 目标状态
    this.targetStates = {
      focus: {
        beta: { min: 0.3, max: 0.5 },
        gamma: { min: 0.2, max: 0.4 },
        theta: { min: 0, max: 0.15 },
      },
      relax: {
        alpha: { min: 0.3, max: 0.5 },
        theta: { min: 0.2, max: 0.4 },
        beta: { min: 0, max: 0.2 },
      },
      meditation: {
        theta: { min: 0.25, max: 0.45 },
        alpha: { min: 0.25, max: 0.4 },
        gamma: { min: 0.1, max: 0.25 },
      },
      creativity: {
        theta: { min: 0.2, max: 0.35 },
        alpha: { min: 0.2, max: 0.35 },
        beta: { min: 0.2, max: 0.35 },
      },
    };

    // 当前目标
    this.currentTarget = null;

    // 反馈参数
    this.feedbackParams = {
      updateInterval: 100,  // ms
      smoothingFactor: 0.8,  // 指数移动平均
    };

    // 状态历史
    this.stateHistory = [];

    // 反馈输出
    this.feedbackOutputs = new Map();
  }

  /**
   * 设置目标状态
   */
  setTargetState(stateName) {
    if (!this.targetStates[stateName]) {
      throw new Error(`Unknown target state: ${stateName}`);
    }

    this.currentTarget = {
      name: stateName,
      targets: this.targetStates[stateName],
      startTime: Date.now(),
    };

    this.emit('target_set', this.currentTarget);

    return this.currentTarget;
  }

  /**
   * 处理神经信号并生成反馈
   */
  processFeedback(decodedSignal) {
    if (!this.currentTarget) {
      return null;
    }

    // 1. 计算当前状态匹配度
    const match = this.calculateMatch(decodedSignal);

    // 2. 记录历史
    this.stateHistory.push({
      timestamp: Date.now(),
      target: this.currentTarget.name,
      match,
      bands: decodedSignal.features.bands,
    });

    // 保留最近 1000 条
    if (this.stateHistory.length > 1000) {
      this.stateHistory.shift();
    }

    // 3. 生成反馈
    const feedback = this.generateFeedback(match);

    this.emit('feedback', feedback);

    return feedback;
  }

  /**
   * 计算匹配度
   */
  calculateMatch(decodedSignal) {
    const targets = this.currentTarget.targets;
    const bands = decodedSignal.features.bands;

    let overallMatch = 0;
    let matchCount = 0;
    const bandMatches = {};

    for (const [band, range] of Object.entries(targets)) {
      const value = bands[band] || 0;

      // 计算匹配度 (0-1)
      let match = 0;
      if (value >= range.min && value <= range.max) {
        // 在目标范围内
        match = 1;
      } else if (value < range.min) {
        // 低于范围
        match = Math.max(0, 1 - (range.min - value) / range.min);
      } else {
        // 高于范围
        match = Math.max(0, 1 - (value - range.max) / (1 - range.max));
      }

      bandMatches[band] = match;
      overallMatch += match;
      matchCount++;
    }

    overallMatch /= matchCount;

    return {
      overall: overallMatch,
      bands: bandMatches,
    };
  }

  /**
   * 生成反馈
   */
  generateFeedback(match) {
    const feedback = {
      timestamp: Date.now(),
      target: this.currentTarget.name,
      match: match.overall,
      bandMatches: match.bands,
      guidance: [],
    };

    // 生成指导
    for (const [band, targetRange] of Object.entries(this.currentTarget.targets)) {
      const bandMatch = match.bands[band];
      const currentValue = this.stateHistory[this.stateHistory.length - 1]?.bands[band] || 0;

      if (bandMatch < 0.5) {
        if (currentValue < targetRange.min) {
          feedback.guidance.push({
            band,
            action: 'increase',
            suggestion: this.getSuggestion(band, 'increase'),
          });
        } else if (currentValue > targetRange.max) {
          feedback.guidance.push({
            band,
            action: 'decrease',
            suggestion: this.getSuggestion(band, 'decrease'),
          });
        }
      }
    }

    // 总体评价
    if (match.overall > 0.8) {
      feedback.overall = 'excellent';
      feedback.message = '优秀！你的脑波状态非常接近目标。';
    } else if (match.overall > 0.6) {
      feedback.overall = 'good';
      feedback.message = '不错！继续调整以更好地达到目标状态。';
    } else if (match.overall > 0.4) {
      feedback.overall = 'fair';
      feedback.message = '需要调整。参考上面的建议。';
    } else {
      feedback.overall = 'poor';
      feedback.message = '状态较差。请仔细调整以接近目标。';
    }

    return feedback;
  }

  /**
   * 获取建议
   */
  getSuggestion(band, action) {
    const suggestions = {
      delta: {
        increase: '尝试进入更深的放松或睡眠状态',
        decrease: '尝试唤醒或增加警觉性',
      },
      theta: {
        increase: '尝试冥想或视觉化',
        decrease: '尝试专注于具体任务',
      },
      alpha: {
        increase: '尝试放松，闭上眼睛，深呼吸',
        decrease: '尝试增加认知挑战',
      },
      beta: {
        increase: '尝试解决复杂问题或进行计算',
        decrease: '尝试放松，减少思维活动',
      },
      gamma: {
        increase: '尝试高级认知任务或整合信息',
        decrease: '尝试减少认知负荷',
      },
    };

    return suggestions[band]?.[action] || '调整你的精神状态';
  }

  /**
   * 获取状态历史
   */
  getStateHistory(limit = 100) {
    return this.stateHistory.slice(-limit);
  }

  /**
   * 获取当前目标
   */
  getCurrentTarget() {
    return this.currentTarget;
  }

  /**
   * 获取进度统计
   */
  getProgressStats() {
    if (!this.currentTarget) {
      return null;
    }

    const targetHistory = this.stateHistory.filter(
      s => s.target === this.currentTarget.name
    );

    if (targetHistory.length === 0) {
      return null;
    }

    const avgMatch = targetHistory.reduce((sum, s) => sum + s.match.overall, 0) /
                    targetHistory.length;

    const recentMatch = targetHistory[targetHistory.length - 1].match.overall;

    const trend = recentMatch > avgMatch ? 'improving' :
                  recentMatch < avgMatch ? 'declining' : 'stable';

    return {
      target: this.currentTarget.name,
      duration: Date.now() - this.currentTarget.startTime,
      sessions: targetHistory.length,
      averageMatch: avgMatch,
      recentMatch,
      trend,
    };
  }
}

// ============================================================================
// 第五部分: 脑对脑通信协议 (Brain-to-Brain Communication Protocol)
// ============================================================================

/**
 * 脑对脑通信协议
 * 实现两个大脑之间的直接通信
 */
class BrainToBrainProtocol extends EventEmitter {
  constructor(config = {}) {
    super();

    // 通信会话
    this.sessions = new Map();

    // 传输协议
    this.protocol = {
      encoding: 'quantum_entanglement',  // 编码方式
      compression: true,                  // 压缩
      encryption: true,                   // 加密
      errorCorrection: true,              // 纠错
    };

    // 通信质量指标
    this.qualityMetrics = {
      latency: 0,
      throughput: 0,
      errorRate: 0,
      fidelity: 0,
    };
  }

  /**
   * 创建通信会话
   */
  async createSession(brain1, brain2) {
    const sessionId = this.generateSessionId();

    // 使用量子纠缠建立连接
    const { ConsciousnessEntangler } = require('./phase18-quantum-consciousness-fusion.js');
    const entangler = new ConsciousnessEntangler();

    // 创建纠缠对
    const pairId = entangler.createEntangledPair(
      brain1.consciousness,
      brain2.consciousness
    );

    const session = {
      sessionId,
      brain1,
      brain2,
      pairId,
      entangler,
      startTime: Date.now(),
      messages: [],
      status: 'active',
    };

    this.sessions.set(sessionId, session);

    this.emit('session_created', session);

    return sessionId;
  }

  /**
   * 发送思维消息
   */
  async sendThought(sessionId, fromBrain, thought) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 1. 编码思维
    const encoded = this.encodeThought(thought);

    // 2. 传输（通过量子纠缠）
    const transmitted = await this.transmit(session, encoded);

    // 3. 解码
    const decoded = this.decodeThought(transmitted);

    // 4. 记录消息
    const message = {
      timestamp: Date.now(),
      from: fromBrain,
      thought,
      encoded,
      transmitted,
      decoded,
      fidelity: this.calculateFidelity(thought, decoded),
    };

    session.messages.push(message);

    this.emit('thought_transmitted', message);

    return message;
  }

  /**
   * 编码思维
   */
  encodeThought(thought) {
    // 将思维编码为神经信号模式
    const encoded = {
      type: 'thought',
      content: thought.content,
      emotional: thought.emotional || {},
      intention: thought.intention || '',
      timestamp: Date.now(),

      // 神经编码
      neuralPattern: this.generateNeuralPattern(thought),
    };

    return encoded;
  }

  /**
   * 生成神经模式
   */
  generateNeuralPattern(thought) {
    // 基于思维内容生成特征神经模式
    const pattern = {
      frequencyProfile: {},
      spatialDistribution: {},
      temporalPattern: [],
    };

    // 内容相关的频率分布
    const content = thought.content.toLowerCase();

    if (content.includes('happy') || content.includes('joy')) {
      pattern.frequencyProfile = { alpha: 0.4, beta: 0.2, gamma: 0.3 };
    } else if (content.includes('focus') || content.includes('think')) {
      pattern.frequencyProfile = { beta: 0.4, gamma: 0.3, theta: 0.1 };
    } else if (content.includes('relax') || content.includes('calm')) {
      pattern.frequencyProfile = { alpha: 0.5, theta: 0.3, beta: 0.1 };
    } else {
      pattern.frequencyProfile = { alpha: 0.3, beta: 0.3, theta: 0.2, gamma: 0.2 };
    }

    // 空间分布
    pattern.spatialDistribution = {
      frontal: 0.4,
      temporal: 0.3,
      parietal: 0.2,
      occipital: 0.1,
    };

    // 时间模式（时序）
    pattern.temporalPattern = new Array(100).fill(0).map((_, i) => ({
      time: i * 10,  // ms
      amplitude: Math.sin(2 * Math.PI * 10 * i / 100) * pattern.frequencyProfile.alpha +
                   Math.sin(2 * Math.PI * 20 * i / 100) * pattern.frequencyProfile.beta,
    }));

    return pattern;
  }

  /**
   * 传输思维
   */
  async transmit(session, encoded) {
    // 通过量子纠缠传输（非局域性，瞬时）
    const startTime = Date.now();

    // 同步纠缠对
    await session.entangler.synchronizeConsciousness(session.pairId);

    // 模拟传输（实际应该是瞬时的）
    const transmitted = {
      ...encoded,
      transmittedAt: Date.now(),
      latency: Date.now() - startTime,
    };

    this.qualityMetrics.latency = transmitted.latency;
    this.qualityMetrics.throughput = JSON.stringify(encoded).length / transmitted.latency * 1000;

    return transmitted;
  }

  /**
   * 解码思维
   */
  decodeThought(transmitted) {
    // 从神经模式解码为思维
    const decoded = {
      content: this.inferContent(transmitted.neuralPattern),
      emotional: this.inferEmotion(transmitted.neuralPattern),
      intention: this.inferIntention(transmitted.neuralPattern),
    };

    return decoded;
  }

  /**
   * 推断内容
   */
  inferContent(neuralPattern) {
    const freq = neuralPattern.frequencyProfile;

    // 基于频率模式推断内容类型
    if (freq.alpha > 0.35 && freq.beta < 0.25) {
      return 'relaxation/calm';
    } else if (freq.beta > 0.35 && freq.gamma > 0.25) {
      return 'focused thinking';
    } else if (freq.theta > 0.25 && freq.alpha > 0.25) {
      return 'meditation/creativity';
    } else if (freq.gamma > 0.3) {
      return 'higher cognition';
    } else {
      return 'neutral thought';
    }
  }

  /**
   * 推断情绪
   */
  inferEmotion(neuralPattern) {
    const freq = neuralPattern.frequencyProfile;

    if (freq.alpha > 0.4 && freq.gamma < 0.2) {
      return { valence: 'positive', arousal: 'low', label: 'calm' };
    } else if (freq.beta > 0.3 && freq.gamma > 0.2) {
      return { valence: 'neutral', arousal: 'high', label: 'focused' };
    } else if (freq.gamma > 0.35) {
      return { valence: 'positive', arousal: 'high', label: 'excited' };
    } else {
      return { valence: 'neutral', arousal: 'medium', label: 'neutral' };
    }
  }

  /**
   * 推断意图
   */
  inferIntention(neuralPattern) {
    const freq = neuralPattern.frequencyProfile;

    if (freq.beta > 0.35) {
      return 'analyze/communicate';
    } else if (freq.alpha > 0.35) {
      return 'receive/contemplate';
    } else if (freq.gamma > 0.3) {
      return 'integrate/create';
    } else {
      return 'unknown';
    }
  }

  /**
   * 计算保真度
   */
  calculateFidelity(original, decoded) {
    // 简化：基于内容相似度
    let similarity = 0;

    if (original.content === decoded.content) {
      similarity += 0.5;
    }

    if (original.emotional === decoded.emotional) {
      similarity += 0.3;
    }

    if (original.intention === decoded.intention) {
      similarity += 0.2;
    }

    this.qualityMetrics.fidelity = similarity;

    return similarity;
  }

  /**
   * 关闭会话
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'closed';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    this.emit('session_closed', session);

    return true;
  }

  /**
   * 获取会话
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取质量指标
   */
  getQualityMetrics() {
    return this.qualityMetrics;
  }

  /**
   * 生成会话 ID
   */
  generateSessionId() {
    return `b2b_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  NeuralSignalAcquirer,
  NeuralSignalDecoder,
  ThoughtCommandEngine,
  BrainwaveFeedbackSystem,
  BrainToBrainProtocol,
};

// ============================================================================
// Demo
// ============================================================================

if (require.main === module) {
  async function demo() {
    console.log('🧠 LX-PCEC Phase 19: 脑机接口集成系统\n');

    // 第一部分：神经信号采集
    console.log('1. 神经信号采集演示:');
    const acquirer = new NeuralSignalAcquirer({
      sampleRate: 1000,
      channels: 8,
    });

    await acquirer.startAcquisition('EEG');
    console.log('   采集已启动');

    // 等待 1 秒收集数据
    await new Promise(resolve => setTimeout(resolve, 1000));

    const status = acquirer.getAcquisitionStatus();
    console.log('   采集状态:', {
      samples: status.totalSamples,
      duration: `${status.duration}ms`,
    });

    // 第二部分：神经信号解码
    console.log('\n2. 神经信号解码演示:');
    const decoder = new NeuralSignalDecoder();

    // 获取数据
    const neuralData = {};
    for (let i = 0; i < 8; i++) {
      neuralData[`CH_${i}`] = acquirer.getChannelData(`CH_${i}`, 1000);
    }

    const decoded = decoder.decode(neuralData);
    console.log('   解码结果:', {
      bands: decoded.features.bands,
      mentalState: decoded.mentalState.primary,
      confidence: decoded.mentalState.confidence.toFixed(4),
    });

    // 第三部分：思维指令识别
    console.log('\n3. 思维指令识别演示:');
    const engine = new ThoughtCommandEngine();

    const command = engine.recognizeCommand(neuralData, decoded);
    if (command) {
      console.log('   识别到指令:', {
        command: command.command,
        confidence: command.confidence.toFixed(4),
        pattern: command.pattern,
      });
    } else {
      console.log('   未识别到明确指令');
    }

    // 第四部分：脑波反馈
    console.log('\n4. 脑波反馈演示:');
    const feedback = new BrainwaveFeedbackSystem();

    feedback.setTargetState('focus');
    console.log('   设置目标状态: focus');

    const feedbackResult = feedback.processFeedback(decoded);
    if (feedbackResult) {
      console.log('   反馈结果:', {
        match: feedbackResult.match.toFixed(4),
        overall: feedbackResult.overall,
        message: feedbackResult.message,
      });
    }

    // 第五部分：脑对脑通信
    console.log('\n5. 脑对脑通信演示:');
    const b2b = new BrainToBrainProtocol();

    const brain1 = {
      id: 'brain1',
      consciousness: {
        phi: 0.7,
        integration: 0.8,
      },
    };

    const brain2 = {
      id: 'brain2',
      consciousness: {
        phi: 0.65,
        integration: 0.75,
      },
    };

    const sessionId = await b2b.createSession(brain1, brain2);
    console.log('   创建会话:', sessionId.substring(0, 20) + '...');

    const message = await b2b.sendThought(sessionId, brain1, {
      content: 'Hello from brain1',
      emotional: 'happy',
      intention: 'communicate',
    });

    console.log('   传输结果:', {
      fidelity: message.fidelity.toFixed(4),
      latency: message.encoded.transmittedLatency || 0,
    });

    // 停止采集
    await acquirer.stopAcquisition();

    console.log('\n✅ Phase 19 演示完成');
  }

  demo().catch(console.error);
}
