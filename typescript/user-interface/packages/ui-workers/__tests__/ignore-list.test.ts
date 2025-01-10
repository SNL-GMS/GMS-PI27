import { shouldIgnore } from '../src/ts/ignore-list';
import type { RequestConfig, ServiceDefinition } from '../src/ts/query';

describe('ignore-list', () => {
  const mockRequest: Request = {
    url: 'https://example.com/mock-test'
  } as Request;
  it('exists', () => {
    expect(shouldIgnore).toBeDefined();
  });
  it('returns false when given a null list', () => {
    expect(shouldIgnore(mockRequest, [])).toBe(false);
  });
  it('Ignores things when given the full url', () => {
    expect(shouldIgnore(mockRequest, ['https://example.com/mock-test'])).toBe(true);
  });
  it('Ignores things when given a baseURl', () => {
    expect(shouldIgnore(mockRequest, ['https://example.com/'])).toBe(true);
  });
  it('Ignores things when given an endpoint', () => {
    expect(shouldIgnore(mockRequest, ['/mock-test'])).toBe(true);
  });
  it('Ignores things when given a matching requestConfig', () => {
    const rq: RequestConfig = {
      test: {
        baseUrl: 'https://example.com',
        services: {
          foo: {
            requestConfig: {
              url: '/foo-endpoint'
            },
            friendlyName: 'Foo Endpoint'
          }
        }
      }
    };
    expect(shouldIgnore(mockRequest, [rq])).toBe(true);
  });
  it('does not ignore things when given a non-matching requestConfig', () => {
    const rq: RequestConfig = {
      test: {
        baseUrl: 'https://www.youtube.com',
        services: {
          foo: {
            requestConfig: {
              url: '/watch?v=dQw4w9WgXcQ'
            },
            friendlyName: 'Youtube'
          }
        }
      }
    };
    expect(shouldIgnore(mockRequest, [rq])).toBe(false);
  });
  it('ignore things when given a matching service definition', () => {
    const serviceDef: ServiceDefinition = {
      requestConfig: {
        url: '/mock-test'
      },
      friendlyName: 'Mock Test'
    };
    expect(shouldIgnore(mockRequest, [serviceDef])).toBe(true);
  });
  it('does not ignore things when given a non-matching service definition', () => {
    const serviceDef: ServiceDefinition = {
      requestConfig: {
        url: '/garbage'
      },
      friendlyName: 'GARBAGE'
    };
    expect(shouldIgnore(mockRequest, [serviceDef])).toBe(false);
  });
  it('ignores things if given one rule that matches, and others that do not', () => {
    expect(
      shouldIgnore(mockRequest, [
        'https://example.com',
        'https://www.youtube.com',
        '/watch?v=dQw4w9WgXcQ'
      ])
    ).toBe(true);
    expect(
      shouldIgnore(mockRequest, [
        'https://www.youtube.com',
        'https://example.com',
        '/watch?v=dQw4w9WgXcQ'
      ])
    ).toBe(true);
    expect(
      shouldIgnore(mockRequest, [
        'https://www.youtube.com',
        '/watch?v=dQw4w9WgXcQ',
        'https://example.com'
      ])
    ).toBe(true);
  });
});
