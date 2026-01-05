// AWS Lambda를 통한 시나리오 실행 (선택적)
const AWS = require('aws-sdk');

class LambdaExecutor {
  constructor() {
    this.lambda = new AWS.Lambda({
      region: process.env.AWS_REGION || 'ap-northeast-2'
    });
    this.functionName = process.env.REMEDIATION_LAMBDA_FUNCTION || 'k8s-remediation-executor';
  }

  async executeScenario(anomaly, scenarioId, steps) {
    try {
      const payload = {
        anomaly,
        scenarioId,
        steps,
        timestamp: new Date().toISOString()
      };

      const params = {
        FunctionName: this.functionName,
        InvocationType: 'RequestResponse', // 동기 실행
        Payload: JSON.stringify(payload)
      };

      console.log(`Invoking Lambda function: ${this.functionName}`);
      const result = await this.lambda.invoke(params).promise();
      
      if (result.FunctionError) {
        throw new Error(`Lambda execution failed: ${result.FunctionError}`);
      }

      const response = JSON.parse(result.Payload);
      return response;
    } catch (error) {
      console.error('Lambda execution error:', error);
      throw error;
    }
  }

  async executeStep(step, anomaly) {
    // Lambda를 통한 단계별 실행
    return await this.executeScenario(anomaly, step.id, [step]);
  }
}

module.exports = LambdaExecutor;
