// Event-Driven Automation: Prometheus Alertmanager + AWS Lambda
// 반복적인 문제 해결 워크플로우

class EventDrivenAutomation {
  constructor(remediationEngine, anomalyDetector, bedrockClient) {
    this.remediationEngine = remediationEngine;
    this.anomalyDetector = anomalyDetector;
    this.bedrockClient = bedrockClient;
    this.activeWorkflows = new Map(); // workflowId -> workflow state
  }

  /**
   * Alertmanager에서 알림을 받아 워크플로우 시작
   */
  async startWorkflow(alert) {
    const workflowId = this.generateWorkflowId();
    
    const workflow = {
      id: workflowId,
      alert: alert,
      status: 'analyzing',
      attempts: [],
      currentAttempt: null,
      startTime: new Date().toISOString(),
      requiresApproval: true,
      resolved: false
    };

    this.activeWorkflows.set(workflowId, workflow);

    // 1단계: AI 분석 및 해결책 제시
    const solution = await this.analyzeAndProposeSolution(alert);
    workflow.currentAttempt = {
      attemptNumber: 1,
      solution: solution,
      status: 'pending_approval',
      proposedAt: new Date().toISOString()
    };

    return {
      workflowId,
      solution,
      requiresApproval: true,
      message: 'AI가 해결책을 제안했습니다. 승인하시겠습니까?'
    };
  }

