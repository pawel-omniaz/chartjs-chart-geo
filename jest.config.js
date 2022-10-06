/* eslint-env node */
const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest/presets/js-with-ts-esm',
  // transformIgnorePatterns: ['node_modules/(?!(d3-.*)/)'],
  moduleNameMapper: {
    '^d3-(.*)$': [`d3-$1${path.sep}dist${path.sep}d3-$1`, '<rootDir>/node_modules/d3-$1/dist/d3-$1.js'],
  },
  testRegex: '((\\.|/)(test|spec))\\.m?tsx?$',
};
