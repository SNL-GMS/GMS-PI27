import {
  featurePredictionsAKASG,
  featurePredictionsASAR,
  featurePredictionsPDAR
} from '@gms/common-model/__tests__/__data__';

import type {
  PredictFeatures,
  PredictFeaturesForEventLocationQueryResult
} from '../../../src/ts/app/api/data/event/predict-features-for-event-location';

export const predictFeaturesForEventLocationResponseData: PredictFeatures = {
  receiverLocationsByName: {
    ASAR: { featurePredictions: featurePredictionsASAR },
    PDAR: { featurePredictions: featurePredictionsPDAR },
    AKASG: { featurePredictions: featurePredictionsAKASG }
  }
};

export const predictFeaturesForEventLocationResponseQueryData: PredictFeaturesForEventLocationQueryResult =
  {
    isError: false,
    isLoading: false,
    fulfilled: 1,
    pending: 0,
    rejected: 0,
    data: predictFeaturesForEventLocationResponseData
  };
