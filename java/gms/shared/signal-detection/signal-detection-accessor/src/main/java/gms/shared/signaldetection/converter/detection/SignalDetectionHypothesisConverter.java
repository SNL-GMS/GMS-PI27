package gms.shared.signaldetection.converter.detection;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.AmplitudeType;
import gms.shared.signaldetection.repository.utils.AmplitudeDaoAndChannelAssociation;
import gms.shared.signaldetection.repository.utils.ArrivalDaoAndChannelAssociation;
import gms.shared.signaldetection.repository.utils.SignalDetectionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SignalDetectionHypothesisConverter {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalDetectionHypothesisConverter.class);

  private final FeatureMeasurementConverter featureMeasurementConverter;
  private final SignalDetectionIdUtility signalDetectionIdUtility;

  /**
   * Create {@link SignalDetectionHypothesisConverter} instance using {@link
   * FeatureMeasurementConverter} to create the set of {@link FeatureMeasurement}s needed to create
   * a {@link SignalDetectionHypothesis}
   *
   * @param featureMeasurementConverter {@link FeatureMeasurementConverter} instance
   * @return {@link SignalDetectionHypothesisConverter}
   */
  @Autowired
  public SignalDetectionHypothesisConverter(
      FeatureMeasurementConverter featureMeasurementConverter,
      SignalDetectionIdUtility signalDetectionIdUtility) {
    this.featureMeasurementConverter = featureMeasurementConverter;
    this.signalDetectionIdUtility = signalDetectionIdUtility;
  }

  /**
   * Convert method definition for converting legacy DB to COI objects for SignalDetection.
   *
   * @param converterId the identifier combining stage, detection and hypothesis ids
   * @param arrivalAssociationAndWF the {@link ArrivalDaoAndChannelAssociation}
   *     and @{WaveformAndFilterDefinition} pair containing the arrival data for the {@link
   *     SignalDetectionHypothesis}
   * @param assocDao the optional {@link AssocDao} containing the data for the {@link
   *     SignalDetectionHypothesis}
   * @param monitoringOrganization the monitoring organization from which the {@link
   *     SignalDetectionHypothesis} was measured
   * @param station the {@link Station} on which the {@link SignalDetectionHypothesis} was measured
   * @param amplitudeAssociations the {@link AmplitudeDaoAndChannelAssociation} providing the
   *     amplitude data used to measure the {@link SignalDetectionHypothesis}
   * @param analysisWaveformsForAmpIds a map that provides the {@link WaveformAndFilterDefinition}s
   *     for the map's ampId keys. The map's values are used to bridge amplitude feature
   *     measurements analysisWaveform attribute
   * @return a SignalDetectionHypothesis object
   */
  public Optional<SignalDetectionHypothesis> convert(
      SignalDetectionHypothesisConverterId converterId,
      Pair<ArrivalDaoAndChannelAssociation, WaveformAndFilterDefinition> arrivalAssociationAndWF,
      Optional<AssocDao> assocDao,
      String monitoringOrganization,
      Station station,
      Collection<AmplitudeDaoAndChannelAssociation> amplitudeAssociations,
      Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpIds) {

    Objects.requireNonNull(converterId);
    Objects.requireNonNull(arrivalAssociationAndWF.getLeft());
    Objects.requireNonNull(assocDao);
    Objects.requireNonNull(station);
    Objects.requireNonNull(amplitudeAssociations);
    Objects.requireNonNull(arrivalAssociationAndWF.getRight());
    Objects.requireNonNull(analysisWaveformsForAmpIds);

    var arrivalAssociation = arrivalAssociationAndWF.getLeft();
    var arrivalAnalysisWaveform = arrivalAssociationAndWF.getRight();

    // check that the channel segments are all from the same station
    Stream.concat(
            amplitudeAssociations.stream().map(association -> association.getChannelSegment()),
            Stream.of(arrivalAssociation.getChannelSegment()))
        .forEach(
            (ChannelSegment<? extends Timeseries> channelSegment) -> {
              var channel = channelSegment.getId().getChannel();
              if (channel.isPresent()) {
                Preconditions.checkState(
                    channel.getStation().getName().equals(station.getName()),
                    "Channel must be from the provided station");
              }
            });

    if (assocDao.isPresent()) {
      Preconditions.checkState(
          assocDao.get().getId().getArrivalId() == arrivalAssociation.getArrivalDao().getId(),
          "Assoc and Arrival arid must be equal to create signal detection hypothesis.");
    }

    // create the SignalDetectionHypothesisId object
    UUID hypothesisId;
    if (assocDao.isPresent()) {
      var assocDaoVal = assocDao.get();
      hypothesisId =
          signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridOridAndStageId(
              assocDaoVal.getId().getArrivalId(),
              assocDaoVal.getId().getOriginId(),
              converterId.getLegacyDatabaseAccountId());
    } else {
      hypothesisId =
          signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
              arrivalAssociation.getArrivalDao().getId(), converterId.getLegacyDatabaseAccountId());
    }

    List<FeatureMeasurement<?>> featureMeasurements =
        createFeatureMeasurements(
            arrivalAssociation,
            assocDao,
            amplitudeAssociations,
            arrivalAnalysisWaveform,
            analysisWaveformsForAmpIds);

    Optional<SignalDetectionHypothesis.Data> signalDetectionHypothesisData;

    try {
      // try building the hypothesis data, if we get any exceptions set the SDH to empty
      signalDetectionHypothesisData =
          Optional.of(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(monitoringOrganization)
                  .setStation(station)
                  .setDeleted(false)
                  .setParentSignalDetectionHypothesis(
                      converterId
                          .getParentId()
                          .map(
                              parentId ->
                                  SignalDetectionHypothesis.createEntityReference(
                                      converterId.getDetectionId(), parentId)))
                  .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                  .build());

      return Optional.ofNullable(
          SignalDetectionHypothesis.from(
              SignalDetectionHypothesisId.from(converterId.getDetectionId(), hypothesisId),
              signalDetectionHypothesisData));
    } catch (Exception e) {
      LOGGER.warn("Signal detection hypothesis cannot be built: {}", e.getMessage());
      return Optional.empty();
    }
  }

  /**
   * Convert the provided detection id and {@link ArrivalDao}
   *
   * @param legacyDatabaseAccountId the string legacy database account id
   * @param detectionId the {@link UUID} of the signal detection containing the {@link
   *     SignalDetectionHypothesis} to create
   * @param arrivalDao the {@link ArrivalDao} containing the data for the {@link
   *     SignalDetectionHypothesis)}
   * @param assocDao the {@link AssocDao} that contains data
   * @return an entity reference {@link SignalDetectionHypothesis}
   */
  public Optional<SignalDetectionHypothesis> convertToEntityReference(
      String legacyDatabaseAccountId, UUID detectionId, ArrivalDao arrivalDao, AssocDao assocDao) {

    Objects.requireNonNull(legacyDatabaseAccountId);
    Objects.requireNonNull(detectionId);
    Objects.requireNonNull(arrivalDao);
    Objects.requireNonNull(assocDao);

    Preconditions.checkState(
        assocDao.getId().getArrivalId() == arrivalDao.getId(),
        "Assoc and Arrival arid must be equal to create signal detection hypothesis.");

    UUID hypothesisId;

    // create the SignalDetectionHypothesisId object
    hypothesisId =
        signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridOridAndStageId(
            assocDao.getId().getArrivalId(),
            assocDao.getId().getOriginId(),
            legacyDatabaseAccountId);

    return Optional.ofNullable(
        SignalDetectionHypothesis.createEntityReference(detectionId, hypothesisId));
  }

  /**
   * Convert the provided detection id and {@link ArrivalDao}
   *
   * @param legacyDatabaseAccountId the string legacy database account id
   * @param detectionId the {@link UUID} of the signal detection containing the {@link
   *     SignalDetectionHypothesis} to create
   * @param arrivalDao the {@link ArrivalDao} containing the data for the {@link
   *     SignalDetectionHypothesis)}
   * @return an entity reference {@link SignalDetectionHypothesis}
   */
  public Optional<SignalDetectionHypothesis> convertToEntityReference(
      String legacyDatabaseAccountId, UUID detectionId, ArrivalDao arrivalDao) {

    Objects.requireNonNull(legacyDatabaseAccountId);
    Objects.requireNonNull(detectionId);
    Objects.requireNonNull(arrivalDao);

    UUID hypothesisId;

    // create the SignalDetectionHypothesisId object
    hypothesisId =
        signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
            arrivalDao.getId(), legacyDatabaseAccountId);

    return Optional.ofNullable(
        SignalDetectionHypothesis.createEntityReference(detectionId, hypothesisId));
  }

  /**
   * Create list of {@link FeatureMeasurement}s using the {@link ArrivalDaoAndChannelAssociation},
   * the {@link AssocDao}, the {@link AmplitudeDaoAndChannelAssociation}, and the {@link
   * WaveformAndFilterDefinition}
   *
   * @param arrivalAssociation {@link ArrivalDaoAndChannelAssociation} wraps the arrivalDao,
   *     channel, and channel segment for creating the Feature Measurement associated with the
   *     arrivalDao.
   * @param assocDao {@link AssocDao} provides additional information for creating FMs
   * @param amplitudeAssociations {@link AmplitudeDaoAndChannelAssociation} a collection of
   *     associated amplitudeDaos,channels, and channel segments where each association corresponds
   *     to information used to create a FM from amplitude records.
   * @param arrivalAnalysisWaveform the {@link WaveformAndFilterDefinition} used to create
   *     featureMeasurments
   * @param analysisWaveformsForAmpids a map associating ampIds (key) with
   *     the @{WaveformAndFilterDefinition} used to bridge amplitude @{FeatureMeasurement}
   * @return list of {@link FeatureMeasurement}s, one for the arrivalDao and one for the
   *     amplitudeDaos corresponding to AmplitudeType.AMPLITUDE_A5_OVER_2.
   */
  private List<FeatureMeasurement<?>> createFeatureMeasurements(
      ArrivalDaoAndChannelAssociation arrivalAssociation,
      Optional<AssocDao> assocDao,
      Collection<AmplitudeDaoAndChannelAssociation> amplitudeAssociations,
      WaveformAndFilterDefinition arrivalAnalysisWaveform,
      Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids) {

    // Get the first entry with AmplitudeType.AMPLITUDE_A5_OVER_2.
    // Future support will include other AmplitudeTypes
    Optional<AmplitudeDaoAndChannelAssociation> amplitudeAssociationForFM =
        amplitudeAssociations.stream()
            .filter(
                amplitudeAssociation ->
                    amplitudeAssociation
                        .getAmplitudeDao()
                        .getAmplitudeType()
                        .equals(AmplitudeType.AMPLITUDE_A5_OVER_2.getName()))
            // Higher-level reductions allow us to assume there will only be one A5/2 Amplitude
            // association after the filter
            .findAny();

    // Create FMs for amplitudes - all passed amplitudeAssociations are currently of type
    // AMPLITUDE_A5_OVER_2
    Optional<FeatureMeasurement<AmplitudeMeasurementValue>> amplitudeFM =
        amplitudeAssociationForFM.flatMap(
            (AmplitudeDaoAndChannelAssociation amplitudeAssociation) -> {
              var spec =
                  featureMeasurementConverter.createMeasurementValueSpec(
                      FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
                      arrivalAssociation.getArrivalDao(),
                      assocDao,
                      Optional.of(amplitudeAssociation.getAmplitudeDao()));
              return spec.map(
                      valueSpec ->
                          buildAmplitudeFeatureMeasurement(
                              valueSpec, amplitudeAssociation, analysisWaveformsForAmpids))
                  .flatMap(Optional::stream)
                  // Amplitude measurement value spec always returns a singleton stream
                  .findFirst();
            });

    // List of FM enums that we need for building the FMs
    List<FeatureMeasurementType<?>> arrivalFmTypes =
        List.of(
            FeatureMeasurementTypes.ARRIVAL_TIME,
            FeatureMeasurementTypes.PHASE,
            FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
            FeatureMeasurementTypes.SLOWNESS,
            FeatureMeasurementTypes.EMERGENCE_ANGLE,
            FeatureMeasurementTypes.RECTILINEARITY,
            FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION,
            FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION);

    // Create the FM for the arrivalDao
    var arrivalFmStream =
        arrivalFmTypes.stream()
            .flatMap(
                fmType ->
                    featureMeasurementConverter.createMeasurementValueSpec(
                        fmType, arrivalAssociation.getArrivalDao(), assocDao, Optional.empty()))
            .map(
                (MeasurementValueSpec<? extends Object> spec) ->
                    buildArrivalFeatureMeasurement(
                        spec,
                        arrivalAssociation.getArrivalDao(),
                        arrivalAssociation.getChannel(),
                        (ChannelSegment<? extends Timeseries>)
                            arrivalAssociation.getChannelSegment(),
                        arrivalAnalysisWaveform))
            .flatMap(Optional::stream);

    return Stream.concat(arrivalFmStream, amplitudeFM.stream()).toList();
  }

  /**
   * Build a {@link FeatureMeasurement} using the {@link MeasurementValueSpec}, {@link ArrivalDao},
   * {@link Channel}, and the {@link ChannelSegment}
   *
   * @param spec input {@link MeasurementValueSpec}
   * @param arrivalDao input {@link ArrivalDao}
   * @param channel input {@link Channel} fully populated channel of the feature measurement
   * @param channelSegment {@link ChannelSegment} on which the feature
   * @param analysisWaveform the {@link WaveformAndFilterDefinition} to use measurement was made
   *     (entity reference)
   * @return {@link FeatureMeasurement}
   */
  private <V> Optional<FeatureMeasurement<V>> buildArrivalFeatureMeasurement(
      MeasurementValueSpec<V> spec,
      ArrivalDao arrivalDao,
      Channel channel,
      ChannelSegment<? extends Timeseries> segment,
      WaveformAndFilterDefinition analysisWaveform) {
    var snr = DoubleValue.from(arrivalDao.getSnr(), Optional.empty(), Units.DECIBELS);

    if (spec.getFeatureMeasurementType().equals(FeatureMeasurementTypes.ARRIVAL_TIME)) {
      return featureMeasurementConverter.convert(spec, channel, segment, snr, analysisWaveform);
    } else {
      return featureMeasurementConverter.convert(spec, channel, segment, analysisWaveform);
    }
  }

  private <V> Optional<FeatureMeasurement<V>> buildAmplitudeFeatureMeasurement(
      MeasurementValueSpec<V> spec,
      AmplitudeDaoAndChannelAssociation amplitudeAssociation,
      Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids) {

    var analysisWaveform =
        Optional.ofNullable(
            analysisWaveformsForAmpids.get(amplitudeAssociation.getAmplitudeDao().getId()));

    if (analysisWaveform.isEmpty()) {
      LOGGER.debug(
          "Amplitude with ampId[{}] and type [{}] feature measurement has no analysis waveform.",
          amplitudeAssociation.getAmplitudeDao().getId(),
          amplitudeAssociation.getAmplitudeDao().getAmplitudeType());
      return featureMeasurementConverter.convert(
          spec, amplitudeAssociation.getChannel(), amplitudeAssociation.getChannelSegment());
    } else {

      return featureMeasurementConverter.convert(
          spec,
          amplitudeAssociation.getChannel(),
          amplitudeAssociation.getChannelSegment(),
          analysisWaveform.get());
    }
  }
}
