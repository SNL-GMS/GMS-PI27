package gms.shared.event.analysis.relocation.locoo3d.utility;

import com.google.common.math.DoubleMath;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.Salsa3dException;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.globals.SeismicPhase;
import gov.sandia.gmp.baseobjects.observation.Observation;
import gov.sandia.gmp.util.globals.Globals;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;

public final class ConverterUtility {

  public static final double MILLISECOND_FACTOR = 1000.0;
  public static final String COMMA_SEPARATOR = ", ";

  // Tolerance for checking for NA value.
  public static final double NA_TOLERANCE = 10e-15;

  private ConverterUtility() {
    // Prevent instantiation
  }

  /**
   * Adds a {@link FeatureMeasurment} to a provided {@link Observation}. The fields set in the
   * {@link Observation} depend on what type the {@link FeatureMeasurement} is: PHASE -> phase;
   * ARRIVAL_TIME -> arrivalTime, delTim, timeDefOriginal; NUMERIC_VALUE -> azimuth, delAz, azDef,
   * slow, delSlo, sloDef
   *
   * @param featureMeasurement the {@link FeatureMeasurement} to be added
   * @param definingFeatureByFeatureMeasurementType the {@link FeatureMeasurement} type
   * @param observation the {@link Observation} to which the {@link FeatureMeasurement} is added
   * @throws Salsa3dException if an error occurs when setting the phase in an observation
   */
  public static void addFeatureMeasurementToObservation(
      FeatureMeasurement<?> featureMeasurement,
      DefiningFeatureByFeatureMeasurementType definingFeatureByFeatureMeasurementType,
      Observation observation)
      throws Salsa3dException {

    var featureMeasurementType = featureMeasurement.getFeatureMeasurementType();

    if (featureMeasurementType == FeatureMeasurementTypes.PHASE
        && featureMeasurement.getMeasurementValue()
            instanceof PhaseTypeMeasurementValue phaseValue) {
      var phaseType = phaseValue.getValue();
      try {
        observation.setPhase(SeismicPhase.valueOf(phaseType.toString()));
      } catch (Exception e) {
        throw new Salsa3dException("Error setting the Phase in the observation", e);
      }
    } else {
      var definingFeatureDefinition =
          Optional.ofNullable(
                  definingFeatureByFeatureMeasurementType
                      .definingFeatureByFeatureMeasurementType()
                      .get(featureMeasurementType))
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "No definingFeatureDefinition for" + featureMeasurementType));

      if (featureMeasurementType == FeatureMeasurementTypes.ARRIVAL_TIME
          && featureMeasurement.getMeasurementValue()
              instanceof ArrivalTimeMeasurementValue arrivalValue) {
        observation.setArrivalTime(
            arrivalValue.getArrivalTime().getValue().toEpochMilli() / MILLISECOND_FACTOR);

        var standardDeviation =
            arrivalValue
                .getArrivalTime()
                .getStandardDeviation()
                .orElseThrow(
                    () ->
                        new IllegalStateException(
                            "ARRIVAL_TIME FeatureMeasurement must have a standardDeviation."));
        observation.setDeltim(standardDeviation.toMillis() / MILLISECOND_FACTOR);
        observation.setTimedefOriginal(definingFeatureDefinition.defining());
      }

