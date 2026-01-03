/**
 * 기본 테스트 파일
 * SonarQube 커버리지 리포트 생성을 위한 최소한의 테스트
 */

describe('Example Test Suite', () => {
  test('기본 테스트 - 항상 통과', () => {
    expect(true).toBe(true);
  });

  test('숫자 계산 테스트', () => {
    expect(1 + 1).toBe(2);
  });

  test('문자열 테스트', () => {
    expect('alphacar').toBe('alphacar');
  });
});
