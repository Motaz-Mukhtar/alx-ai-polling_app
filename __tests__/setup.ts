// This file contains setup code for Vitest tests
import { vi, afterEach } from 'vitest';

// Mock Next.js cache module
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock cookies API
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation((name) => {
      if (name === 'auth_token') {
        return { value: 'mock-auth-token' };
      }
      return null;
    }),
    set: vi.fn(),
  }),
}));

// Global afterEach to clean up mocks
afterEach(() => {
  vi.clearAllMocks();
});