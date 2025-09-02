# Testing Documentation

## Overview

This directory contains tests for the Polling App. The tests are written using Vitest, a fast and lightweight testing framework compatible with Next.js projects.

## Test Structure

- `__tests__/lib/` - Unit tests for library functions
- `__tests__/integration/` - Integration tests that test multiple components working together
- `__tests__/setup.ts` - Global test setup and mocks

## Running Tests

To run the tests, you can use the following npm scripts:

```bash
# Run all tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test coverage report will be generated in the `coverage` directory when running the `test:coverage` script. This report shows which parts of the codebase are covered by tests and which are not.

## Writing Tests

### Unit Tests

Unit tests should focus on testing a single function or component in isolation. Dependencies should be mocked.

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { someFunction } from '@/lib/someModule';

// Mock dependencies
vi.mock('@/lib/dependency', () => ({
  dependencyFunction: vi.fn(),
}));

describe('someFunction', () => {
  it('should do something specific', () => {
    // Arrange
    // ...
    
    // Act
    const result = someFunction();
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Tests

Integration tests should focus on testing how multiple components or functions work together.

## Mocking

The `setup.ts` file contains global mocks for Next.js features like `revalidatePath` and the cookies API. Additional mocks should be added as needed in individual test files.