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
  ],
  // 커버리지에서 제외할 경로 (app, components, pages 제외)
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/app/',
    '/components/',
    '/pages/',
  ],
  // 커버리지 리포트 형식
  coverageReporters: ['lcov', 'text', 'json'],
  // 커버리지 리포트 저장 디렉토리
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

// createJestConfig는 이렇게 내보내집니다
module.exports = createJestConfig(customJestConfig)
