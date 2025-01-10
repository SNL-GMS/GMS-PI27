import type { CancelTokens, ServiceDefinition } from '@gms/ui-workers';
import isEmpty from 'lodash/isEmpty';
import isNumber from 'lodash/isNumber';

const DEFAULT_REQUEST_TIMEOUT = 180000; // 3 minutes

const REQUEST_TIMEOUT: number =
  process.env.GMS_REQUEST_TIMEOUT != null &&
  !isEmpty(process.env.GMS_REQUEST_TIMEOUT) &&
  isNumber(Number(process.env.GMS_REQUEST_TIMEOUT)) &&
  Number.isFinite(Number(process.env.GMS_REQUEST_TIMEOUT))
    ? Number(process.env.GMS_REQUEST_TIMEOUT)
    : DEFAULT_REQUEST_TIMEOUT;

const DISABLE_MSG_PACK: boolean = process.env.GMS_DISABLE_MSG_PACK === 'true';

type Method = 'GET' | 'POST';

type ContentType = 'text/plain' | 'application/json' | 'application/msgpack';

type Accept = 'text/plain' | 'application/json' | 'application/msgpack';

/** The props for making a {@link ServiceDefinition} request object */
export interface MakeRequestProps<T> {
  /**
   * The base url.
   */
  baseUrl: string;
  /**
   * The request url.
   */
  url: string;
  /**
   * A human readable name describing the request.
   */
  friendlyName: string;
  /**
   * Specifies either GET or POST.
   * @default 'POST'
   */
  method?: Method;
  /**
   * Specifies the content type header.
   * @default 'application/json'
   */
  contentType?: ContentType;
  /**
   * Specifies the accept header.
   * @default browser default
   */
  accept?: Accept;
  cancelToken?: CancelTokens;
  /**
   * Specifies the request timeout.
   * @default 180000
   */
  timeout?: number;
  /**
   * The data of the request.
   */
  data?: T;
}

/**
 * Constructs a {@link ServiceDefinition} request object.
 * @param props the props for defining the {@link ServiceDefinition} request object
 * @returns a {@link ServiceDefinition} request object
 */
export function createServiceDefinition<T>(
  props: Readonly<MakeRequestProps<T>>
): ServiceDefinition {
  const { baseUrl, url, friendlyName, cancelToken, data } = props;

  // default is POST
  const method: Method = props.method ?? 'POST';

  // default is JSON
  const contentType: ContentType =
    (DISABLE_MSG_PACK && props.contentType === 'application/msgpack'
      ? 'application/json'
      : props.contentType) ?? 'application/json';

  // default is 180000
  const timeout = props.timeout ?? REQUEST_TIMEOUT;

  const accept: Accept | undefined =
    DISABLE_MSG_PACK && props.accept === 'application/msgpack' ? 'application/json' : props.accept;

  const request: ServiceDefinition = {
    friendlyName,
    requestConfig: {
      baseURL: baseUrl,
      method,
      url,
      proxy: false,
      headers: {
        'content-type': contentType
      },
      timeout,
      data
    }
  };

  // uses the browsers default if not accept header is set
  if (accept && request.requestConfig.headers) {
    request.requestConfig.headers.accept = accept;
  }

  if (cancelToken && request.requestConfig.headers) {
    request.requestConfig.headers['Cancel-Token'] = cancelToken;
  }

  // the ServiceWorker uses fetch instead of axios; do not set the `responseType`
  if (process.env.GMS_DISABLE_SW === 'true') {
    if (accept === 'application/msgpack') {
      // must specify that the response type is of type array buffer for
      // receiving and decoding msgpack data
      request.requestConfig.responseType = 'arraybuffer';
    } else if (accept === 'application/json') {
      request.requestConfig.responseType = 'json';
    } else {
      request.requestConfig.responseType = 'text';
    }
  }

  return request;
}
