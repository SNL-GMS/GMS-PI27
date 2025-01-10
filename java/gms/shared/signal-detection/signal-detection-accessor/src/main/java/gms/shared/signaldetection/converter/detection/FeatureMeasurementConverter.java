package gms.shared.signaldetection.converter.detection;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.converter.measurementvalue.specs.AmplitudeMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.ArrivalTimeMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.DefaultMeasurementValueSpecVisitor;
import gms.shared.signaldetection.converter.measurementvalue.specs.EmergenceAngleMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.FirstMotionMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.PhaseTypeMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.ReceiverToSourceAzimuthMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.RectilinearityMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalue.specs.SlownessMeasurementValueSpecAcceptor;
import gms.shared.signaldetection.converter.measurementvalues.AmplitudeMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.ArrivalTimeMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.EmergenceAngleMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.FirstMotionMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.MeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.PhaseTypeMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.ReceiverToSourceAzimuthMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.RectilinearityMeasurementValueConverter;
import gms.shared.signaldetection.converter.measurementvalues.SlownessMeasurementValueConverter;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FeatureMeasurementConverter {

  private static final Logger LOGGER = LoggerFactory.getLogger(FeatureMeasurementConverter.class);

  private static final String CONVERTER_NOT_FOUND_MESSAGE =
      "Converter not found for measurement type: %s";

  // initialize the maps from measurement types to value specs and signal detection converter
  // functions
  private static final Map<
          FeatureMeasurementType<?>, Supplier<? extends MeasurementValueConverter<?>>>
      featureMeasurementFunctionMap =
          Map.of(
              FeatureMeasurementTypes.ARRIVAL_TIME,
              ArrivalTimeMeasurementValueConverter::create,
              FeatureMeasurementTypes.PHASE,
              PhaseTypeMeasurementValueConverter::create,
              FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
              ReceiverToSourceAzimuthMeasurementValueConverter::create,
              FeatureMeasurementTypes.SLOWNESS,
              SlownessMeasurementValueConverter::create,
              FeatureMeasurementTypes.EMERGENCE_ANGLE,
              EmergenceAngleMeasurementValueConverter::create,
              FeatureMeasurementTypes.RECTILINEARITY,
              RectilinearityMeasurementValueConverter::create,
              FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION,
              FirstMotionMeasurementValueConverter::create,
              FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION,
              FirstMotionMeasurementValueConverter::create,
              FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
              AmplitudeMeasurementValueConverter::create);

  private static final Map<
          FeatureMeasurementType<?>, Supplier<? extends MeasurementValueSpecAcceptor<?>>>
      featureMeasurementSpecMap =
          Map.of(
              FeatureMeasurementTypes.ARRIVAL_TIME,
              ArrivalTimeMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.PHASE,
              PhaseTypeMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
              ReceiverToSourceAzimuthMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.SLOWNESS,
              SlownessMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.EMERGENCE_ANGLE,
              EmergenceAngleMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.RECTILINEARITY,
              RectilinearityMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION,
              FirstMotionMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION,
              FirstMotionMeasurementValueSpecAcceptor::create,
              FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
              AmplitudeMeasurementValueSpecAcceptor::create);

  private static final Set<FeatureMeasurementType<?>> amplitudeFeatureMeasurementsTypesSet =
      Set.of(
          FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
          FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2_OR,
          FeatureMeasurementTypes.AMPLITUDE_ALR_OVER_2,
          FeatureMeasurementTypes.AMPLITUDE_ANL_OVER_2,
          FeatureMeasurementTypes.AMPLITUDE_ANP_OVER_2,
          FeatureMeasurementTypes.AMPLITUDE_FKSNR,
          FeatureMeasurementTypes.AMPLITUDE_NOI_LRM0,
          FeatureMeasurementTypes.AMPLITUDE_RMSAMP,
          FeatureMeasurementTypes.AMPLITUDE_SBSNR,
          FeatureMeasurementTypes.AMPTLIUDE_LRM0);

  /**
   * Create the {@link MeasurementValueSpec} spec from {@link FeatureMeasurementType}, {@link
   * ArrivalDao} and an optional {@link AssocDao}
   *
   * @param featureMeasurementType {@link FeatureMeasurementType} for measurement value
   * @param arrivalDao {@link ArrivalDao}
   * @param assocDao optional {@link AssocDao}
   * @param amplitudeDao optional {@link AmplitudeDao}
   * @param <V> measurement value class
   * @return {@link MeasurementValueSpec}
   */
  public <V> Stream<MeasurementValueSpec<V>> createMeasurementValueSpec(
      FeatureMeasurementType<V> featureMeasurementType,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {

    Objects.requireNonNull(featureMeasurementType);
    Objects.requireNonNull(arrivalDao);
    Objects.requireNonNull(assocDao);
    Preconditions.checkState(
        featureMeasurementSpecMap.containsKey(featureMeasurementType),
        CONVERTER_NOT_FOUND_MESSAGE,
        featureMeasurementType);

    MeasurementValueSpecAcceptor<V> converterSpecAcceptor =
        (MeasurementValueSpecAcceptor<V>)
            featureMeasurementSpecMap.get(featureMeasurementType).get();
    return converterSpecAcceptor.accept(
        DefaultMeasurementValueSpecVisitor.create(),
        featureMeasurementType,
        arrivalDao,
        assocDao,
        amplitudeDao);
  }

  /**
   * Creates and returns a FeatureMeasurement of type V unless it cannot and otherwise returns a
   * Option.empty()
   *
   * @param <V> The FeatureMeasurement type
   * @param measurementValueSpec The measurementValueSpec to use
   * @param channel The Channel to use
   * @param channelSegment the channelSegment to use
   * @return The Optional<FeatureMeasurement<V>> that was created
   */
  public <V> Optional<FeatureMeasurement<V>> convert(
      MeasurementValueSpec<V> measurementValueSpec,
      Channel channel,
      ChannelSegment<? extends Timeseries> channelSegment) {

    Objects.requireNonNull(measurementValueSpec);
    Objects.requireNonNull(channel);
    Objects.requireNonNull(channelSegment);

    FeatureMeasurementType<V> featureMeasurementType =
        measurementValueSpec.getFeatureMeasurementType();
    Preconditions.checkState(
        featureMeasurementSpecMap.containsKey(featureMeasurementType),
        CONVERTER_NOT_FOUND_MESSAGE,
        featureMeasurementType);

    // searches the map for the measurement value spec
    MeasurementValueConverter<V> converter =
        (MeasurementValueConverter<V>)
            featureMeasurementFunctionMap.get(featureMeasurementType).get();

    // only create an FM that contains a measurement value
    Optional<V> valueOpt = converter.convert(measurementValueSpec);

    return valueOpt.map(
        value ->
            FeatureMeasurement.<V>builder()
                .setChannel(channel)
                .setMeasuredChannelSegment(channelSegment)
                .setFeatureMeasurementType(featureMeasurementType)
                .setMeasurementValue(value)
                .build());
  }

  /**
   * Creates and returns a FeatureMeasurement of type V unless it cannot and otherwise returns a
   * Option.empty()
   *
   * @param <V> The FeatureMeasurement type
   * @param measurementValueSpec The measurementValueSpec to use
   * @param channel The Channel to use
   * @param channelSegment the channelSegment to use
   * @param analysisWaveform The WaveformAndFilterDefinition to use
   * @return The Optional<FeatureMeasurement<V>> that was created
   */
  public <V> Optional<FeatureMeasurement<V>> convert(
      MeasurementValueSpec<V> measurementValueSpec,
      Channel channel,
      ChannelSegment<? extends Timeseries> channelSegment,
      WaveformAndFilterDefinition analysisWaveform) {

    FeatureMeasurementType<V> featureMeasurementType =
        measurementValueSpec.getFeatureMeasurementType();
    var featureMeasurementOpt = convert(measurementValueSpec, channel, channelSegment);

    if (FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2.equals(featureMeasurementType)
        || featureMeasurementType.equals(FeatureMeasurementTypes.ARRIVAL_TIME)) {
      LOGGER.debug(
          "Passing unmodified Analysis Waveform to {} FeatureMeasurement conversion.",
          featureMeasurementType.getFeatureMeasurementTypeName());

    } else if (amplitudeFeatureMeasurementsTypesSet.contains(featureMeasurementType)) {
      LOGGER.debug(
          "Amplitude FeatureMeasurement of type {} should not have an Analysis Waveform. Assigning"
              + " to empty.",
          featureMeasurementType.getFeatureMeasurementTypeName());
      return featureMeasurementOpt;
    } else {
      LOGGER.debug(
          "Passing Analysis Waveform without FD Usage to Arrival-based FeatureMeasurement (type"
              + " {})",
          featureMeasurementType.getFeatureMeasurementTypeName());
      return featureMeasurementOpt.map(
          value ->
              fmWithAnalysisWaveform(
                  value,
                  analysisWaveform.toBuilder().setFilterDefinitionUsage(Optional.empty()).build()));
    }
    return featureMeasurementOpt.map(value -> fmWithAnalysisWaveform(value, analysisWaveform));
  }

  /**
   * Creates and returns a FeatureMeasurement of type V unless it cannot and otherwise returns a
   * Option.empty()
   *
   * @param <V> The FeatureMeasurement type
   * @param measurementValueSpec The measurementValueSpec to use
   * @param channel The Channel to use
   * @param channelSegment the channelSegment to use
   * @param snr the signal-to-noise ratio to use
   * @return The Optional<FeatureMeasurement<V>> that was created
   */
  public <V> Optional<FeatureMeasurement<V>> convert(
      MeasurementValueSpec<V> measurementValueSpec,
      Channel channel,
      ChannelSegment<? extends Timeseries> channelSegment,
      DoubleValue snr) {

    var featureMeasurementOpt = convert(measurementValueSpec, channel, channelSegment);

    return featureMeasurementOpt.map(value -> fmWithSnr(value, snr));
  }

  /**
   * Creates and returns a FeatureMeasurement of type V unless it cannot and otherwise returns a
   * Option.empty()
   *
   * @param <V> The FeatureMeasurement type
   * @param measurementValueSpec The measurementValueSpec to use
   * @param channel The Channel to use
   * @param channelSegment the channelSegment to use
   * @param snr the signal-to-noise ratio to use
   * @param analysisWaveform The WaveformAndFilterDefinition to use
   * @return The Optional<FeatureMeasurement<V>> that was created
   */
  public <V> Optional<FeatureMeasurement<V>> convert(
      MeasurementValueSpec<V> measurementValueSpec,
      Channel channel,
      ChannelSegment<? extends Timeseries> channelSegment,
      DoubleValue snr,
      WaveformAndFilterDefinition analysisWaveform) {

    Objects.requireNonNull(snr);
    Objects.requireNonNull(analysisWaveform);

    var featureMeasurementOpt =
        convert(measurementValueSpec, channel, channelSegment, analysisWaveform);

    return featureMeasurementOpt.map(value -> fmWithSnr(value, snr));
  }

  private static <V> FeatureMeasurement<V> fmWithSnr(FeatureMeasurement<V> fm, DoubleValue snr) {

    return fm.toBuilder().setSnr(snr).build();
  }

  private static <V> FeatureMeasurement<V> fmWithAnalysisWaveform(
      FeatureMeasurement<V> fm, WaveformAndFilterDefinition analysisWaveform) {

    return fm.toBuilder().setAnalysisWaveform(analysisWaveform).build();
  }
}
