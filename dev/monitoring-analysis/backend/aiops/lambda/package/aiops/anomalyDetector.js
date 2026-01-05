// 실시간 이상 탐지 및 근본 원인 분석 엔진

class AnomalyDetector {
  constructor(bedrockClient) {
    this.bedrockClient = bedrockClient;
    this.detectionRules = this.loadDetectionRules();
    this.historicalBaseline = new Map();
  }

  async detectAnomalies(metrics, logs, events) {
    const anomalies = [];

    // 1. 통계적 이상 탐지
    const statisticalAnomalies = await this.statisticalDetection(metrics);
    anomalies.push(...statisticalAnomalies);

    // 2. ML 기반 이상 탐지 (Bedrock 활용)
    const mlAnomalies = await this.mlDetection(metrics, logs, events);
    anomalies.push(...mlAnomalies);

    // 3. 패턴 기반 이상 탐지
    const patternAnomalies = await this.patternDetection(logs, events);
    anomalies.push(...patternAnomalies);

    // 4. 통합 및 우선순위 결정
    const mergedAnomalies = this.mergeAndPrioritize(anomalies);

    // 5. 근본 원인 분석 (RCA)
    for (const anomaly of mergedAnomalies) {
      try {
        anomaly.rootCause = await this.analyzeRootCause(anomaly, metrics, logs, events);
        anomaly.recommendedScenarios = this.recommendScenarios(anomaly);
      } catch (error) {
        console.error('Root cause analysis failed:', error);
        anomaly.rootCause = {
          primaryCause: '분석 중 오류 발생',
          confidence: 0
        };
      }
    }

    return mergedAnomalies;
  }

