// 자동 학습 시스템 (메모리 기반, 비용 없음)
// 시나리오 효과성, 이상 탐지 정확도, 베이스라인 자동 업데이트

class SelfLearningSystem {
  constructor() {
    this.scenarioEffectiveness = new Map(); // 시나리오별 효과성 점수
    this.falsePositiveRate = new Map(); // 메트릭별 False Positive 비율
    this.baselineHistory = new Map(); // 베이스라인 히스토리
    this.detectionThresholds = new Map(); // 메트릭별 동적 임계값
    this.maxBaselineSize = 2000; // 베이스라인 최대 저장 개수
  }

  /**
   * 시나리오 실행 결과 학습
   * @param {object} execution - 실행 결과
   * @param {string} execution.scenarioId - 시나리오 ID
   * @param {boolean} execution.success - 성공 여부
   * @param {object} execution.anomaly - 이상 징후 정보
   */
  learnFromExecution(execution) {
    const { scenarioId, success, anomaly } = execution;

    if (!scenarioId) {
      console.warn('시나리오 ID가 없어 학습할 수 없습니다.');
      return;
    }

    if (!this.scenarioEffectiveness.has(scenarioId)) {
      this.scenarioEffectiveness.set(scenarioId, {
        total: 0,
        success: 0,
        score: 0.5, // 초기값
        lastUpdate: Date.now()
      });
    }

    const stats = this.scenarioEffectiveness.get(scenarioId);
    stats.total++;
    if (success) stats.success++;
    stats.score = stats.success / stats.total;
    stats.lastUpdate = Date.now();

    console.log(`[자동 학습] 시나리오 ${scenarioId} 효과성 업데이트: ${(stats.score * 100).toFixed(1)}% (${stats.success}/${stats.total})`);
  }

  /**
   * 시나리오 효과성 조회
   * @param {string} scenarioId - 시나리오 ID
   * @returns {object} 효과성 통계
   */
  getScenarioEffectiveness(scenarioId) {
    return this.scenarioEffectiveness.get(scenarioId) || { 
      score: 0.5, 
      total: 0, 
      success: 0,
      lastUpdate: null
    };
  }

  /**
   * 모든 시나리오 효과성 조회
   * @returns {array} 시나리오 효과성 배열
   */
  getAllScenarioEffectiveness() {
    const results = [];
    for (const [scenarioId, stats] of this.scenarioEffectiveness.entries()) {
      results.push({
        scenarioId,
        ...stats
      });
    }
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 이상 탐지 정확도 개선
   * @param {string} metric - 메트릭 이름
   * @param {boolean} isTruePositive - True Positive 여부
   */
  recordDetectionResult(metric, isTruePositive) {
    if (!this.falsePositiveRate.has(metric)) {
      this.falsePositiveRate.set(metric, {
        total: 0,
        truePositive: 0,
        falsePositive: 0,
        falsePositiveRate: 0,
        accuracy: 0.5
      });
    }

    const stats = this.falsePositiveRate.get(metric);
    stats.total++;
    if (isTruePositive) {
      stats.truePositive++;
    } else {
      stats.falsePositive++;
    }
    
    stats.falsePositiveRate = stats.total > 0 ? stats.falsePositive / stats.total : 0;
    stats.accuracy = stats.total > 0 ? stats.truePositive / stats.total : 0.5;
    stats.lastUpdate = Date.now();

    // False Positive 비율이 높으면 임계값 조정 제안
    if (stats.falsePositiveRate > 0.3 && stats.total > 10) {
      console.log(`[자동 학습] ${metric}의 False Positive 비율이 높습니다: ${(stats.falsePositiveRate * 100).toFixed(1)}%`);
    }
  }

  /**
   * 메트릭별 탐지 정확도 조회
   * @param {string} metric - 메트릭 이름
   * @returns {object} 정확도 통계
   */
  getDetectionAccuracy(metric) {
    return this.falsePositiveRate.get(metric) || {
      total: 0,
      truePositive: 0,
      falsePositive: 0,
      falsePositiveRate: 0,
      accuracy: 0.5
    };
  }

  /**
   * 베이스라인 자동 업데이트
   * @param {string} metric - 메트릭 이름
   * @param {number} value - 값
   * @param {number|string} timestamp - 타임스탬프
   */
  updateBaseline(metric, value, timestamp) {
    if (!this.baselineHistory.has(metric)) {
      this.baselineHistory.set(metric, {
        values: [],
        mean: 0,
        std: 0,
        min: Infinity,
        max: -Infinity,
        lastUpdate: null
      });
    }

    const baseline = this.baselineHistory.get(metric);
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    
    baseline.values.push({ value, timestamp: ts });

    // 최근 데이터만 유지
    if (baseline.values.length > this.maxBaselineSize) {
      baseline.values.shift();
    }

    // 통계 재계산
    const values = baseline.values.map(v => v.value);
    baseline.mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - baseline.mean, 2), 0) / values.length;
    baseline.std = Math.sqrt(variance);
    baseline.min = Math.min(...values);
    baseline.max = Math.max(...values);
    baseline.lastUpdate = ts;

    // 동적 임계값 계산 (3-sigma 규칙)
    const upperThreshold = baseline.mean + (3 * baseline.std);
    const lowerThreshold = baseline.mean - (3 * baseline.std);
    
    this.detectionThresholds.set(metric, {
      upper: upperThreshold,
      lower: lowerThreshold,
      mean: baseline.mean,
      std: baseline.std,
      lastUpdate: ts
    });
  }

  /**
   * 베이스라인 조회
   * @param {string} metric - 메트릭 이름
   * @returns {object|null} 베이스라인 정보
   */
  getBaseline(metric) {
    return this.baselineHistory.get(metric) || null;
  }

  /**
   * 동적 임계값 조회
   * @param {string} metric - 메트릭 이름
   * @returns {object|null} 임계값 정보
   */
  getDetectionThreshold(metric) {
    return this.detectionThresholds.get(metric) || null;
  }

  /**
   * 값이 이상인지 판단 (동적 임계값 사용)
   * @param {string} metric - 메트릭 이름
   * @param {number} value - 값
   * @returns {object} 이상 여부 및 정보
   */
  isAnomaly(metric, value) {
    const threshold = this.getDetectionThreshold(metric);
    if (!threshold) {
      return { isAnomaly: false, reason: '임계값 정보 없음' };
    }

    const isUpperAnomaly = value > threshold.upper;
    const isLowerAnomaly = value < threshold.lower;
    const isAnomaly = isUpperAnomaly || isLowerAnomaly;

    return {
      isAnomaly,
      value,
      threshold: {
        upper: threshold.upper,
        lower: threshold.lower,
        mean: threshold.mean
      },
      deviation: isAnomaly 
        ? (value - threshold.mean) / threshold.std 
        : 0,
      type: isUpperAnomaly ? 'upper' : isLowerAnomaly ? 'lower' : 'normal'
    };
  }

  /**
   * 학습 통계 요약
   * @returns {object} 전체 학습 통계
   */
  getLearningStats() {
    return {
      scenarios: {
        total: this.scenarioEffectiveness.size,
        effectiveness: this.getAllScenarioEffectiveness()
      },
      detections: {
        total: this.falsePositiveRate.size,
        metrics: Array.from(this.falsePositiveRate.entries()).map(([metric, stats]) => ({
          metric,
          ...stats
        }))
      },
      baselines: {
        total: this.baselineHistory.size,
        metrics: Array.from(this.baselineHistory.keys())
      }
    };
  }
}

module.exports = SelfLearningSystem;
