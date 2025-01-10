package gms.shared.fk.plugin;

import static gms.shared.fk.plugin.algorithms.util.FkTestUtilities.compareArrays;
import static gms.shared.fk.testfixtures.FkTestFixtures.DEFINITION;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNELS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNEL_SEGMENTS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_FKS;
import static gms.shared.waveform.testfixture.FkTestFixtures.RELATIVE_POSITION_MAP;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.plugin.fkspectra.FkSpectraPlugin;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectra;
import gms.shared.waveform.coi.FkSpectrum;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class CaponFkSpectraPluginTest {

  private FkSpectraPlugin plugin = new CaponFkSpectraPlugin();

  private static Stream<Arguments> handlerNullArguments() {
    return Stream.of(
        arguments(null, List.of(WaveformTestFixtures.CHANNEL_SEGMENT), DEFINITION),
        arguments(UtilsTestFixtures.STATION, null, DEFINITION),
        arguments(UtilsTestFixtures.STATION, List.of(WaveformTestFixtures.CHANNEL_SEGMENT), null));
  }

  @ParameterizedTest
  @MethodSource("handlerNullArguments")
  void testCreateNegativeArguments(
      Station station,
      Collection<ChannelSegment<Waveform>> channelSegments,
      FkSpectraDefinition definition) {
    assertThrows(
        NullPointerException.class, () -> plugin.generateFk(station, channelSegments, definition));
  }

  @Test
  void testGenerateFk() {
    List<ChannelGroup> channelGroups =
        BASE_CHANNELS.stream()
            .map(
                channel -> {
                  ChannelGroup.Data data =
                      ChannelGroup.Data.builder()
                          .setDescription("test Channel Group")
                          .setLocation(channel.getLocation())
                          .setStation(Station.createEntityReference("Test Station"))
                          .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
                          .setChannels(List.of(channel))
                          .build();

                  return ChannelGroup.builder()
                      .setName(channel.getName())
                      .setEffectiveAt(Instant.EPOCH)
                      .setData(data)
                      .build();
                })
            .collect(Collectors.toList());

    List<String> channelNames =
        BASE_CHANNELS.stream().map(Channel::getName).collect(Collectors.toList());

    List<RelativePositionChannelPair> relativePositionChannelPairs =
        RELATIVE_POSITION_MAP.entrySet().stream()
            .filter(entry -> channelNames.contains(entry.getKey().getName()))
            .map(entry -> RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
            .collect(Collectors.toList());

    Station station =
        Station.builder()
            .setName("Test Station")
            .setEffectiveAt(Instant.EPOCH)
            .setData(
                Station.Data.builder()
                    .setType(StationType.SEISMIC_ARRAY)
                    .setDescription("Test station")
                    .setRelativePositionChannelPairs(relativePositionChannelPairs)
                    .setLocation(Location.from(0, 0, 0, 0))
                    .setChannelGroups(channelGroups)
                    .setAllRawChannels(BASE_CHANNELS)
                    .build())
            .build();

    List<FkSpectra> fkSpectraList = plugin.generateFk(station, BASE_CHANNEL_SEGMENTS, DEFINITION);
    assertNotNull(fkSpectraList);
    assertEquals(1, fkSpectraList.size());
    FkSpectra fkSpectra = fkSpectraList.get(0);
    assertEquals(BASE_FKS.size(), fkSpectra.getValues().size());
    for (int i = 0; i < BASE_FKS.size(); i++) {
      FkSpectrum expected = BASE_FKS.get(i);
      FkSpectrum actual = fkSpectra.getValues().get(i);
      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }
}
