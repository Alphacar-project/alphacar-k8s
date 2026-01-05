// AWS Lambda Handler for Prometheus Alertmanager Webhook
// Event-Driven Automation 진입점

// Lambda 환경에서는 직접 HTTP 요청으로 백엔드 API 호출
const https = require('https');
const http = require('http');

// 백엔드 API URL (환경 변수 또는 기본값)
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://monitoring-analysis-backend.apc-obsv-ns.svc.cluster.local:5000';

function callBackendAPI(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BACKEND_API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Lambda Handler: Alertmanager Webhook 수신
 */
exports.handler = async (event) => {
  console.log('Received Alertmanager webhook:', JSON.stringify(event, null, 2));

  try {
    // Alertmanager webhook 형식 파싱
    // event는 이미 파싱된 객체이거나 raw body일 수 있음
    let alerts = [];
    
    if (event.alerts) {
      alerts = event.alerts;
    } else if (event.body) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      alerts = body.alerts || [];
    } else if (Array.isArray(event)) {
      alerts = event;
    }
    
    const results = [];
    
    for (const alert of alerts) {
      // 'firing' 상태의 알림만 처리
      if (alert.status === 'firing') {
        try {
          // 백엔드 API를 통해 워크플로우 시작
          const workflow = await callBackendAPI('/api/aiops/workflows', 'POST', {
            alerts: [alert]
          });

          if (workflow.success && workflow.workflows && workflow.workflows.length > 0) {
            results.push(...workflow.workflows);
          }
        } catch (error) {
          console.error(`Error starting workflow for alert ${alert.fingerprint}:`, error);
          results.push({
            alert: alert.fingerprint,
            error: error.message
          });
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        workflows: results,
        message: `${results.length}개의 워크플로우가 시작되었습니다.`
      })
    };

  } catch (error) {
    console.error('Error processing Alertmanager webhook:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

/**
 * 승인 알림 전송 (Slack, 이메일 등)
 */
async function sendApprovalNotification(workflows) {
  // 실제로는 Slack, 이메일, 또는 다른 채널로 전송
  console.log('Approval required for workflows:', workflows);
  
  // TODO: Slack webhook 또는 SNS를 통한 알림 전송
  // 예시:
  // await sendSlackMessage({
  //   text: `${workflows.length}개의 해결책 승인이 필요합니다.`,
  //   attachments: workflows.map(w => ({
  //     title: `워크플로우 ${w.workflowId}`,
  //     text: w.message,
  //     actions: [
  //       { type: 'button', text: '승인', value: `approve:${w.workflowId}` },
  //       { type: 'button', text: '거부', value: `reject:${w.workflowId}` }
  //     ]
  //   }))
  // });
}
