package gms.shared.event.accessor.facet;

import static gms.shared.event.accessor.facet.FacetingTypes.*;

import gms.shared.stationdefinition.coi.facets.FacetingDefinition;

/** Utility class that contains default faceting definitions */
public final class EventFacetingDefinitions {

  private static final FacetingDefinition channelFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition channelSegmentFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.toString())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition featureMeasurementFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.FEATURE_MEASUREMENT_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(FacetingTypes.CHANNELS_KEY.toString(), channelFacetDefinition)
          .addFacetingDefinitions(
              FacetingTypes.MEASURED_CHANNEL_SEGMENT_KEY.toString(), channelSegmentFacetDefinition)
          .build();

  private static final FacetingDefinition featurePredictionFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FEATURE_PREDICTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(CHANNEL_KEY.toString(), channelFacetDefinition)
          .addFacetingDefinitions(CHANNEL_SEGMENT_KEY.toString(), channelSegmentFacetDefinition)
          .build();

  private static final FacetingDefinition stationFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.STATION_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition signalDetectionHypothesisFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.SDH_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(FacetingTypes.STATION_KEY.toString(), stationFacetingDefinition)
          .addFacetingDefinitions(
              FacetingTypes.FEATURE_MEASUREMENTS_KEY.toString(), featureMeasurementFacetDefinition)
          .build();

  private static final FacetingDefinition rejectedSignalDetectionAssociationsFacetDef =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.SIGNAL_DETECTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.SD_HYPOTHESES_KEY.toString(), signalDetectionHypothesisFacetDefinition)
          .addFacetingDefinitions(FacetingTypes.STATION_KEY.toString(), stationFacetingDefinition)
          .build();

  private static final FacetingDefinition preferredEventHypothesesFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.PREFERRED_EH_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition overallPreferredFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.SIGNAL_DETECTION_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition finalEventHypothesisHistoryFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition defautLocationSolutionFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.LOCATION_SOLUTION_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              FEATURE_MEASUREMENTS_KEY.toString(), featureMeasurementFacetDefinition)
          .addFacetingDefinitions(
              FEATURE_PREDICTIONS_KEY.toString(), featurePredictionFacetDefinition)
          .addFacetingDefinitions(
              FacetingTypes.NETWORK_MAGNITUDE_SOLUTIONS_KEY.toString(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.NETWORK_MAGNITUDE_SOLUTIONS_KEY.toString())
                  .setPopulated(true)
                  .addFacetingDefinitions(
                      FacetingTypes.CHANNEL_KEY.toString(), channelFacetDefinition)
                  .build())
          .build();

  public static final FacetingDefinition defaultHypothesesFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.EVENT_HYPOTHESIS_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.LOCATION_SOLUTION_KEY.toString(), defautLocationSolutionFacetDefinition)
          .build();

  public static final FacetingDefinition defaultEventFacetDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.EVENT_TYPE.toString())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.REJECTED_SD_KEY.toString(), rejectedSignalDetectionAssociationsFacetDef)
          .addFacetingDefinitions(
              FacetingTypes.EVENT_HYPOTHESIS_KEY.toString(), defaultHypothesesFacetDefinition)
          .addFacetingDefinitions(
              FacetingTypes.PREFERRED_EH_KEY.toString(), preferredEventHypothesesFacetDefinition)
          .addFacetingDefinitions(
              FacetingTypes.OVERALL_PREFERRED_KEY.toString(), overallPreferredFacetDefinition)
          .addFacetingDefinitions(
              FacetingTypes.FINAL_EH_HISTORY_KEY.toString(),
              finalEventHypothesisHistoryFacetDefinition)
          .build();

  private EventFacetingDefinitions() {}
}
