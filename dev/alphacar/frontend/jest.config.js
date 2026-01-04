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
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // 🔥 커버리지 설정 (명시적으로 강제)
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

const jestConfig = createJestConfig(customJestConfig)

// 🔥 nextJest가 커버리지 설정을 덮어쓰지 않도록 명시적으로 적용
module.exports = {
  ...jestConfig,
  // 커버리지 설정 강제 적용
  collectCoverage: true,
  collectCoverageFrom: customJestConfig.collectCoverageFrom,
  coverageReporters: customJestConfig.coverageReporters,
  coverageDirectory: customJestConfig.coverageDirectory,
  // 테스트 매칭 설정
  testMatch: customJestConfig.testMatch,
  testPathIgnorePatterns: customJestConfig.testPathIgnorePatterns,
  // 🔥 TypeScript 변환 설정 유지 (nextJest의 transform 필수!)
  transform: jestConfig.transform,
  transformIgnorePatterns: jestConfig.transformIgnorePatterns,
}
