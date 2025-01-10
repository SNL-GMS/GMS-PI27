package gms.shared.signalfeaturemeasurement.coi;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Optional;
import java.util.stream.Stream;
import javax.annotation.Nullable;

/**
 * Describes the waveform {@link ChannelSegment} that the system uses to measure a specific {@link
 * AmplitudeMeasurement} for a specific {@link Station}. The amplitude may be measured on a raw
 * {@link Channel} or a beamed {@link Channel}.
 */
public record AmplitudeMeasurementConditioningTemplate(
    AmplitudeMeasurementType amplitudeMeasurementType,
    Station station,
    Optional<BeamformingTemplate> beamformingTemplate,
    Optional<Channel> measuredChannel,
    Optional<FilterDefinition> filterDefinition,
    Optional<RotationTemplate> rotationTemplate) {

  /**
   * Describes the waveform {@link ChannelSegment} that the system uses to measure a specific {@link
   * AmplitudeMeasurement} for a specific {@link Station}.
   *
   * <p>Exactly one of rotationTemplate, beamformingTemplate, and measuredChannel must be populated.
   * Note that when either rotationTemplate or beamformingTemplate is populated, the corresponding
   * derived {@link Channel} is the measured {@link Channel}.
   *
   * <p>If a filterDefinition is populated along with a beamformingTemplate or rotationTemplate, the
   * filter is applied to beamed or rotated sample.
   *
   * <p>If the beamformingTemplate is populated, its {@link Station} attribute must match the {@link
   * Station} and its beamType attribute must be the AMPLITUDE {@link BeamType} literal.
   *
   * <p>If the rotatonTemplate is populated, its {@link Station} attribute must match the {@link
   * Station} and either its inputChannels collection or its inputChannelGroup attribute must be
   * populated.
   *
   * @param amplitudeMeasurementType the {@link AmplitudeMeasurementType} describing the measured
   *     amplitude's type
   * @param station the {@link Station} this amplitude is for, populated as an entity reference
   * @param beamformingTemplate a {@link BeamformingTemplate} that describes how to create a beamed
   *     waveform for measuring the amplitude
   * @param measuredChannel a raw {@link Channel} producing the waveform used for the amplitude
   *     measurement, populated as an entity reference
   * @param filterDefinition a {@link FilterDefinition} of the filter to be applied to the waveform
   *     sample
   * @param rotationTemplate a {@link RotationTemplate} that describes how to create a rotated
   *     waveform for measuring the amplitude
   */
  public AmplitudeMeasurementConditioningTemplate {
    Preconditions.checkNotNull(amplitudeMeasurementType);
    Preconditions.checkNotNull(station);
    Preconditions.checkNotNull(beamformingTemplate);
    Preconditions.checkNotNull(measuredChannel);
    Preconditions.checkNotNull(filterDefinition);
    Preconditions.checkNotNull(rotationTemplate);

    Preconditions.checkArgument(
        station.getEffectiveAt().isEmpty(), "The station must be an entity reference");

    var inputCount =
        Stream.of(
                beamformingTemplate.isPresent(),
                measuredChannel.isPresent(),
                rotationTemplate.isPresent())
            .filter(b -> b)
            .count();
    Preconditions.checkArgument(
        inputCount == 1,
        "Exactly 1 of measuredChannel, beamformingTemplate, and rotationTemplate"
            + " must be populated. Found ["
            + inputCount
            + "]");

    measuredChannel.ifPresent(
        (Channel channel) -> {
          Preconditions.checkArgument(
              channel.getEffectiveAt().isEmpty(),
              "The measuredChannel must be an entity reference");

          Preconditions.checkArgument(
              channel.getName().contains(station.getName()),
              "The measuredChannel must be Channel within the"
                  + " AmplitudeMeasurmentConditioningTemplate objects station");
        });

    beamformingTemplate.ifPresent(
        (BeamformingTemplate bt) -> {
          Preconditions.checkArgument(
              bt.getStation().toEntityReference().equals(station),
              "The beamformingTemplate station must match the AMCT station");
          Preconditions.checkArgument(
              bt.getBeamDescription().getBeamType() == BeamType.AMPLITUDE,
              "The beamformingTemplate's beamType must be AMPLITUDE. Found ["
                  + bt.getBeamDescription().getBeamType()
                  + "]");
        });

    rotationTemplate.ifPresent(
        (RotationTemplate rt) -> {
          Preconditions.checkArgument(
              rt.station().toEntityReference().equals(station),
              "The rotationTemplate's station must match the AMCT station");
          Preconditions.checkArgument(
              rt.inputChannels().isPresent() || rt.inputChannelGroup().isPresent(),
              "Either the inputChannels or the inputChannelGroup for the rotation template must be"
                  + " populated");
        });
  }

  public static AmplitudeMeasurementConditioningTemplate.Builder builder() {
    return new AutoBuilder_AmplitudeMeasurementConditioningTemplate_Builder();
  }

  public static AmplitudeMeasurementConditioningTemplate.Builder builder(
      AmplitudeMeasurementConditioningTemplate amct) {
    return new AutoBuilder_AmplitudeMeasurementConditioningTemplate_Builder(amct);
  }

  public AmplitudeMeasurementConditioningTemplate.Builder toBuilder() {
    return new AutoBuilder_AmplitudeMeasurementConditioningTemplate_Builder(this);
  }

  @AutoBuilder
  public interface Builder {

    /** The {@link AmplitudeMeasurementType} describing the measured amplitude's type. */
    Builder setAmplitudeMeasurementType(AmplitudeMeasurementType amplitudeMeasurementType);

    /** The {@link Station} this amplitude is for, populated as an entity reference. */
    Builder setStation(Station station);

    /**
     * A {@link BeamformingTemplate} that describes how to create a beamed waveform for measuring
     * the amplitude. Exactly one of the rotation template, beamforming template, and channel must
     * be populated.
     */
    Builder setBeamformingTemplate(@Nullable BeamformingTemplate beamformingTemplate);

    /**
     * A raw {@link Channel} producing the waveform used for the amplitude measurement, populated as
     * an entity reference. Exactly one of the rotation template, beamforming template, and channel
     * must be populated.
     */
    Builder setMeasuredChannel(@Nullable Channel measuredChannel);

    /**
     * A {@link FilterDefinition} of the filter to be applied to the waveform sample. It is applied
     * to the rotated or beamed sample if applicable.
     */
    Builder setFilterDefinition(@Nullable FilterDefinition filterDefinition);

    /**
     * A {@link RotationTemplate} that describes how to create a rotated waveform for measuring the
     * amplitude. Exactly one of the rotation template, beamforming template, and channel must be
     * populated.
     */
    Builder setRotationTemplate(@Nullable RotationTemplate rotationTemplate);

    Station getStation();

    Optional<Channel> getMeasuredChannel();

    /**
     * Builds the {@link AmplitudeMeasurementConditioningTemplate}, changing the {@link Station} and
     * {@link Channel} (if present) to entity references.
     */
    default AmplitudeMeasurementConditioningTemplate build() {
      getMeasuredChannel().ifPresent(channel -> setMeasuredChannel(channel.toEntityReference()));
      setStation(getStation().toEntityReference());
      return autoBuild();
    }

    AmplitudeMeasurementConditioningTemplate autoBuild();
  }
}
