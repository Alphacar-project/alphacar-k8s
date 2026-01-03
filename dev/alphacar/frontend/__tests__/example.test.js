/**
 * 기본 테스트 파일
 * SonarQube 커버리지 리포트 생성을 위한 최소한의 테스트
 * Updated: 2026-01-03 - SonarQube 분석 트리거를 위한 업데이트
 * Updated: 2026-01-03 - Jenkins 빌드 트리거를 위한 업데이트
 */

describe('Example Test Suite', () => {
  test('기본 테스트 - 항상 통과', () => {
    expect(true).toBe(true);
  });

  test('숫자 계산 테스트', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 2).toBe(4);
  });

  test('문자열 테스트', () => {
    expect('alphacar').toBe('alphacar');
    expect('alphacar'.toUpperCase()).toBe('ALPHACAR');
  });

  test('배열 테스트', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
});
