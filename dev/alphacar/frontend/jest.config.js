const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // 테스트 파일 찾기 (__tests__ 디렉토리만)
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
  ],
  
  // 🔥 커버리지 설정
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
  ],
  coverageReporters: ['lcov', 'text', 'json'],
  coverageDirectory: 'coverage',
}

// nextJest가 모든 설정을 처리하도록 함 (transform 포함)
const jestConfig = createJestConfig(customJestConfig)

// 커버리지 설정만 명시적으로 덮어쓰기 (transform은 nextJest가 처리)
module.exports = {
  ...jestConfig,
  collectCoverage: true,
  collectCoverageFrom: customJestConfig.collectCoverageFrom,
  coverageReporters: customJestConfig.coverageReporters,
  coverageDirectory: customJestConfig.coverageDirectory,
  testMatch: customJestConfig.testMatch,
  testPathIgnorePatterns: customJestConfig.testPathIgnorePatterns,
}
