import { DEFAULT_PRIORITY } from '@gms/common-model/lib/endpoints/types';
import { Logger, Timer } from '@gms/common-util';
import type { SerializedError } from '@reduxjs/toolkit';
import type { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import Axios from 'axios';
import inRange from 'lodash/inRange';
import intersection from 'lodash/intersection';
import PQueue from 'p-queue';

import { defaultRequestTransformers, defaultResponseTransformers } from './axios-transformers';

const logger = Logger.create('GMS_LOG_AXIOS', process.env.GMS_LOG_AXIOS);

// TODO: Plumb in the max requests from config
const maxParallelRequests = 255;

/**
 * type guard that checks if an object is a serialized error
 * @param obj the object to check
 * @returns true if the object is a serialized error
 */
export function isSerializedError(obj: any): obj is SerializedError {
  const keys: (keyof SerializedError)[] = ['name', 'code', 'message', 'stack'];
  if (obj && intersection(Object.keys(obj), keys).length > 0) return true;
  return false;
}

/**
 * Returns true if the status code is between 200-299; false otherwise.
 *
 * @param status the status code to check if successful
 * @returns true if the status code is successful
 */
export function isSuccessfulStatusCode(status: number | null | undefined): boolean {
  const STATUS_200 = 200;
  const STATUS_300 = 300;
  if (status == null) return false;
  return inRange(status, STATUS_200, STATUS_300);
}

/**
 * The singleton promise queue that limits the number of in-flight requests. Requests made after the
 * limit is hit will be queued up and requested based on their priorities.
 */
const promiseQueue: PQueue = new PQueue({ concurrency: maxParallelRequests });

export interface PriorityRequestConfig<T = unknown> extends AxiosRequestConfig<T> {
  priority?: number;
}

/**
 * Defines the arguments that are required and used by the
 * custom Axios base query for RTK.
 */
export interface Args {
  requestConfig: PriorityRequestConfig;
}

export type SerializedAxiosError = SerializedError & Omit<AxiosError, 'toJSON'>;

/**
 * Defines any extra option arguments that are defined and used
 * by the custom Axios base query for RTK.
 *
 * ! currently the extra options are empty and not used
 */
export type ExtraOptions = Record<string, unknown>;

/**
 * Defines any meta data arguments that are defined and used
 * by the custom Axios base query for RTK.
 *
 * ! currently the meta data is empty and not used
 */
export type Meta = Record<string, unknown>;

/**
 * Defines the typed custom Axios base query function for RTK.
 *
 * ? ResultType specifies the type of the data returned by the query
 */
export type AxiosBaseQueryFn<ResultType = unknown> = BaseQueryFn<
  Args,
  ResultType,
  Error,
  ExtraOptions,
  Meta
>;

/**
 * Defines the typed result object that is returned from the
 * custom Axios base query for RTK.
 */
export type AxiosBaseQueryResult<ResultType = unknown> = Promise<
  QueryReturnValue<ResultType, Error, Meta>
>;

/**
 * A custom base base query implementation using Axios for RTK.
 *
 * @param baseUrl for the query function
 * @returns an axios base query function
 */
export function axiosBaseQuery<ResultType = unknown>(
  { baseUrl }: { baseUrl: string } = { baseUrl: '' }
): AxiosBaseQueryFn<ResultType> {
  return async ({ requestConfig }): AxiosBaseQueryResult<ResultType> => {
    const { priority } = requestConfig;
    const url = `${baseUrl}${requestConfig.url}`;
    return promiseQueue
      .add<AxiosBaseQueryResult<ResultType>>(
        async (): AxiosBaseQueryResult<ResultType> => {
          Timer.start(`[axios]: query ${url} ${JSON.stringify(requestConfig)}`);
          const requestConf: AxiosRequestConfig = {
            ...requestConfig,
            url,
            // apply the default response transformers; unless the request config specifies its own
            transformResponse: requestConfig.transformResponse ?? defaultResponseTransformers,
            // apply the default request transformers; unless the request config specifies its own
            transformRequest: requestConfig.transformRequest ?? defaultRequestTransformers
          };
          delete (requestConf as PriorityRequestConfig).priority;

          return Axios.request(requestConf)
            .then(result => {
              return { data: result.data };
            })
            .catch(error => {
              if (error?.message === 'canceled' || error?.response?.statusText === 'canceled') {
                // Errors coming from the SW will be in a different format, this converts it to a standard
                const serializedError: SerializedError & {
                  requestConfig: PriorityRequestConfig<unknown>;
                } = {
                  code: '409',
                  message: 'canceled',
                  name: 'canceled',
                  requestConfig
                };
                throw serializedError;
              }
              const axiosError = JSON.parse(JSON.stringify(error.toJSON()));
              const serializedAxiosError: SerializedAxiosError = {
                ...axiosError,
                code: axiosError.code ?? axiosError.status
              };

              if (error.response) {
                // The request was made and the server responded with a status code that falls out of the range of 2xx
                logger.error('Axios response error:', {
                  ...serializedAxiosError,
                  status: error.response.status,
                  data: error.response.data,
                  headers: error.response.headers
                });
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
                logger.error('Axios no response received:', {
                  ...serializedAxiosError,
                  request: error.request
                });
              } else {
                // Something happened in setting up the request that triggered an Error
                logger.error(`Axios unexpected error: ${error.message}`, serializedAxiosError);
              }
              throw serializedAxiosError;
            })
            .finally(() => {
              Timer.end(`[axios]: query ${url} ${JSON.stringify(requestConfig)}`);
            });
        },
        { priority: priority ?? DEFAULT_PRIORITY }
      )
      .catch(error => {
        throw error;
      });
  };
}
