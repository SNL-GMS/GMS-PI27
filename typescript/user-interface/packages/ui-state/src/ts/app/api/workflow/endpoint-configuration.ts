import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';
import { prioritizeRequests } from '../request-priority';

/**
 * Workflow request config definition
 */
export interface WorkflowRequestConfig extends RequestConfig {
  readonly workflow: {
    readonly baseUrl: string;
    readonly services: {
      readonly workflow: ServiceDefinition;
      readonly stageIntervalsByIdAndTime: ServiceDefinition;
      readonly updateActivityIntervalStatus: ServiceDefinition;
      readonly updateStageIntervalStatus: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.WorkflowManagerServiceUrls.baseUrl}`;

/**
 * The workflow request config for all services.
 */
export const config: WorkflowRequestConfig = {
  workflow: {
    baseUrl,
    services: prioritizeRequests({
      workflow: createServiceDefinition({
        baseUrl,
        url: Endpoints.WorkflowManagerServiceUrls.workflow.url,
        friendlyName: Endpoints.WorkflowManagerServiceUrls.workflow.friendlyName,
        accept: 'application/json',
        contentType: 'text/plain',
        data: `"PlaceHolder"`
      }),
      stageIntervalsByIdAndTime: createServiceDefinition({
        baseUrl,
        url: Endpoints.WorkflowManagerServiceUrls.stageIntervalsByIdAndTime.url,
        friendlyName: Endpoints.WorkflowManagerServiceUrls.stageIntervalsByIdAndTime.friendlyName,
        accept: 'application/json'
      }),
      updateActivityIntervalStatus: createServiceDefinition({
        baseUrl,
        url: Endpoints.WorkflowManagerServiceUrls.updateActivityIntervalStatus.url,
        friendlyName:
          Endpoints.WorkflowManagerServiceUrls.updateActivityIntervalStatus.friendlyName,
        accept: 'application/json'
      }),
      updateStageIntervalStatus: createServiceDefinition({
        baseUrl,
        url: Endpoints.WorkflowManagerServiceUrls.updateStageIntervalStatus.url,
        friendlyName: Endpoints.WorkflowManagerServiceUrls.updateStageIntervalStatus.friendlyName
      })
    })
  }
};

export type WorkflowServices = keyof typeof config.workflow.services;
