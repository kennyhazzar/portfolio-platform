/* eslint-disable */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  rootDir: './',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { diagnostics: false }],
  },
  // Unit specs live next to their source files under apps/backend and apps/auth-service.
  // apps/frontend is a separate Next.js/React workspace package with its own test runner —
  // deliberately excluded so this Node/commonjs/ts-jest config never tries to run its specs.
  testMatch: ['<rootDir>/apps/backend/**/*.spec.ts', '<rootDir>/apps/auth-service/**/*.spec.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  // testPathIgnorePatterns only filters which files run as tests — Jest's haste module map still
  // scans the whole rootDir for package.json/module names, which collided with apps/frontend's own
  // package.json (and its built .next/standalone copy) once that workspace package existed.
  modulePathIgnorePatterns: ['<rootDir>/apps/frontend/'],
  collectCoverageFrom: [
    'apps/backend/src/**/*.ts',
    '!apps/backend/src/**/*.module.ts',
    '!apps/backend/src/**/*.dto.ts',
    '!apps/backend/src/**/*.schema.ts',
    '!apps/backend/src/**/main.ts',
    '!apps/backend/src/common/drizzle/schema/**',
    '!apps/backend/src/common/drizzle/drizzle.provider.ts',
    '!apps/backend/src/options/**',
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 85,
    },
  },
};
