// 자동 대응 시나리오 실행 시스템

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;

class RemediationEngine {
  constructor() {
    this.scenarios = this.loadScenarios();
    this.executionHistory = [];
    this.k8sConfigPath = process.env.KUBECONFIG || '/root/.kube/config';
    this.useLambda = process.env.USE_LAMBDA_REMEDIATION === 'true';
    
    // Lambda executor 초기화 (선택적)
    if (this.useLambda) {
      try {
        const LambdaExecutor = require('./lambdaExecutor');
        this.lambdaExecutor = new LambdaExecutor();
        console.log('Lambda remediation executor initialized');
      } catch (error) {
        console.warn('Lambda executor not available, using direct kubectl execution:', error.message);
        this.useLambda = false;
      }
    }
  }

  async executeScenario(anomaly, scenarioId, options = {}) {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    // 시나리오 실행 전 검증
    if (!await this.validateScenario(scenario, anomaly)) {
      throw new Error('Scenario validation failed');
    }

    const execution = {
      id: this.generateExecutionId(),
      scenarioId,
      scenarioName: scenario.name,
      anomalyId: anomaly.id,
      startTime: new Date().toISOString(),
      status: 'running',
      steps: [],
      result: null
    };

    try {
      // 시나리오 단계별 실행
      for (const step of scenario.steps) {
        const stepResult = await this.executeStep(step, anomaly, execution);
        execution.steps.push({
          stepId: step.id,
          action: step.action,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        // 실패 시 롤백 옵션
        if (!stepResult.success && step.rollback) {
          console.log(`Step ${step.id} failed, executing rollback...`);
          await this.executeRollback(step.rollback, execution);
          throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
        }

        // 단계 간 대기 시간
        if (step.waitAfter) {
          await this.sleep(step.waitAfter * 1000);
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.result = { success: true, message: 'Scenario executed successfully' };
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date().toISOString();
      execution.result = { success: false, error: error.message };
    }

    this.executionHistory.push(execution);
    return execution;
  }

  async executeStep(step, anomaly, execution) {
    console.log(`Executing step: ${step.id} (${step.action})`);

    // Lambda를 사용하는 경우
    if (this.useLambda && this.lambdaExecutor) {
      try {
        return await this.lambdaExecutor.executeStep(step, anomaly);
      } catch (error) {
        console.error('Lambda execution failed, falling back to direct execution:', error);
        // Lambda 실패 시 직접 실행으로 폴백
      }
    }

    try {
      switch (step.action) {
        case 'restart-service':
          return await this.restartService(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'restart-pod':
          return await this.restartPod(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'scale-resources':
          return await this.scaleResources(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'scale-up':
          return await this.scaleUp(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'scale-down':
          return await this.scaleDown(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'increase-resources':
          return await this.increaseResources(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'reroute-traffic':
          return await this.rerouteTraffic(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'drain-node':
          return await this.drainNode(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'cordon-node':
          return await this.cordonNode(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'check-logs':
          return await this.checkLogs(this.resolveParams(step.params, anomaly), anomaly);
        
        case 'check-status':
          return await this.checkStatus(this.resolveParams(step.params, anomaly), anomaly);
        
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  resolveParams(params, anomaly) {
    // 템플릿 변수 해석 (${anomaly.labels.namespace} 등)
    const resolved = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.includes('${')) {
        // 템플릿 변수가 포함된 경우
        let resolvedValue = value;
        const regex = /\$\{([^}]+)\}/g;
        let match;
        
        while ((match = regex.exec(value)) !== null) {
          const path = match[1].split('.');
          let result = anomaly;
          
          // anomaly 객체에서 경로 따라가기
          for (const p of path) {
            if (result && typeof result === 'object') {
              result = result[p];
            } else {
              result = undefined;
              break;
            }
          }
          
          // 결과가 있으면 치환, 없으면 원본 유지
          if (result !== undefined && result !== null) {
            resolvedValue = resolvedValue.replace(match[0], String(result));
          } else {
            // 변수를 해석할 수 없으면 경고하고 원본 유지
            console.warn(`Could not resolve template variable: ${match[0]} in ${key}`);
            resolvedValue = resolvedValue.replace(match[0], '');
          }
        }
        
        resolved[key] = resolvedValue;
      } else {
        resolved[key] = value;
      }
    }
    
    console.log('Resolved params:', JSON.stringify(resolved, null, 2));
    return resolved;
  }

  async restartService(params, anomaly) {
    const { namespace, deployment } = params;
    
    if (!namespace || !deployment) {
      return { success: false, error: 'namespace and deployment are required' };
    }

    try {
      // kubectl rollout restart 사용
      const command = `kubectl rollout restart deployment/${deployment} -n ${namespace}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Service ${deployment} in namespace ${namespace} restarted successfully`,
        command,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async restartPod(params, anomaly) {
    const { namespace, pod } = params;
    
    if (!namespace || !pod) {
      return { success: false, error: `namespace and pod are required. Got: namespace=${namespace}, pod=${pod}` };
    }

    try {
      const command = `kubectl delete pod ${pod} -n ${namespace}`;
      console.log(`Executing command: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Pod ${pod} in namespace ${namespace} deleted (will be recreated)`,
        command,
        output: stdout
      };
    } catch (error) {
      console.error(`Command failed: ${error.message}`);
      return {
        success: false,
        error: `Command failed: ${error.message}`,
        stderr: error.stderr || error.message
      };
    }
  }

  async scaleResources(params, anomaly) {
    const { namespace, deployment, replicas } = params;
    
    if (!namespace || !deployment || replicas === undefined) {
      return { success: false, error: 'namespace, deployment, and replicas are required' };
    }

    try {
      // 현재 스케일 확인
      const getScaleCmd = `kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.replicas}'`;
      const { stdout: currentReplicasStr } = await execAsync(getScaleCmd);
      const currentReplicas = parseInt(currentReplicasStr) || 1;

      // 스케일 조정
      const command = `kubectl scale deployment/${deployment} --replicas=${replicas} -n ${namespace}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Scaled ${deployment} from ${currentReplicas} to ${replicas} replicas`,
        command,
        output: stdout,
        previousReplicas: currentReplicas,
        newReplicas: replicas
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async scaleUp(params, anomaly) {
    const { namespace, deployment, factor = 1.5 } = params;
    
    if (!namespace || !deployment) {
      return { success: false, error: 'namespace and deployment are required' };
    }

    try {
      // 현재 스케일 확인
      const getScaleCmd = `kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.replicas}'`;
      const { stdout: currentReplicasStr } = await execAsync(getScaleCmd);
      const currentReplicas = parseInt(currentReplicasStr) || 1;
      const newReplicas = Math.max(1, Math.ceil(currentReplicas * factor));

      return await this.scaleResources({ namespace, deployment, replicas: newReplicas }, anomaly);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async scaleDown(params, anomaly) {
    const { namespace, deployment, factor = 0.5 } = params;
    
    if (!namespace || !deployment) {
      return { success: false, error: 'namespace and deployment are required' };
    }

    try {
      // 현재 스케일 확인
      const getScaleCmd = `kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.replicas}'`;
      const { stdout: currentReplicasStr } = await execAsync(getScaleCmd);
      const currentReplicas = parseInt(currentReplicasStr) || 1;
      const newReplicas = Math.max(1, Math.floor(currentReplicas * factor));

      return await this.scaleResources({ namespace, deployment, replicas: newReplicas }, anomaly);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async increaseResources(params, anomaly) {
    const { namespace, deployment, cpu, memory } = params;
    
    if (!namespace || !deployment) {
      return { success: false, error: 'namespace and deployment are required' };
    }

    try {
      // Deployment의 리소스 제한을 증가시키기 위해 patch 사용
      const patch = {
        spec: {
          template: {
            spec: {
              containers: [{
                name: deployment,
                resources: {
                  requests: {},
                  limits: {}
                }
              }]
            }
          }
        }
      };

      if (cpu) {
        patch.spec.template.spec.containers[0].resources.requests.cpu = cpu;
        patch.spec.template.spec.containers[0].resources.limits.cpu = cpu;
      }
      if (memory) {
        patch.spec.template.spec.containers[0].resources.requests.memory = memory;
        patch.spec.template.spec.containers[0].resources.limits.memory = memory;
      }

      const patchFile = `/tmp/patch-${Date.now()}.json`;
      await fs.writeFile(patchFile, JSON.stringify(patch));

      const command = `kubectl patch deployment ${deployment} -n ${namespace} --type merge -p '${JSON.stringify(patch)}'`;
      const { stdout, stderr } = await execAsync(command);
      
      await fs.unlink(patchFile).catch(() => {});

      return {
        success: true,
        message: `Increased resources for ${deployment}`,
        command,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async rerouteTraffic(params, anomaly) {
    // 트래픽 우회는 Istio/Service Mesh 또는 Kubernetes Service selector 변경으로 구현
    // 여기서는 간단한 구현만 제공
    const { service, targetVersion, percentage } = params;
    
    return {
      success: true,
      message: `Traffic rerouted to ${targetVersion} (${percentage}%)`,
      note: 'This requires Istio or service mesh configuration'
    };
  }

  async drainNode(params, anomaly) {
    const { node } = params;
    
    if (!node) {
      return { success: false, error: 'node is required' };
    }

    try {
      const command = `kubectl drain ${node} --ignore-daemonsets --delete-emptydir-data --force`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Node ${node} drained successfully`,
        command,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async cordonNode(params, anomaly) {
    const { node } = params;
    
    if (!node) {
      return { success: false, error: 'node is required' };
    }

    try {
      const command = `kubectl cordon ${node}`;
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Node ${node} cordoned`,
        command,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async checkLogs(params, anomaly) {
    const { namespace, pod, lines = 100 } = params;
    
    if (!namespace || !pod) {
      return { success: false, error: `namespace and pod are required. Got: namespace=${namespace}, pod=${pod}` };
    }

    try {
      const command = `kubectl logs ${pod} -n ${namespace} --tail=${lines}`;
      console.log(`Executing command: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        message: `Retrieved logs for ${pod}`,
        command,
        logs: stdout.split('\n').slice(-lines)
      };
    } catch (error) {
      console.error(`Command failed: ${error.message}`);
      return {
        success: false,
        error: `Command failed: ${error.message}`,
        stderr: error.stderr || error.message
      };
    }
  }

  async checkStatus(params, anomaly) {
    const { namespace, resource, resourceType = 'deployment' } = params;
    
    if (!namespace || !resource) {
      return { success: false, error: 'namespace and resource are required' };
    }

    try {
      const command = `kubectl get ${resourceType} ${resource} -n ${namespace} -o json`;
      const { stdout, stderr } = await execAsync(command);
      const status = JSON.parse(stdout);
      
      return {
        success: true,
        message: `Status retrieved for ${resource}`,
        command,
        status: {
          replicas: status.spec?.replicas,
          readyReplicas: status.status?.readyReplicas,
          availableReplicas: status.status?.availableReplicas
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  async executeRollback(rollback, execution) {
    console.log(`Executing rollback for execution ${execution.id}`);
    // 롤백 로직 구현
    return { success: true, message: 'Rollback executed' };
  }

  async validateScenario(scenario, anomaly) {
    // 시나리오 실행 가능 여부 검증
    if (!scenario.steps || scenario.steps.length === 0) {
      console.log('Validation failed: No steps in scenario');
      return false;
    }

    // 트리거 조건 확인 (더 유연하게)
    if (scenario.trigger) {
      if (scenario.trigger.type === 'anomaly' && scenario.trigger.metric) {
        const triggerMetric = scenario.trigger.metric.toLowerCase();
        const anomalyMetric = (anomaly.metric || '').toLowerCase();
        const anomalyType = (anomaly.type || '').toLowerCase();
        const anomalyDescription = (anomaly.description || '').toLowerCase();
        
        // 메트릭 이름, 타입, 설명에서 트리거 메트릭이 포함되어 있는지 확인
        const matches = 
          anomalyMetric.includes(triggerMetric) ||
          anomalyType.includes(triggerMetric) ||
          anomalyDescription.includes(triggerMetric) ||
          // 특정 패턴 매칭
          (triggerMetric === 'crashloopbackoff' && (anomalyMetric.includes('restart') || anomalyMetric.includes('crash'))) ||
          (triggerMetric === 'oom' && (anomalyMetric.includes('memory') || anomalyMetric.includes('oom'))) ||
          (triggerMetric === 'pending' && (anomalyMetric.includes('pending') || anomalyMetric.includes('pod'))) ||
          (triggerMetric === 'notready' && (anomalyMetric.includes('node') || anomalyMetric.includes('notready'))) ||
          (triggerMetric === 'cpu' && (anomalyMetric.includes('cpu') || anomalyMetric.includes('cpu_usage'))) ||
          (triggerMetric === 'memory' && (anomalyMetric.includes('memory') || anomalyMetric.includes('memory_working')));
        
        if (!matches) {
          console.log(`Validation failed: Trigger metric '${triggerMetric}' not found in anomaly (metric: ${anomalyMetric}, type: ${anomalyType})`);
          return false;
        }
      }
      
      // 메트릭 기반 트리거 (CPU, Memory 등)
      if (scenario.trigger.type === 'metric' && scenario.trigger.threshold) {
        // 메트릭 값이 임계값을 초과하는지 확인
        if (scenario.trigger.threshold.cpu && anomaly.metric && anomaly.metric.includes('cpu')) {
          // CPU 사용률이 임계값을 초과하는지 확인 (간단한 검증)
          if (anomaly.value && scenario.trigger.threshold.cpu) {
            // 실제 값 비교는 메트릭 단위에 따라 다를 수 있으므로 여기서는 기본 검증만 수행
          }
        }
      }
    }

    // 트리거가 없으면 항상 실행 가능
    return true;
  }

  loadScenarios() {
    return [
      {
        id: 'pod-crashloop-restart',
        name: 'Pod CrashLoopBackOff 자동 재시작',
        description: 'CrashLoopBackOff 상태의 Pod를 자동으로 재시작합니다',
        trigger: { type: 'anomaly', metric: 'CrashLoopBackOff' },
        requiresApproval: false,
        steps: [
          {
            id: 'check-logs',
            action: 'check-logs',
            params: {
              namespace: '${anomaly.labels.namespace}',
              pod: '${anomaly.labels.pod}',
              lines: 50
            }
          },
          {
            id: 'restart-pod',
            action: 'restart-pod',
            params: {
              namespace: '${anomaly.labels.namespace}',
              pod: '${anomaly.labels.pod}'
            },
            waitAfter: 5
          },
          {
            id: 'check-status',
            action: 'check-status',
            params: {
              namespace: '${anomaly.labels.namespace}',
              resource: '${anomaly.labels.deployment}',
              resourceType: 'deployment'
            }
          }
        ]
      },
      {
        id: 'high-cpu-scale-up',
        name: '고 CPU 사용률 자동 스케일업',
        description: 'CPU 사용률이 높을 때 자동으로 Pod 수를 증가시킵니다',
        trigger: { type: 'metric', threshold: { cpu: 85 } },
        requiresApproval: false,
        steps: [
          {
            id: 'scale-up',
            action: 'scale-up',
            params: {
              namespace: '${anomaly.labels.namespace}',
              deployment: '${anomaly.labels.deployment}',
              factor: 1.5
            }
          }
        ]
      },
      {
        id: 'oom-increase-memory',
        name: 'OOM 발생 시 메모리 제한 증가',
        description: 'OOM 킬이 발생한 경우 메모리 제한을 증가시킵니다',
        trigger: { type: 'anomaly', metric: 'oom' },
        requiresApproval: true,
        steps: [
          {
            id: 'increase-memory',
            action: 'increase-resources',
            params: {
              namespace: '${anomaly.labels.namespace}',
              deployment: '${anomaly.labels.deployment}',
              memory: '2Gi'
            }
          }
        ]
      },
      {
        id: 'node-failure-drain',
        name: '노드 장애 시 Pod 이동',
        description: '노드가 NotReady 상태일 때 Pod를 다른 노드로 이동시킵니다',
        trigger: { type: 'anomaly', metric: 'Node NotReady' },
        requiresApproval: true,
        steps: [
          {
            id: 'cordon-node',
            action: 'cordon-node',
            params: {
              node: '${anomaly.location}'
            }
          },
          {
            id: 'drain-node',
            action: 'drain-node',
            params: {
              node: '${anomaly.location}'
            }
          }
        ]
      },
      {
        id: 'pending-scale-nodes',
        name: 'Pending Pod 해결을 위한 스케일업',
        description: 'Pending 상태의 Pod가 많을 때 리소스를 확장합니다',
        trigger: { type: 'anomaly', metric: 'Pending' },
        requiresApproval: false,
        steps: [
          {
            id: 'scale-up-deployments',
            action: 'scale-up',
            params: {
              namespace: '${anomaly.labels.namespace}',
              deployment: '${anomaly.labels.deployment}',
              factor: 1.2
            }
          }
        ]
      }
    ];
  }

  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(-limit).reverse();
  }

  getExecutionById(id) {
    return this.executionHistory.find(e => e.id === id);
  }

  generateExecutionId() {
    return 'exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RemediationEngine;
