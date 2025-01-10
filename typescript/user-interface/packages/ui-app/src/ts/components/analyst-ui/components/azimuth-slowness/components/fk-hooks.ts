import type { EventTypes } from '@gms/common-model';
import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  selectDisplayedSignalDetectionId,
  selectOpenActivityNames,
  selectOpenEvent,
  selectOpenIntervalName,
  selectSdIdsToShowFk,
  selectSelectedSortType,
  useAppSelector,
  useEffectiveTime,
  useFkReviewablePhasesByActivityNameQuery,
  useGetAllStationsQuery,
  useGetFkChannelSegment,
  useGetFkData,
  useGetFkSpectraTemplate,
  useGetSignalDetections,
  useLegacyComputeFk,
  usePredictFeaturesForEventLocation,
  useSetDisplayedSignalDetectionId
} from '@gms/ui-state';
import uniq from 'lodash/uniq';
import React from 'react';

import { EventUtils } from '~analyst-ui/common/utils';

import { getSortedSignalDetections, getUnassociatedDetectionsForShowFk } from './fk-util';

/**
 * Filter for Fks that MUST be reviewed
 *
 * @param assocSDs SignalDetectionTypes.SignalDetection[]
 * @param isForFiltering?: boolean only true for showing reviewable/reviewed fks when filtering
 * @returns SignalDetectionTypes.SignalDetection[] to be reviewed
 */
export const useFksNeedReview = () => {
  const getFkData = useGetFkData();
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const reviewablePhases: FkTypes.FkReviewablePhasesByStation =
    useFkReviewablePhasesByActivityNameQuery(openActivityNames[0]);
  return React.useCallback(
    (associatedSDs: SignalDetectionTypes.SignalDetection[], isForFiltering?: boolean) => {
      if (!reviewablePhases) return [];

      return associatedSDs.filter(sd => {
        const fk = getFkData(sd);
        return FkTypes.Util.fkNeedsReview(
          fk,
          reviewablePhases[sd.station.name],
          sd,
          isForFiltering
        );
      });
    },
    [getFkData, reviewablePhases]
  );
};

/**
 * Returns a callback that selects the next fk that needs review
 */
export const useNextFk = () => {
  const fksNeedReview = useFksNeedReview();
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const signalDetectionResults = useGetSignalDetections();
  const associatedSignalDetections = EventUtils.getAssociatedDetections(
    currentOpenEvent,
    signalDetectionResults.data ?? [],
    openIntervalName
  );
  const displayedSignalDetectionId: string = useAppSelector(selectDisplayedSignalDetectionId);
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const distances = EventUtils.getDistanceToStationsForPreferredLocationSolutionId(
    currentOpenEvent,
    stationsQuery.data ?? [],
    openIntervalName,
    []
  );
  const selectedSortType = useAppSelector(selectSelectedSortType);
  const setDisplayedSignalDetectionId = useSetDisplayedSignalDetectionId();
  return React.useCallback(() => {
    // the list of fks that need review and are associated to the currently open event
    const reviewableSds = fksNeedReview(associatedSignalDetections);
    if (reviewableSds.length > 0) {
      const needsReviewSds = reviewableSds.filter(sd => sd.id !== displayedSignalDetectionId);
      const sortedNeedsReviewSds =
        distances && distances.length > 0
          ? getSortedSignalDetections(needsReviewSds, selectedSortType, distances)
          : needsReviewSds;
      if (sortedNeedsReviewSds.length > 0) {
        // Select first in the list
        const [nextSdForReview] = sortedNeedsReviewSds;
        // Set FK as reviewed and set selected SD
        setDisplayedSignalDetectionId(nextSdForReview.id);
      }
    }
  }, [
    associatedSignalDetections,
    displayedSignalDetectionId,
    distances,
    fksNeedReview,
    selectedSortType,
    setDisplayedSignalDetectionId
  ]);
};

/**
 * @returns an immutable map of signal detections ids to list of feature predictions
 */
export const useSignalDetectionsWithFeaturePredictions = (): Map<
  string,
  EventTypes.FeaturePrediction[]
