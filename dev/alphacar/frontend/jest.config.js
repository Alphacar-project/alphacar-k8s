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
  
  // 커버리지 계산 켜기
  collectCoverage: true,
  
  // 🔥 커버리지 대상 (UI 전부 제외, 로직만 포함)
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
  
  // 🔥 Next.js / UI 영역 전부 제외
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/app/',
    '/components/',
    '/pages/',
    '/.next/',
  ],
  
  // SonarQube가 읽는 포맷
  coverageReporters: ['lcov', 'text'],
  
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(test).[tj]s?(x)',
  ],
}

// createJestConfig는 이렇게 내보내집니다
module.exports = createJestConfig(customJestConfig)
