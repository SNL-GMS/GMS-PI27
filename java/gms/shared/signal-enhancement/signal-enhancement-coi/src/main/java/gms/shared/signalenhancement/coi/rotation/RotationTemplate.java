package gms.shared.signalenhancement.coi.rotation;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import java.time.Duration;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;

/** Value class for storing the components of a Rotation Template */
public record RotationTemplate(
    Duration duration,
    Optional<Collection<Channel>> inputChannels,
    Optional<ChannelGroup> inputChannelGroup,
    Duration leadDuration,
    double locationToleranceKm,
    double orientationAngleToleranceDeg,
    RotationDescription rotationDescription,
    double sampleRateToleranceHz,
    Station station) {

  private static final int MIN_NUM_INPUT_CHANNELS = 2;
  private static final int MAX_NUM_INPUT_CHANNELS = 3;
  private static final double MAX_ANGLE_TOLERANCE = 360.0;
  private static final String ANGLE_TOLERANCE_MSG =
      "The orientationAngleToleranceDeg must be less than or equal to " + MAX_ANGLE_TOLERANCE;

  /**
   * Value class for storing the components of a Rotation Template.
   *
   * <p>Exactly one of inputChannels and inputChannelGroup must be populated; the other must be
   * empty.
   *
   * @param duration the non-null, non-negative {@link Duration} of each created rotated waveform
   * @param inputChannels an Optional collection of entity-reference input {@link Channels}
   * @param inputChannelGroup an Optional entity-reference input {@link ChannelGroup}
   * @param leadDuration the non-null, non-negative lead {@link Duration} with respect to a
   *     reference time
   * @param locationToleranceKm the non-negative distance within which the rotated object's location
   *     must be compared to the {@link Channel}'s location
   * @param orientationAngleToleranceDeg the maximum tolerance between 0 and 360 degrees of the
   *     unrotated {@link Channel} objects' orientation angles from orthogonality with each other
   * @param rotationDescription the {@link RotationDescription}
   * @param sampleRateToleranceHz the non-negative maximum tolerance from the rotated waveform's
   *     sample rate to the unrotated waveform's sample rate
   * @param station the non-null entity-reference {@link Station}
   */
  public RotationTemplate {
    Preconditions.checkNotNull(duration);
    Preconditions.checkNotNull(leadDuration);
    Preconditions.checkNotNull(rotationDescription);
    Preconditions.checkNotNull(station);

    Preconditions.checkArgument(!duration.isNegative(), "The duration must be non-negative");
    Preconditions.checkArgument(
        !leadDuration.isNegative(), "The leadDuration must be non-negative");
    Preconditions.checkArgument(
        locationToleranceKm >= 0.0, "The locationTolerance must be non-negative");
    Preconditions.checkArgument(
        orientationAngleToleranceDeg >= 0.0,
        "The orientationAngleToleranceDeg must be non-negative");
    Preconditions.checkArgument(
        orientationAngleToleranceDeg <= MAX_ANGLE_TOLERANCE, ANGLE_TOLERANCE_MSG);
    Preconditions.checkArgument(
        sampleRateToleranceHz >= 0.0, "The sampleRateRoleranceHz must be non-negative");
    Preconditions.checkArgument(
        station.getEffectiveAt().isEmpty(), "The station must be an entity reference");
    Preconditions.checkArgument(
        inputChannels.isEmpty() || inputChannelGroup.isEmpty(),
        "InputChannels and inputChannelGroups cannot both be present");

    inputChannelGroup.ifPresent(
        (ChannelGroup channelGroup) ->
            Preconditions.checkArgument(
                channelGroup.getEffectiveAt().isEmpty(),
                "The inputChannelGroup must be an entity reference"));

    inputChannels.ifPresent(
        (Collection<Channel> channels) -> {
          Preconditions.checkArgument(
              MIN_NUM_INPUT_CHANNELS <= channels.size()
                  && channels.size() <= MAX_NUM_INPUT_CHANNELS,
              "The number of input channels must be at least %d and at most %d, was %d",
              MIN_NUM_INPUT_CHANNELS,
              MAX_NUM_INPUT_CHANNELS,
              channels.size());
          channels.stream()
              .forEach(
                  (Channel channel) -> {
                    Preconditions.checkArgument(
                        channel.getEffectiveAt().isEmpty(),
                        "Each channel must be populated as an entity reference");
                    Preconditions.checkArgument(
                        channel.getName().contains(station.getName()),
                        "Each channel must be in the station");
                  });
        });
  }

  public static RotationTemplate.Builder builder() {
    return new AutoBuilder_RotationTemplate_Builder();
  }

  public static RotationTemplate.Builder builder(RotationTemplate rotationTemplate) {
    return new AutoBuilder_RotationTemplate_Builder(rotationTemplate);
  }

  public RotationTemplate.Builder toBuilder() {
    return new AutoBuilder_RotationTemplate_Builder(this);
  }

  @AutoBuilder
  public interface Builder {
    /** Sets the non-null, non-negative {@link Duration} of each created rotated waveform. */
    Builder setDuration(Duration duration);

    /**
     * Sets an Optional collection of entity-reference input {@link Channels}.
     *
     * <p>If the InputChannels are set, the InputChannelGroup must not be set
     */
    Builder setInputChannels(@Nullable Collection<Channel> inputChannels);

    /**
     * Sets an Optional entity-reference input {@link ChannelGroup}.
     *
     * <p>If the InputChannelGroup is set, the InputChannels must not be set
     */
    Builder setInputChannelGroup(@Nullable ChannelGroup inputChannelGroup);

    /** Sets the non-null, non-negative lead {@link Duration} with respect to a reference time. */
    Builder setLeadDuration(Duration leadDuration);

    /**
     * Sets the non-negative distance within which the rotated object's location must be compared to
     * the {@link Channel}'s location.
     */
    Builder setLocationToleranceKm(double locationToleranceKm);

    /**
     * Sets the maximum tolerance between 0 and 360 degrees of the unrotated {@link Channel}
     * objects' orientation angles from orthogonality with each other.
     */
    Builder setOrientationAngleToleranceDeg(double orientationAngleToleranceDeg);

    /** Sets the {@link RotationDescription}. */
    Builder setRotationDescription(RotationDescription rotationDescription);

    /**
     * Sets the non-negative maximum tolerance from the rotated waveform's sample rate to the
     * unrotated waveform's sample rate.
     */
    Builder setSampleRateToleranceHz(double sampleRateToleranceHz);

    /** Sets the non-null entity-reference {@link Station}. */
    Builder setStation(Station station);

    RotationTemplate autoBuild();

    Station getStation();

    Optional<ChannelGroup> getInputChannelGroup();

    Optional<Collection<Channel>> getInputChannels();

    /**
     * Builds the {@link RotationTemplate}, changing {@link Channel}s, the {@link ChannelGroup}, and
     * the {@link Station} to entity-references.
     */
    default RotationTemplate build() {
      getInputChannelGroup()
          .ifPresent(channelGroup -> setInputChannelGroup(channelGroup.toEntityReference()));
      getInputChannels()
          .ifPresent(
              inputChannels ->
                  setInputChannels(
                      inputChannels.stream().map(Channel::toEntityReference).toList()));
      setStation(getStation().toEntityReference());

      return autoBuild();
    }
  }
}
