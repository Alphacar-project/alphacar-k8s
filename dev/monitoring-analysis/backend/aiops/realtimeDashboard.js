// 실시간 대시보드 (WebSocket, 비용 없음)
// WebSocket을 통한 실시간 메트릭 스트리밍 및 알림

const WebSocket = require('ws');

class RealtimeDashboard {
  constructor(server, queryPrometheusFn) {
    this.queryPrometheus = queryPrometheusFn;
    this.wsServer = null;
    this.clients = new Set();
    this.broadcastInterval = null;
    this.lastMetrics = null;
    this.broadcastIntervalMs = 10000; // 10초마다 브로드캐스트 (비용 최적화)

    // WebSocket 서버 초기화
    if (server) {
      this.initialize(server);
    }
  }

  /**
   * WebSocket 서버 초기화
   * @param {http.Server} server - HTTP 서버 인스턴스
   */
  initialize(server) {
    try {
      this.wsServer = new WebSocket.Server({ 
        server,
        path: '/ws',
        perMessageDeflate: false // 압축 비활성화로 CPU 절약
      });

      this.wsServer.on('connection', (ws, req) => {
        console.log(`[WebSocket] 클라이언트 연결: ${req.socket.remoteAddress}`);
        this.clients.add(ws);

        // 기존 메트릭 즉시 전송
        if (this.lastMetrics) {
          this.sendToClient(ws, { 
            type: 'metrics', 
            data: this.lastMetrics,
            timestamp: Date.now()
          });
        }

        // 연결 상태 전송
        this.sendToClient(ws, {
          type: 'connection',
          status: 'connected',
          timestamp: Date.now()
        });

        ws.on('close', () => {
          console.log(`[WebSocket] 클라이언트 연결 해제: ${req.socket.remoteAddress}`);
          this.clients.delete(ws);
        });

        ws.on('error', (error) => {
          console.error('[WebSocket] 오류:', error);
          this.clients.delete(ws);
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleClientMessage(ws, data);
          } catch (error) {
            console.error('[WebSocket] 메시지 파싱 오류:', error);
          }
        });
      });

      console.log('[WebSocket] 서버 초기화 완료: /ws');
      this.startBroadcasting();
    } catch (error) {
      console.error('[WebSocket] 초기화 실패:', error);
    }
  }

  /**
   * 클라이언트 메시지 처리
   * @param {WebSocket} ws - WebSocket 연결
   * @param {object} data - 메시지 데이터
   */
  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;
      case 'subscribe':
        // 특정 메트릭 구독 (향후 확장용)
        console.log(`[WebSocket] 구독 요청: ${data.metric}`);
        break;
      default:
        console.log(`[WebSocket] 알 수 없는 메시지 타입: ${data.type}`);
    }
  }

  /**
   * 클라이언트에게 메시지 전송
   * @param {WebSocket} ws - WebSocket 연결
   * @param {object} data - 전송할 데이터
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('[WebSocket] 전송 오류:', error);
        this.clients.delete(ws);
      }
    }
  }

  /**
   * 모든 클라이언트에게 브로드캐스트
   * @param {object} data - 브로드캐스트할 데이터
   */
  broadcast(data) {
    if (this.clients.size === 0) return;

    const message = JSON.stringify(data);
    const disconnected = [];

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[WebSocket] 브로드캐스트 오류:', error);
          disconnected.push(client);
        }
      } else {
        disconnected.push(client);
      }
    });

    // 연결이 끊어진 클라이언트 제거
    disconnected.forEach(client => this.clients.delete(client));
  }

  /**
   * 메트릭 수집 (기존 Prometheus 쿼리 활용)
   * @returns {Promise<object>} 메트릭 데이터
   */
  async collectMetrics() {
    if (!this.queryPrometheus) {
      return { error: 'Prometheus 쿼리 함수가 설정되지 않았습니다.' };
    }

    const queries = {
      up: 'up',
      cpu: 'rate(container_cpu_usage_seconds_total[5m])',
      memory: 'container_memory_usage_bytes',
      network: 'rate(container_network_receive_bytes_total[5m])'
    };

    const results = {
      timestamp: Date.now(),
      metrics: {}
    };

    for (const [key, query] of Object.entries(queries)) {
      try {
        const data = await this.queryPrometheus(query);
        results.metrics[key] = {
          query,
          data: data.result || [],
          count: data.result ? data.result.length : 0
        };
      } catch (error) {
        console.error(`[WebSocket] 쿼리 ${key} 실패:`, error.message);
        results.metrics[key] = {
          query,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * 주기적 메트릭 브로드캐스트 시작
   * @param {number} interval - 브로드캐스트 간격 (밀리초)
   */
  startBroadcasting(interval = null) {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    const intervalMs = interval || this.broadcastIntervalMs;
    
    this.broadcastInterval = setInterval(async () => {
      if (this.clients.size === 0) return; // 클라이언트가 없으면 스킵

      try {
        const metrics = await this.collectMetrics();
        this.lastMetrics = metrics;
        this.broadcast({ 
          type: 'metrics', 
          data: metrics,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[WebSocket] 메트릭 수집 오류:', error);
      }
    }, intervalMs);

    console.log(`[WebSocket] 브로드캐스트 시작: ${intervalMs}ms 간격`);
  }

  /**
   * 브로드캐스트 중지
   */
  stopBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('[WebSocket] 브로드캐스트 중지');
    }
  }

  /**
   * 이상 징후 알림 브로드캐스트
   * @param {object} anomaly - 이상 징후 정보
   */
  notifyAnomaly(anomaly) {
    this.broadcast({
      type: 'anomaly',
      data: anomaly,
      timestamp: Date.now()
    });
  }

  /**
   * 워크플로우 알림 브로드캐스트
   * @param {object} workflow - 워크플로우 정보
   */
  notifyWorkflow(workflow) {
    this.broadcast({
      type: 'workflow',
      data: workflow,
      timestamp: Date.now()
    });
  }

  /**
   * 예측 인사이트 브로드캐스트
   * @param {object} insight - 예측 인사이트
   */
  notifyPrediction(insight) {
    this.broadcast({
      type: 'prediction',
      data: insight,
      timestamp: Date.now()
    });
  }

  /**
   * 연결된 클라이언트 수 조회
   * @returns {number} 클라이언트 수
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * WebSocket 서버 종료
   */
  close() {
    this.stopBroadcasting();
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();

    if (this.wsServer) {
      this.wsServer.close();
      console.log('[WebSocket] 서버 종료');
    }
  }
}

module.exports = RealtimeDashboard;
