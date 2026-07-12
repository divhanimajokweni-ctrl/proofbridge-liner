/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)'
  ],
  modulePathIgnorePatterns: [
    '/\\.cache/',
    '/\\.local/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.cache/',
    '/\\.local/',
    '/e2e/',
    '/tests/',
    '/dist/',
    '/test/',
    '/app/ubuntu-games/ant-feast/__tests__/',
    '/public/vvv/test/',
    'run-all\\.(js|ts)$'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    '!src/lib/watchdog/index.ts'
  ]
};

module.exports = config;