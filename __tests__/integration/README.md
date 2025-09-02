# Integration Tests

## Overview

This directory contains integration tests that verify multiple components working together. Unlike unit tests that mock all dependencies, integration tests use more realistic mocks that simulate the behavior of the actual system.

## Files

- `pollActions.integration.test.ts` - Integration tests for the `deletePoll` and `getUserPollsStats` functions in `lib/pollActions.ts`

## Testing Approach

The integration tests follow these principles:

1. **Realistic Mocks**: Dependencies are mocked with implementations that closely resemble the actual behavior of the system.
2. **Data Persistence**: The mock implementations maintain state between operations, allowing tests to verify that changes persist.
3. **End-to-End Scenarios**: Tests cover complete scenarios from start to finish.

## Mock Implementation

The integration tests use a custom mock implementation of the Supabase client that:

1. Maintains an in-memory database of polls and votes
2. Implements the same API as the real Supabase client
3. Enforces the same constraints as the real database (e.g., users can only delete their own polls)

## Running Tests

To run just the integration tests:

```bash
npm test __tests__/integration
```