> => {
  const openEvent = useAppSelector(selectOpenEvent);
  const signalDetectionResults = useGetSignalDetections();
  const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);
  const openIntervalName = useAppSelector(selectOpenIntervalName);

  const associatedSignalDetections = EventUtils.getAssociatedDetections(
    openEvent,
    signalDetectionResults.data ?? [],
    openIntervalName
  );

  const unassociatedSDsForShowFk = getUnassociatedDetectionsForShowFk(
    signalDetectionResults.data ?? [],
    sdIdsToShowFk,
    associatedSignalDetections
  );

  // Merge detections and remove deleted
  const signalDetections = React.useMemo(() => {
    return uniq([...associatedSignalDetections, ...unassociatedSDsForShowFk]).filter(
      sd => !SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).deleted
    );
  }, [associatedSignalDetections, unassociatedSDsForShowFk]);

  const phases = React.useMemo(
    () =>
      signalDetections.map(sd => {
        return SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
          SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
            .featureMeasurements
        ).value;
      }),
    [signalDetections]
  );

  const featurePredictionsQuery = usePredictFeaturesForEventLocation(phases);

  return React.useMemo(() => {
    const signalDetectionsIdToFeaturePredictions: Map<string, EventTypes.FeaturePrediction[]> =
      new Map<string, EventTypes.FeaturePrediction[]>();

    // Do nothing if no featurePredictions data
    if (!featurePredictionsQuery.data) return signalDetectionsIdToFeaturePredictions;

    const featurePredictions = featurePredictionsQuery.data;

    signalDetections.forEach(sd => {
      const signalDetectionPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
          .featureMeasurements
      ).value;
      const signalDetectionFeaturePredictions: EventTypes.FeaturePrediction[] = [];

      Object.entries(featurePredictions.receiverLocationsByName)
        .filter(([channelName]) => {
          // Filter out records that do not match with the SD's station name
          return channelName === sd.station.name;
        })
        .forEach(([, receiverLocationResponse]) => {
          // This will only loop on locationResponses with a matching channelName
          signalDetectionFeaturePredictions.push(
            ...receiverLocationResponse.featurePredictions.filter(
              featurePrediction => featurePrediction.phase === signalDetectionPhase
            )
          );
        });

      signalDetectionsIdToFeaturePredictions.set(sd.id, signalDetectionFeaturePredictions);
    });
    return signalDetectionsIdToFeaturePredictions;
  }, [featurePredictionsQuery.data, signalDetections]);
};

/**
 * Call create Fks and frequency thumbnails for the list of associated signal detections
 */
export const useShowOrGenerateSignalDetectionFk = () => {
  const getFkChannelSegment = useGetFkChannelSegment();
  const getFkSpectraTemplate = useGetFkSpectraTemplate();
  const computeFk = useLegacyComputeFk();
  const signalDetectionResults = useGetSignalDetections();
  const openEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);
  const associatedSignalDetections = EventUtils.getAssociatedDetections(
    openEvent,
    signalDetectionResults.data ?? [],
    openIntervalName
  );

  // these are the sd's which aren't associated to the open event
  // but are necessary to show the Fk
  const unassociatedSDsForShowFk = getUnassociatedDetectionsForShowFk(
    signalDetectionResults.data ?? [],
    sdIdsToShowFk,
    associatedSignalDetections
  );

  return React.useCallback(() => {
    // Any unassociated or associated SDs loaded into Az/Slow display
    const allSignalDetections = [...unassociatedSDsForShowFk, ...associatedSignalDetections];

    // No FKs to display
    // If SD ids or SD query results are empty nothing to do
    if (!allSignalDetections || allSignalDetections.length === 0 || !signalDetectionResults.data) {
      return;
    }

    // Build list of signal detections needing FKs
    const signalDetectionsToRequest: SignalDetectionTypes.SignalDetection[] = [];

    allSignalDetections.forEach(signalDetection => {
      const fkChannelSegment = getFkChannelSegment(signalDetection);

      // no need to compute an FK if we already requested or have an fk in SignalDetection
      if (!fkChannelSegment?.timeseries[0]) {
        signalDetectionsToRequest.push(signalDetection);
      }
    });

    // Call computeFk on main FK and frequency thumbnails
    signalDetectionsToRequest.forEach(async signalDetection => {
      // Need to use station and phase to get fk spectra template
      const fkTemplate = await getFkSpectraTemplate(signalDetection);
      if (fkTemplate) {
        await computeFk(fkTemplate, signalDetection);
      }
    });
  }, [
    associatedSignalDetections,
    computeFk,
    getFkChannelSegment,
    getFkSpectraTemplate,
    signalDetectionResults.data,
    unassociatedSDsForShowFk
  ]);
};