      if (featureMeasurement.getMeasurementValue() instanceof NumericMeasurementValue value) {
        setObservationFieldsFromNumericMeasurementValue(
            featureMeasurementType, value, observation, definingFeatureDefinition);
      }
    }
  }

  private static void setObservationFieldsFromNumericMeasurementValue(
      FeatureMeasurementType<?> featureMeasurementType,
      NumericMeasurementValue numericMeasurementValue,
      Observation observation,
      DefiningFeatureDefinition definingFeatureDefinition) {

    var convertedNmValue = toRadians(numericMeasurementValue);
    double value = convertedNmValue.getMeasuredValue().getValue();
    double std = convertedNmValue.getMeasuredValue().getStandardDeviation().orElse(0.0);

    if (featureMeasurementType == FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH) {
      observation.setAzimuth(value);
      observation.setDelaz(std);
      observation.setAzdef(definingFeatureDefinition.defining());
    }

    if (featureMeasurementType == FeatureMeasurementTypes.SLOWNESS) {
      observation.setSlow(value);
      observation.setDelslo(std);
      observation.setSlodef(definingFeatureDefinition.defining());
    }
  }

  private static NumericMeasurementValue toRadians(NumericMeasurementValue value) {
    double numericValue = value.getMeasuredValue().getValue();

    var fromUnits = value.getMeasuredValue().getUnits();

    if (!ConverterUtility.isNaValue(numericValue)) {
      numericValue =
          switch (fromUnits) {
            case DEGREES -> Math.toRadians(numericValue);
              // toDegrees ends up converting a seconds/degree to a seconds/radian due to neat math
              // stuff.
            case SECONDS_PER_DEGREE -> Math.toDegrees(numericValue);
            default -> throw new IllegalStateException("Unknown units for converting to radians");
          };
    }

    double std = value.getMeasuredValue().getStandardDeviation().orElse(0.0);
    if (!ConverterUtility.isNaValue(std)) {
      std =
          switch (fromUnits) {
            case DEGREES -> Math.toRadians(std);
              // toDegrees ends up converting a seconds/degree to a seconds/radian due to neat math
              // stuff.
            case SECONDS_PER_DEGREE -> Math.toDegrees(std);
            default -> throw new IllegalStateException("Unknown units for converting to radians");
          };
    }

    var newUnits =
        switch (fromUnits) {
          case DEGREES -> Units.RADIANS;
          case SECONDS_PER_DEGREE -> Units.SECONDS_PER_RADIAN;
            // Should never happen due to default case of switch above
          default -> Units.UNITLESS;
        };

    return NumericMeasurementValue.from(
        Optional.<Instant>empty(), DoubleValue.from(numericValue, Optional.of(std), newUnits));
  }

  /**
   * Test the passed number for fuzzy equality with Globals.NA_VALUE.
   *
   * @return a boolean true if the passed value is fuzzy equal to Globals.NA_VALUE. Otherwise,
   *     false.
   */
  public static boolean isNaValue(double numericValue) {
    return DoubleMath.fuzzyEquals(numericValue, Globals.NA_VALUE, NA_TOLERANCE);
  }

  /**
   * Extracts the predictor types from a {@link EventRelocationProcessingDefinition}s
   *
   * @param eventRelocationDefinitionByPhaseType provides the predictors based on phase type
   * @param eventRelocationProcessingDefinition provides the default predictor
   * @return a string representing the Locator Predictor type values, starting with the default
   *     predictor
   */
  public static String createLocPredictorTypeValue(
      Map<PhaseType, List<EventRelocationPredictorDefinition>> eventRelocationDefinitionByPhaseType,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

    var defaultPredictor =
        eventRelocationProcessingDefinition
            .getEventRelocationPredictorDefinition("default")
            .predictor();

    var predictorByPhasesMap =
        eventRelocationDefinitionByPhaseType.entrySet().stream()
            .flatMap(
                entry ->
                    entry.getValue().stream()
                        .map(erpd -> Pair.of(erpd.predictor(), entry.getKey().getLabel())))
            .collect(
                Collectors.groupingBy(
                    Pair::getLeft, Collectors.mapping(Pair::getRight, Collectors.toList())));

    return defaultPredictor
        + COMMA_SEPARATOR
        + predictorByPhasesMap.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(
                entry ->
                    Pair.of(
                        entry.getKey(),
                        entry.getValue().stream()
                            .sorted()
                            .map(Object::toString)
                            .collect(Collectors.joining(COMMA_SEPARATOR))))
            .map(pair -> pair.getLeft() + "(" + pair.getRight() + ")")
            .collect(Collectors.joining(COMMA_SEPARATOR));
  }
}
