// Jest setup file
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pushTo: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, init }),
    redirect: (url: string, init?: any) => ({ url, init }),
    rewrite: (url: string, init?: any) => ({ url, init }),
  },
  NextRequest: class {
    constructor(input: RequestInfo | URL, init?: RequestInit) {}
    nextUrl = new URL('http://localhost');
    cookies = () => new Map();
  }
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  }),
}));