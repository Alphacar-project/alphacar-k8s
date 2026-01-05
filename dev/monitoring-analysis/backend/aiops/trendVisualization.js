// 트렌드 시각화 데이터 생성 (Prometheus 데이터 활용, 비용 없음)
// Chart.js/D3.js 등에서 사용할 수 있는 형식으로 데이터 변환

class TrendVisualization {
  constructor(predictiveAnalytics, queryPrometheusFn, queryRangeFn = null) {
    this.predictiveAnalytics = predictiveAnalytics;
    this.queryPrometheus = queryPrometheusFn;
    this.queryRange = queryRangeFn; // range query 함수 (선택적)
  }

  /**
   * 트렌드 데이터 생성
   * @param {string} metricName - 메트릭 이름
   * @param {string} timeRange - 시간 범위 (예: '1h', '6h', '24h')
   * @returns {Promise<object|null>} 트렌드 데이터
   */
  async generateTrendData(metricName, timeRange = '1h') {
    if (!this.queryPrometheus) {
      return null;
    }

    try {
      // 메트릭 이름에 따라 쿼리 조정
      let query = metricName;
      
      // rate() 함수가 필요한 메트릭 (카운터 타입)
      if (metricName.includes('cpu_usage_seconds_total') || 
          metricName.includes('_total') && !metricName.includes('_bytes')) {
        // CPU 사용률은 rate() 함수 사용
        query = `sum(rate(${metricName}{container!="POD",container!=""}[5m])) by (pod, namespace)`;
      } else if (metricName.includes('_bytes')) {
        // 메모리 사용량은 직접 조회
        query = `sum(${metricName}{container!="POD",container!=""}) by (pod, namespace)`;
      } else if (metricName === 'up') {
        // up 메트릭은 직접 조회
        query = 'up';
      }
      
      // 시간 범위를 초로 변환
      const timeRangeSeconds = this.parseTimeRange(timeRange);
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - timeRangeSeconds;
      const step = Math.max(60, Math.floor(timeRangeSeconds / 100)); // 최소 60초, 최대 100개 포인트
      
      let data;
      if (this.queryRange) {
        // range query 사용 (시계열 데이터)
        data = await this.queryRange(query, startTime, endTime, `${step}s`);
      } else {
        // 단일 query 사용 (fallback)
        const rangeQuery = `${query}[${timeRange}]`;
        const queryData = await this.queryPrometheus(rangeQuery);
        if (queryData && queryData.result) {
          // 단일 쿼리 결과를 range 형식으로 변환
          data = { result: queryData.result.map(r => ({
            metric: r.metric,
            values: [[r.value[0], r.value[1]]]
          })) };
        } else {
          data = { result: [] };
        }
      }
      
      if (!data || !data.result || data.result.length === 0) {
        return null;
      }
      
      // 시계열 데이터 변환 (range query 형식)
      const timeSeries = [];
      for (const series of data.result) {
        if (series.values && series.values.length > 0) {
          for (const [timestamp, value] of series.values) {
            timeSeries.push({
              timestamp: timestamp * 1000, // 초를 밀리초로
              value: parseFloat(value),
              labels: series.metric || {}
            });
          }
        } else if (series.value) {
          // 단일 값 형식
          timeSeries.push({
            timestamp: series.value[0] * 1000,
            value: parseFloat(series.value[1]),
            labels: series.metric || {}
          });
        }
      }
      
      // 타임스탬프 순으로 정렬
      timeSeries.sort((a, b) => a.timestamp - b.timestamp);
      
      if (timeSeries.length === 0) {
        return null;
      }

      // 값 배열 추출
      const values = timeSeries.map(ts => ts.value);

      // 예측 데이터 추가
      const prediction = this.predictiveAnalytics.predictTrend(metricName, values, 24);

      // 통계 계산
      const stats = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        current: values[values.length - 1],
        count: values.length
      };

      // 변화율 계산
      const changeRate = values.length > 1 
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : 0;

      return {
        metric: metricName,
        timeRange,
        timeSeries,
        prediction: prediction.prediction ? {
          value: prediction.prediction,
          confidence: prediction.confidence,
          trend: prediction.trend,
          slope: prediction.slope
        } : null,
        stats: {
          ...stats,
          changeRate: changeRate.toFixed(2),
          std: this.calculateStdDev(values)
        },
        chartData: this.formatChartData(timeSeries)
      };
    } catch (error) {
      console.error(`트렌드 데이터 생성 실패 (${metricName}):`, error);
      return null;
    }
  }

  /**
   * 여러 메트릭의 트렌드 비교
   * @param {string[]} metrics - 메트릭 이름 배열
   * @param {string} timeRange - 시간 범위
   * @returns {Promise<array>} 트렌드 데이터 배열
   */
  async generateComparisonTrends(metrics, timeRange = '1h') {
    const trends = await Promise.all(
      metrics.map(metric => this.generateTrendData(metric, timeRange))
    );

    return trends.filter(t => t !== null);
  }

  /**
   * Chart.js 형식으로 데이터 포맷팅
   * @param {array} timeSeries - 시계열 데이터
   * @returns {object} Chart.js 형식 데이터
   */
  formatChartData(timeSeries) {
    return {
      labels: timeSeries.map(ts => new Date(ts.timestamp).toLocaleTimeString('ko-KR')),
      datasets: [{
        label: '값',
        data: timeSeries.map(ts => ts.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };
  }

  /**
   * 시간 범위 문자열을 초로 변환
   * @param {string} timeRange - 시간 범위 (예: '1h', '6h', '24h')
   * @returns {number} 초 단위 시간
   */
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // 기본값: 1시간
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  /**
   * 표준편차 계산
   * @param {number[]} values - 값 배열
   * @returns {number} 표준편차
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 히트맵 데이터 생성 (시간대별 패턴)
   * @param {string} metricName - 메트릭 이름
   * @param {number} days - 일수
   * @returns {Promise<object|null>} 히트맵 데이터
   */
  async generateHeatmapData(metricName, days = 7) {
    const timeRange = `${days * 24}h`;
    const trendData = await this.generateTrendData(metricName, timeRange);
    
    if (!trendData || !trendData.timeSeries) {
      return null;
    }

    // 시간대별로 그룹화 (0-23시)
    const hourlyData = {};
    trendData.timeSeries.forEach(ts => {
      const date = new Date(ts.timestamp);
      const hour = date.getHours();
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(ts.value);
    });

    // 시간대별 평균 계산
    const heatmap = Object.entries(hourlyData).map(([hour, values]) => ({
      hour: parseInt(hour),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    })).sort((a, b) => a.hour - b.hour);

    return {
      metric: metricName,
      days,
      heatmap,
      maxValue: Math.max(...heatmap.map(h => h.avg)),
      minValue: Math.min(...heatmap.map(h => h.avg))
    };
  }

  /**
   * 예측 인사이트 생성
   * @param {string} metricName - 메트릭 이름
   * @param {number} hours - 예측 시간
   * @returns {Promise<object|null>} 예측 인사이트
   */
  async generatePredictionInsight(metricName, hours = 24) {
    const history = this.predictiveAnalytics.getHistory(metricName, 100);
    
    if (history.length < 10) {
      return null;
    }

    const values = history.map(h => h.value);
    const prediction = this.predictiveAnalytics.predictTrend(metricName, values, hours);

    if (!prediction.prediction) {
      return null;
    }

    // 임계값 초과 예측
    const currentValue = values[values.length - 1];
    const threshold = 0.85; // 85% 기준
    const predictedExceeds = prediction.prediction > threshold;

    return {
      metric: metricName,
      currentValue: currentValue.toFixed(4),
      predictedValue: prediction.prediction.toFixed(4),
      confidence: prediction.confidence,
      trend: prediction.trend,
      predictedExceeds,
      threshold,
      hours,
      message: predictedExceeds
        ? `${hours}시간 내 ${metricName}이(가) ${threshold * 100}%를 초과할 가능성이 있습니다.`
        : `${hours}시간 내 ${metricName}은(는) 정상 범위 내에 있을 것으로 예상됩니다.`
    };
  }

  /**
   * 여러 메트릭의 예측 인사이트 생성
   * @param {string[]} metrics - 메트릭 이름 배열
   * @param {number} hours - 예측 시간
   * @returns {Promise<array>} 예측 인사이트 배열
   */
  async generateAllPredictionInsights(metrics, hours = 24) {
    const insights = await Promise.all(
      metrics.map(metric => this.generatePredictionInsight(metric, hours))
    );

    return insights
      .filter(i => i !== null)
      .sort((a, b) => {
        // 위험도가 높은 것부터 정렬
        if (a.predictedExceeds && !b.predictedExceeds) return -1;
        if (!a.predictedExceeds && b.predictedExceeds) return 1;
        return b.confidence - a.confidence;
      });
  }
}

module.exports = TrendVisualization;
