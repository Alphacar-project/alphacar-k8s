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
  // __tests__ 디렉토리의 .test. 또는 .spec. 파일만 테스트 (엄격한 패턴)
  testMatch: [
    '<rootDir>/__tests__/**/*.test.[jt]s?(x)',
    '<rootDir>/__tests__/**/*.spec.[jt]s?(x)',
  ],
  // 존재하지 않는 파일 발견 방지 (강화된 무시 패턴)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/lib/',
    '/utils/',
    '/services/',
    '/app/',
    '/components/',
    '/pages/',
  ],
  // TypeScript 파일 확장자 명시
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // TypeScript 변환 보장 (next/jest가 처리하지만 명시적으로 설정)
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

const jestConfig = createJestConfig(customJestConfig)

module.exports = {
  ...jestConfig,
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
  coverageReporters: ['lcov', 'text', 'json', 'html'],
  coverageDirectory: 'coverage',
}
