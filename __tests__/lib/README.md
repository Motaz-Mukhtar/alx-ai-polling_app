# Unit Tests for Library Functions

## Overview

This directory contains unit tests for the library functions in the `/lib` directory. These tests focus on testing individual functions in isolation, mocking all dependencies.

## Files

- `pollActions.test.ts` - Tests for the `deletePoll` and `getUserPollsStats` functions in `lib/pollActions.ts`

## Testing Approach

The unit tests follow these principles:

1. **Isolation**: Each function is tested in isolation, with all dependencies mocked.
2. **Comprehensive Coverage**: Tests cover both success and error cases.
3. **Mocking**: Dependencies like `getSession`, `supabase`, and `revalidatePath` are mocked to control test conditions.

## Coverage

The unit tests for `pollActions.ts` achieve 100% line coverage and 85.71% branch coverage. The remaining branches are edge cases that are covered by integration tests.

## Running Tests

To run just the unit tests:

```bash
npm test __tests__/lib
```