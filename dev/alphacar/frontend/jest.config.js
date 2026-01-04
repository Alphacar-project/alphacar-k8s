const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 next.config.js와 .env 파일을 로드합니다
  dir: './',
})

// Jest에 추가 설정을 제공합니다
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // 테스트 파일이 없어도 오류로 처리하지 않음
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
}

// createJestConfig는 이렇게 내보내집니다
const jestConfig = createJestConfig(customJestConfig)

// 커버리지 설정을 명시적으로 추가 (nextJest가 덮어쓰지 않도록)
module.exports = {
  ...jestConfig,
  // 커버리지 수집 활성화
  collectCoverage: true,
  // 커버리지 수집 대상 (lib, utils, services만 포함)
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
  ],
  // 커버리지 리포트 형식
  coverageReporters: ['lcov', 'text', 'json', 'html'],
  // 커버리지 리포트 저장 디렉토리
  coverageDirectory: 'coverage',
}