  async statisticalDetection(metrics) {
    const anomalies = [];

    for (const metric of metrics) {
      if (!metric.values || metric.values.length === 0) continue;

      const values = metric.values.map(v => v.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // 3-sigma 규칙: 평균에서 3 표준편차 이상 벗어난 값
      const threshold = mean + (3 * stdDev);
      const lowerThreshold = mean - (3 * stdDev);

      for (const value of metric.values) {
        if (value.value > threshold || value.value < lowerThreshold) {
          anomalies.push({
            id: this.generateAnomalyId(),
            type: 'statistical',
            severity: this.calculateSeverity(value.value, mean, stdDev),
            metric: metric.name,
            value: value.value,
            expected: mean,
            deviation: Math.abs(value.value - mean) / stdDev,
            location: this.extractLocation(metric, value),
            timestamp: new Date(value.timestamp * 1000).toISOString(),
            labels: value.labels || {}
          });
        }
      }
    }

    return anomalies;
  }

  async mlDetection(metrics, logs, events) {
    // Bedrock을 사용한 ML 기반 이상 탐지
    if (!this.bedrockClient) {
      return [];
    }

    try {
      const prompt = this.buildMLDetectionPrompt(metrics, logs, events);
      const analysis = await this.bedrockClient(prompt, this.getMLSystemPrompt());

      // Bedrock 응답이 null이면 빈 배열 반환
      if (!analysis) {
        return [];
      }

      // Bedrock 응답을 파싱하여 이상 징후 추출
      return this.parseMLResponse(analysis);
    } catch (error) {
      console.error('ML detection failed:', error);
      return [];
    }
  }

  async patternDetection(logs, events) {
    const anomalies = [];

    // 에러 로그 패턴 탐지
    const errorPatterns = [
      /error|exception|fatal|critical/i,
      /timeout|connection.*refused/i,
      /out of memory|oom/i,
      /crash|panic/i
    ];

    for (const log of logs) {
      const logMessage = log.message || log.text || '';
      for (const pattern of errorPatterns) {
        if (pattern.test(logMessage)) {
          anomalies.push({
            id: this.generateAnomalyId(),
            type: 'pattern',
            severity: this.getLogSeverity(logMessage),
            metric: 'log_error',
            value: 1,
            location: log.source || 'unknown',
            timestamp: log.timestamp || new Date().toISOString(),
            message: logMessage.substring(0, 200),
            pattern: pattern.toString()
          });
          break;
        }
      }
    }

    // 이벤트 패턴 탐지
    const criticalEvents = events.filter(e => 
      e.type === 'Warning' || e.type === 'Error' || e.reason === 'Failed'
    );

    for (const event of criticalEvents) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'event',
        severity: event.type === 'Error' ? 'critical' : 'warning',
        metric: 'event_' + event.reason,
        value: 1,
        location: event.source || 'unknown',
        timestamp: event.timestamp || new Date().toISOString(),
        reason: event.reason,
        message: event.message
      });
    }

    return anomalies;
  }

  mergeAndPrioritize(anomalies) {
    // 중복 제거 및 우선순위 결정
    const merged = new Map();

    for (const anomaly of anomalies) {
      const key = `${anomaly.metric}_${anomaly.location}_${anomaly.type}`;
      
      if (!merged.has(key) || this.getSeverityWeight(anomaly.severity) > this.getSeverityWeight(merged.get(key).severity)) {
        merged.set(key, anomaly);
      }
    }

    // 심각도별 정렬
    const sorted = Array.from(merged.values()).sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

    return sorted;
  }

  async analyzeRootCause(anomaly, metrics, logs, events) {
    if (!this.bedrockClient) {
      return {
        primaryCause: 'AI 분석을 사용할 수 없습니다',
        contributingFactors: [],
        confidence: 0,
        evidence: []
      };
    }

    try {
      const prompt = this.buildRCAPrompt(anomaly, metrics, logs, events);
      const analysis = await this.bedrockClient(prompt, this.getRCASystemPrompt());

      // Bedrock 응답이 null이면 기본 응답 반환
      if (!analysis) {
        return {
          primaryCause: 'AI 분석 결과를 받을 수 없습니다',
          contributingFactors: [],
          confidence: 0,
          evidence: []
        };
      }

      return this.parseRCAResponse(analysis);
    } catch (error) {
      console.error('Root cause analysis failed:', error);
      return {
        primaryCause: '분석 중 오류 발생: ' + error.message,
        contributingFactors: [],
        confidence: 0,
        evidence: []
      };
    }
  }

  buildRCAPrompt(anomaly, metrics, logs, events) {
    const relevantMetrics = metrics.filter(m => 
      m.name.includes(anomaly.metric) || 
      (anomaly.labels && Object.keys(anomaly.labels).some(key => 
        m.values && m.values.some(v => v.labels && v.labels[key] === anomaly.labels[key])
      ))
    ).slice(0, 10);

    const relevantLogs = logs.filter(l => 
      l.source === anomaly.location || 
      (l.message && l.message.toLowerCase().includes(anomaly.metric.toLowerCase()))
    ).slice(0, 50);

    const relevantEvents = events.filter(e => 
      e.source === anomaly.location || 
      e.timestamp === anomaly.timestamp
    ).slice(0, 20);

    return `다음 이상 징후에 대한 근본 원인을 분석해주세요:

이상 징후:
- ID: ${anomaly.id}
- 타입: ${anomaly.type}
- 심각도: ${anomaly.severity}
- 메트릭: ${anomaly.metric}
- 값: ${anomaly.value}
- 위치: ${anomaly.location}
- 시간: ${anomaly.timestamp}
${anomaly.message ? `- 메시지: ${anomaly.message}` : ''}

관련 메트릭 (최근 데이터):
${JSON.stringify(relevantMetrics.map(m => ({
  name: m.name,
  values: m.values?.slice(-5).map(v => ({ value: v.value, labels: v.labels }))
})), null, 2)}

관련 로그 (최근):
${JSON.stringify(relevantLogs.map(l => ({
  timestamp: l.timestamp,
  message: l.message?.substring(0, 200),
  level: l.level
})), null, 2)}

관련 이벤트:
${JSON.stringify(relevantEvents.map(e => ({
  timestamp: e.timestamp,
  type: e.type,
  reason: e.reason,
  message: e.message
})), null, 2)}

다음 JSON 형식으로 분석 결과를 반환해주세요:
{
  "primaryCause": "주요 원인 설명",
  "contributingFactors": ["기여 요인 1", "기여 요인 2"],
  "confidence": 85,
  "evidence": ["증거 1", "증거 2"]
}`;
  }

  getRCASystemPrompt() {
    return `You are an expert infrastructure analyst specializing in root cause analysis. 
Analyze the provided anomaly data and identify the root cause with high confidence.
Provide specific, actionable insights based on the metrics, logs, and events.
Respond only with valid JSON in the requested format.`;
  }

  buildMLDetectionPrompt(metrics, logs, events) {
    return `다음 인프라 데이터를 분석하여 이상 징후를 탐지해주세요:

메트릭 샘플:
${JSON.stringify(metrics.slice(0, 20).map(m => ({
  name: m.name,
  recentValues: m.values?.slice(-10).map(v => v.value)
})), null, 2)}

로그 샘플:
${JSON.stringify(logs.slice(0, 30).map(l => ({
  timestamp: l.timestamp,
  message: l.message?.substring(0, 100),
  level: l.level
})), null, 2)}

이벤트 샘플:
${JSON.stringify(events.slice(0, 20), null, 2)}

이상 징후가 발견되면 다음 형식으로 반환해주세요:
{
  "anomalies": [
    {
      "type": "anomaly_type",
      "severity": "critical|warning|info",
      "metric": "metric_name",
      "value": 123,
      "location": "location_info",
      "description": "이상 징후 설명"
    }
  ]
}`;
  }

  getMLSystemPrompt() {
    return `You are an AIOps system that detects anomalies in infrastructure monitoring data.
Identify patterns, outliers, and potential issues in metrics, logs, and events.
Respond only with valid JSON in the requested format.`;
  }

  parseMLResponse(response) {
    try {
      // Bedrock 응답에서 JSON 추출
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.anomalies || []).map(a => ({
          id: this.generateAnomalyId(),
          ...a,
          type: a.type || 'ml_detected',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to parse ML response:', error);
    }
    return [];
  }

  parseRCAResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse RCA response:', error);
    }

    // 기본 응답
    return {
      primaryCause: response.substring(0, 200) || '분석 결과를 파싱할 수 없습니다',
      contributingFactors: [],
      confidence: 50,
      evidence: []
    };
  }

  recommendScenarios(anomaly) {
    const scenarios = [];

    // 이상 징후 유형에 따른 시나리오 추천
    if (anomaly.metric.includes('CrashLoopBackOff') || anomaly.metric.includes('restart')) {
      scenarios.push({ id: 'pod-crashloop-restart', name: 'Pod 자동 재시작' });
    }

    if (anomaly.metric.includes('cpu') && anomaly.severity === 'critical') {
      scenarios.push({ id: 'high-cpu-scale-up', name: 'CPU 부하 스케일업' });
    }

    if (anomaly.metric.includes('memory') || anomaly.metric.includes('oom')) {
      scenarios.push({ id: 'oom-increase-memory', name: '메모리 제한 증가' });
    }

    if (anomaly.metric.includes('Node') && anomaly.metric.includes('NotReady')) {
      scenarios.push({ id: 'node-failure-drain', name: '노드 드레인 및 Pod 이동' });
    }

    if (anomaly.metric.includes('Pending')) {
      scenarios.push({ id: 'pending-scale-nodes', name: '노드 스케일링' });
    }

    return scenarios;
  }

  calculateSeverity(value, mean, stdDev) {
    const deviation = Math.abs(value - mean) / stdDev;
    if (deviation > 5) return 'critical';
    if (deviation > 3) return 'warning';
    return 'info';
  }

  getLogSeverity(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('fatal') || lowerMessage.includes('critical')) return 'critical';
    if (lowerMessage.includes('error') || lowerMessage.includes('exception')) return 'warning';
    return 'info';
  }

  getSeverityWeight(severity) {
    const weights = { critical: 3, warning: 2, info: 1 };
    return weights[severity] || 0;
  }

  extractLocation(metric, value) {
    if (value.labels) {
      const namespace = value.labels.namespace || value.labels.kubernetes_namespace;
      const pod = value.labels.pod || value.labels.kubernetes_pod_name;
      const node = value.labels.node || value.labels.instance;
      
      if (namespace && pod) return `${namespace}/${pod}`;
      if (node) return node;
    }
    return 'unknown';
  }

  generateAnomalyId() {
    return 'anomaly_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  loadDetectionRules() {
    return [
      {
        name: 'high_cpu',
        threshold: 85,
        metric: 'cpu_usage',
        severity: 'warning'
      },
      {
        name: 'high_memory',
        threshold: 90,
        metric: 'memory_usage',
        severity: 'critical'
      }
    ];
  }
}

module.exports = AnomalyDetector;