  /**
   * 엔지니어가 해결책 승인/거부
   */
  async approveSolution(workflowId, approved) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!approved) {
      workflow.status = 'rejected';
      workflow.currentAttempt.status = 'rejected';
      workflow.currentAttempt.rejectedAt = new Date().toISOString();
      return {
        workflowId,
        status: 'rejected',
        message: '해결책이 거부되었습니다.'
      };
    }

    // 승인된 경우 실행
    workflow.currentAttempt.status = 'approved';
    workflow.currentAttempt.approvedAt = new Date().toISOString();
    workflow.status = 'executing';

    try {
      // 시나리오 실행
      const execution = await this.remediationEngine.executeScenario(
        workflow.alert,
        workflow.currentAttempt.solution.scenarioId,
        { autoApprove: true }
      );

      workflow.currentAttempt.execution = execution;
      workflow.currentAttempt.status = 'executed';
      workflow.currentAttempt.executedAt = new Date().toISOString();

      // 실행 결과를 attempts에 추가
      workflow.attempts.push(workflow.currentAttempt);

      // 2단계: 결과 확인 및 재분석
      return await this.verifyAndReanalyze(workflowId);

    } catch (error) {
      workflow.currentAttempt.status = 'failed';
      workflow.currentAttempt.error = error.message;
      workflow.status = 'failed';
      
      return {
        workflowId,
        status: 'failed',
        error: error.message,
        message: '실행 중 오류가 발생했습니다. 재시도하시겠습니까?'
      };
    }
  }

  /**
   * 실행 결과 확인 및 재분석
   */
  async verifyAndReanalyze(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    
    // 잠시 대기 후 상태 확인 (실제로는 메트릭/로그를 다시 확인)
    await this.sleep(10000); // 10초 대기

    // 현재 상태 재확인
    const currentState = await this.checkCurrentState(workflow.alert);
    
    // AI가 다시 분석
    const reanalysis = await this.reanalyzeSituation(workflow.alert, currentState, workflow.attempts);
    
    if (reanalysis.resolved) {
      // 문제 해결됨
      workflow.status = 'resolved';
      workflow.resolved = true;
      workflow.resolvedAt = new Date().toISOString();
      
      return {
        workflowId,
        status: 'resolved',
        message: '문제가 해결되었습니다!',
        attempts: workflow.attempts.length,
        finalState: currentState
      };
    } else {
      // 아직 해결되지 않음 - 새로운 해결책 제시
      const newSolution = await this.analyzeAndProposeSolution(
        workflow.alert,
        workflow.attempts // 이전 시도들을 고려
      );

      workflow.currentAttempt = {
        attemptNumber: workflow.attempts.length + 1,
        solution: newSolution,
        status: 'pending_approval',
        proposedAt: new Date().toISOString(),
        previousAttempts: workflow.attempts.length
      };

      workflow.status = 'analyzing';

      return {
        workflowId,
        status: 'needs_retry',
        solution: newSolution,
        requiresApproval: true,
        message: `이전 시도로 문제가 해결되지 않았습니다. 새로운 해결책을 제안합니다. (시도 ${workflow.attempts.length + 1})`,
        previousAttempts: workflow.attempts.length
      };
    }
  }

  /**
   * AI가 상황을 분석하고 해결책 제시
   */
  async analyzeAndProposeSolution(alert, previousAttempts = []) {
    const prompt = this.buildSolutionPrompt(alert, previousAttempts);
    const systemPrompt = `You are an AIOps expert. Analyze the alert and propose a remediation solution.
Consider previous attempts if any. Provide a clear solution with scenario ID.`;

    const analysis = await this.bedrockClient(prompt, systemPrompt);
    
    // 분석 결과 파싱
    const solution = this.parseSolution(analysis, previousAttempts);
    
    return solution;
  }

  /**
   * 현재 상태 확인
   */
  async checkCurrentState(alert) {
    // 실제로는 Prometheus 메트릭이나 Kubernetes 상태를 다시 확인
    // 여기서는 간단한 예시
    return {
      timestamp: new Date().toISOString(),
      alertStatus: 'firing', // 또는 'resolved'
      metrics: {},
      logs: []
    };
  }

  /**
   * AI가 상황 재분석
   */
  async reanalyzeSituation(alert, currentState, previousAttempts) {
    const prompt = `다음 알림에 대해 해결책을 시도했습니다:
알림: ${JSON.stringify(alert, null, 2)}
현재 상태: ${JSON.stringify(currentState, null, 2)}
이전 시도: ${JSON.stringify(previousAttempts.map(a => ({
  attempt: a.attemptNumber,
  solution: a.solution,
  result: a.execution?.result
})), null, 2))}

문제가 해결되었는지 분석하고, 해결되지 않았다면 새로운 해결책을 제시하세요.
응답 형식: {"resolved": true/false, "reason": "이유", "newSolution": {...}}`;

    const analysis = await this.bedrockClient(prompt, this.getReanalysisSystemPrompt());
    
    return this.parseReanalysis(analysis);
  }

  /**
   * 해결책 프롬프트 생성
   */
  buildSolutionPrompt(alert, previousAttempts) {
    let prompt = `다음 Prometheus 알림에 대한 해결책을 제시하세요:\n\n`;
    prompt += `알림 정보:\n${JSON.stringify(alert, null, 2)}\n\n`;

    if (previousAttempts.length > 0) {
      prompt += `이전 시도:\n${JSON.stringify(previousAttempts.map(a => ({
        attempt: a.attemptNumber,
        solution: a.solution,
        result: a.execution?.result
      })), null, 2)}\n\n`;
      prompt += `이전 시도들이 효과가 없었습니다. 다른 접근 방법을 제시하세요.\n\n`;
    }

    prompt += `사용 가능한 시나리오:
- pod-crashloop-restart: Pod 재시작
- high-cpu-scale-up: CPU 부하 시 스케일업
- oom-increase-memory: 메모리 제한 증가
- pod-crashloop-restart: Pod 자동 재시작
- node-failure-drain: 노드 장애 시 Pod 이동

응답 형식:
{
  "scenarioId": "시나리오 ID",
  "reason": "이 해결책을 선택한 이유",
  "expectedOutcome": "예상 결과",
  "confidence": 85
}`;

    return prompt;
  }

  /**
   * 해결책 파싱
   */
  parseSolution(analysis, previousAttempts) {
    try {
      // JSON 파싱 시도
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          scenarioId: parsed.scenarioId || 'pod-crashloop-restart',
          reason: parsed.reason || 'AI 분석 결과',
          expectedOutcome: parsed.expectedOutcome || '문제 해결 예상',
          confidence: parsed.confidence || 80
        };
      }
    } catch (error) {
      console.error('Failed to parse solution:', error);
    }

    // 기본값 반환
    return {
      scenarioId: 'pod-crashloop-restart',
      reason: 'AI 분석 결과에 따른 기본 해결책',
      expectedOutcome: '문제 해결 예상',
      confidence: 70
    };
  }

  /**
   * 재분석 결과 파싱
   */
  parseReanalysis(analysis) {
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          resolved: parsed.resolved === true || parsed.resolved === 'true',
          reason: parsed.reason || '분석 중',
          newSolution: parsed.newSolution || null
        };
      }
    } catch (error) {
      console.error('Failed to parse reanalysis:', error);
    }

    return {
      resolved: false,
      reason: '분석 실패',
      newSolution: null
    };
  }

  getReanalysisSystemPrompt() {
    return `You are an AIOps expert analyzing remediation results. 
Determine if the problem is resolved and if not, propose a new solution.
Be concise and accurate.`;
  }

  generateWorkflowId() {
    return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 워크플로우 상태 조회
   */
  getWorkflow(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * 활성 워크플로우 목록
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }
}

module.exports = EventDrivenAutomation;
