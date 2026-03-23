export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // babel-jest automatically picks up babel.config.cjs in the project root,
  // which includes the import.meta.env replacement plugin.
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    // Entrypoint — not a business-logic file
    '!src/main.jsx',
    // App router — wiring only, tested via E2E
    '!src/App.jsx',
    // Test infrastructure
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/setupTests.js',
    // Static / generated artefacts
    '!src/services/mockData.js',
    '!src/config/**',
    '!src/i18n/**',
    // Complex Vite-specific mock-adapter — covered indirectly via service tests
    '!src/services/apiClient.js',
    // Pages are UI-heavy; covered by E2E / Playwright suite
    '!src/pages/**',
    // Admin pages are also UI-heavy
    '!src/pages/admin/**',
    // Layout components — rendering wrappers, E2E territory
    '!src/components/layout/**',
    // Admin UI modals — complex form components, covered by E2E suite
    '!src/components/admin/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Reporters for CI/CD
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/jest',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  coverageDirectory: './coverage'
};
