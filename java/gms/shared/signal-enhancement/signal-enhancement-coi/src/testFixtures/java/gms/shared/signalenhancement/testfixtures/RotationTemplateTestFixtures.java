package gms.shared.signalenhancement.testfixtures;

import static java.time.temporal.ChronoUnit.SECONDS;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.signalenhancement.coi.rotation.RotationDescription;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Contains test fixtures relating to {@link RotationTemplates} */
public final class RotationTemplateTestFixtures {

  private RotationTemplateTestFixtures() {
    // Utility class
  }

  public static final Duration SEC_DURATION = Duration.of(1, SECONDS);
  public static final Collection<Channel> INPUT_CHANNELS =
      List.of(
          DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1").toEntityReference(),
          DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH2").toEntityReference());
  public static final Station STATION = FkSpectraTemplateFixtures.ANY_STATION;
  public static final ChannelGroup INPUT_CHANNEL_GROUP =
      ChannelGroup.builder()
          .setName("ANY.CHGROUP")
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              ChannelGroup.Data.builder()
                  .setChannels(INPUT_CHANNELS)
                  .setDescription("Channel Description")
                  .setEffectiveUntil(Instant.MAX)
                  .setLocation(Location.from(0.0, 0.0, 0.0, 0.0))
                  .setStation(FkSpectraTemplateFixtures.ANY_STATION)
                  .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
                  .build())
          .build();
  public static final double TOLERANCE = 1.0;
  public static final double ANGLE = 2.0;
  public static final RotationDescription ROTATION_DESCRIPTION =
      RotationDescription.builder()
          .phaseType(PhaseType.UNSET)
          .samplingType(SamplingType.NEAREST_SAMPLE)
          .twoDimensional(true)
          .build();
  public static final double SAMPLE_RATE_TOLERANCE = 3.0;

  public static final RotationTemplate ROTATION_TEMPLATE_CHANNEL =
      new RotationTemplate(
          SEC_DURATION,
          Optional.of(INPUT_CHANNELS),
          Optional.empty(),
          SEC_DURATION,
          TOLERANCE,
          ANGLE,
          ROTATION_DESCRIPTION,
          SAMPLE_RATE_TOLERANCE,
          STATION.toEntityReference());

  public static final RotationTemplate ROTATION_TEMPLATE_CHANNEL_GROUP =
      new RotationTemplate(
          SEC_DURATION,
          Optional.empty(),
          Optional.of(INPUT_CHANNEL_GROUP.toEntityReference()),
          SEC_DURATION,
          TOLERANCE,
          ANGLE,
          ROTATION_DESCRIPTION,
          SAMPLE_RATE_TOLERANCE,
          STATION.toEntityReference());

  public static final RotationTemplate ROTATION_TEMPLATE_NO_CHANNEL_NO_GROUP =
      new RotationTemplate(
          SEC_DURATION,
          Optional.empty(),
          Optional.empty(),
          SEC_DURATION,
          TOLERANCE,
          ANGLE,
          ROTATION_DESCRIPTION,
          SAMPLE_RATE_TOLERANCE,
          STATION.toEntityReference());
}
