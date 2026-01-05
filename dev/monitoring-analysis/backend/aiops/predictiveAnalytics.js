// 예측 분석 엔진 (통계적 방법 우선, Bedrock 최소 사용)
// 비용 최적화: 통계적 예측을 주로 사용하고, Bedrock은 주기적 요약에만 활용

class PredictiveAnalytics {
  constructor() {
    this.historicalData = new Map(); // 메트릭별 히스토리 { metricName: [{value, timestamp}, ...] }
    this.maxHistorySize = 1000; // 최대 저장 개수
    this.lastSummaryTime = new Map(); // 마지막 AI 요약 시간
  }

  /**
   * 통계적 트렌드 예측 (Bedrock 없이, 비용 없음)
   * @param {string} metricName - 메트릭 이름
   * @param {number[]} values - 값 배열
   * @param {number} hours - 예측할 시간 (시간 단위)
   * @returns {object} 예측 결과
   */
  predictTrend(metricName, values, hours = 24) {
    if (!values || values.length < 10) {
      return { 
        prediction: null, 
        confidence: 0, 
        reason: '데이터 부족 (최소 10개 필요)',
        trend: 'unknown'
      };
    }

    // 선형 회귀로 트렌드 계산
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 미래 값 예측
    const futureX = n + (hours / (24 / n)); // 시간을 인덱스로 변환
    const predictedValue = slope * futureX + intercept;

    // 신뢰도 계산 (R² 근사)
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    const confidence = Math.max(0, Math.min(100, Math.round(r2 * 100)));

    // 트렌드 방향 결정
    let trend = 'stable';
    if (slope > 0.01) trend = 'increasing';
    else if (slope < -0.01) trend = 'decreasing';

    return {
      prediction: Math.max(0, predictedValue),
      confidence,
      trend,
      slope: slope.toFixed(6),
      currentValue: values[values.length - 1],
      changeRate: slope > 0 ? `+${(slope * 100).toFixed(2)}%` : `${(slope * 100).toFixed(2)}%`
    };
  }

  /**
   * 용량 계획 예측
   * @param {string} resource - 리소스 이름 (예: 'cpu', 'memory')
   * @param {number} days - 예측할 일수
   * @returns {object} 용량 예측 결과
   */
  async predictCapacity(resource, days = 7) {
    const history = this.historicalData.get(resource) || [];
    if (history.length < 20) {
      return { 
        prediction: null, 
        reason: '히스토리 데이터 부족 (최소 20개 필요)',
        resource 
      };
    }

    const values = history.map(h => h.value);
    const trend = this.predictTrend(resource, values, days * 24);

    // 임계값 초과 시점 예측
    const threshold = 0.85; // 85% 기준
    const currentValue = values[values.length - 1];
    const daysToThreshold = trend.slope > 0 && trend.prediction 
      ? (threshold - currentValue) / (parseFloat(trend.slope) * (24 / values.length))
      : null;

    return {
      resource,
      currentValue: currentValue.toFixed(4),
      predictedValue: trend.prediction ? trend.prediction.toFixed(4) : null,
      daysToThreshold: daysToThreshold ? Math.max(0, Math.round(daysToThreshold * 10) / 10) : null,
      confidence: trend.confidence,
      trend: trend.trend,
      threshold: threshold
    };
  }

  /**
   * 히스토리 데이터 저장 (메모리 기반, 비용 없음)
   * @param {string} metricName - 메트릭 이름
   * @param {number} value - 값
   * @param {number|string} timestamp - 타임스탬프 (밀리초 또는 ISO 문자열)
   */
  addHistory(metricName, value, timestamp) {
    if (!this.historicalData.has(metricName)) {
      this.historicalData.set(metricName, []);
    }

    const history = this.historicalData.get(metricName);
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    
    history.push({ value, timestamp: ts });

    // 최대 크기 제한 (오래된 데이터 제거)
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * 히스토리 데이터 조회
   * @param {string} metricName - 메트릭 이름
   * @param {number} limit - 최대 개수
   * @returns {array} 히스토리 데이터
   */
  getHistory(metricName, limit = null) {
    const history = this.historicalData.get(metricName) || [];
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * 주기적으로 Bedrock으로 요약 분석 (하루 1회만, 선택적)
   * @param {string} metricName - 메트릭 이름
   * @param {function} bedrockClient - Bedrock 클라이언트 함수
   * @returns {Promise<object|null>} AI 요약 또는 null
   */
  async getAISummary(metricName, bedrockClient = null) {
    if (!bedrockClient) {
      return null; // Bedrock이 없으면 null 반환
    }

    const history = this.historicalData.get(metricName);
    if (!history || history.length < 50) {
      return null;
    }

    // 마지막 요약 시간 확인 (하루 1회만)
    const lastSummary = this.lastSummaryTime.get(metricName);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastSummary && (now - lastSummary) < oneDay) {
      // 캐시된 요약 반환 (구현 시 추가)
      return null;
    }

    // Bedrock 호출 (주기적으로만, 비용 최소화)
    try {
      const values = history.map(h => h.value);
      const stats = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length
      };

      const prompt = `다음 메트릭 "${metricName}"의 통계를 분석하고 요약해주세요:
최소값: ${stats.min.toFixed(2)}
최대값: ${stats.max.toFixed(2)}
평균값: ${stats.avg.toFixed(2)}
데이터 포인트: ${stats.count}개

간단한 요약과 주요 패턴을 한국어로 제공해주세요.`;

      const summary = await bedrockClient(prompt, '당신은 메트릭 분석 전문가입니다.');
      
      if (summary) {
        this.lastSummaryTime.set(metricName, now);
        return { summary, timestamp: now };
      }
    } catch (error) {
      console.error(`AI 요약 생성 실패 (${metricName}):`, error.message);
    }

    return null;
  }

  /**
   * 모든 메트릭의 예측 요약
   * @param {number} hours - 예측 시간
   * @returns {array} 예측 결과 배열
   */
  getAllPredictions(hours = 24) {
    const predictions = [];
    
    for (const [metricName, history] of this.historicalData.entries()) {
      if (history.length < 10) continue;
      
      const values = history.map(h => h.value);
      const prediction = this.predictTrend(metricName, values, hours);
      
      predictions.push({
        metric: metricName,
        ...prediction
      });
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }
}

module.exports = PredictiveAnalytics;
