package gms.shared.waveform.testfixture;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_4;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.createTestChannelData;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.getResponse;

import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.waveform.api.util.ChannelSegmentDescriptorRequest;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class WaveformRequestTestFixtures {
  private static final String STA_01_STA_01_BHE = "STA01.STA01.BHE";
  private static final String STA_02_STA_02_SHZ = "STA02.STA02.SHZ";
  private static final String CANONICAL_NAME_ONE = "Canonical Name One";
  public static final String STA1 = "STA01";

  public static final Channel WAVEFORM_CHANNEL =
      Channel.builder()
          .setName(STA_01_STA_01_BHE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA_01_STA_01_BHE)))
          .build();

  public static final Channel WAVEFORM_CHANNEL_EVENT_BEAM =
      Channel.builder()
          .setName(STA_01_STA_01_BHE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA_01_STA_01_BHE), STA1))
          .build();

  public static final Channel WAVEFORM_CHANNEL_LATER_ON_DATE =
      Channel.builder()
          .setName(STA_01_STA_01_BHE)
          .setEffectiveAt(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA_01_STA_01_BHE)))
          .build();

  public static final Channel WAVEFORM_CHANNEL_LATER_ON_DATE_2 =
      Channel.builder()
          .setName(STA_01_STA_01_BHE)
          .setEffectiveAt(Instant.EPOCH.plus(20, ChronoUnit.MINUTES))
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA_01_STA_01_BHE)))
          .build();

  public static final Channel WAVEFORM_CHANNEL_EARLY_ON_DATE =
      Channel.builder()
          .setName(STA_01_STA_01_BHE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA_01_STA_01_BHE)))
          .build();

  public static final Channel WAVEFORM_CHANNEL_2 =
      Channel.builder()
          .setName(STA_02_STA_02_SHZ)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData("Canonical Name Two", getResponse(STA_02_STA_02_SHZ)))
          .build();

  public static final Channel WAVEFORM_CHANNEL_2_LATER_ON_DATE =
      Channel.builder()
          .setName(STA_02_STA_02_SHZ)
          .setEffectiveAt(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .setData(createTestChannelData("Canonical Name Two", getResponse(STA_02_STA_02_SHZ)))
          .build();

  public static final ChannelTimeRangeRequest channelTimeRangeRequest =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.of(WAVEFORM_CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .build();

  public static final ChannelTimeRangeRequest unfacetedChannelTimeRangeRequest =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.of(WAVEFORM_CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .setFacetingDefinition(null)
          .build();

  public static final ChannelTimeRangeRequest channelTimeRangeRequest2Channels =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.of(WAVEFORM_CHANNEL, WAVEFORM_CHANNEL_2))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .build();

  public static final FacetingDefinition channelSegmentFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType("ChannelSegment")
          .setPopulated(true)
          .setFacetingDefinitions(
              Map.of(
                  "id.Channel",
                  FacetingDefinition.builder().setClassType("Channel").setPopulated(true).build()))
          .build();

  public static final FacetingDefinition channelSegmentFacetingDefinition2 =
      FacetingDefinition.builder().setClassType("ChannelSegment").setPopulated(true).build();

  public static final FacetingDefinition unfacetedChannelSegment =
      FacetingDefinition.builder().setClassType("ChannelSegment").setPopulated(false).build();

  public static final ChannelTimeRangeRequest facetedChannelTimeRangeRequest =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.of(WAVEFORM_CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .setFacetingDefinition(channelSegmentFacetingDefinition)
          .build();

  public static final ChannelTimeRangeRequest facetedChannelTimeRangeRequest2 =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.of(WAVEFORM_CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plus(10, ChronoUnit.MINUTES))
          .setFacetingDefinition(channelSegmentFacetingDefinition)
          .build();

  public static final ChannelSegmentDescriptor channelSegmentDescriptor =
      ChannelSegmentDescriptor.from(
          WAVEFORM_CHANNEL,
          Instant.EPOCH,
          Instant.EPOCH.plus(20, ChronoUnit.MINUTES),
          Instant.EPOCH);
  public static final ChannelSegmentDescriptor channelSegmentDescriptor2 =
      ChannelSegmentDescriptor.from(
          WAVEFORM_CHANNEL_2,
          Instant.EPOCH,
          Instant.EPOCH.plus(10, ChronoUnit.MINUTES),
          Instant.EPOCH.plus(10, ChronoUnit.MINUTES));
  public static final ChannelSegmentDescriptor channelSegmentDescriptorLater =
      ChannelSegmentDescriptor.from(
          WAVEFORM_CHANNEL_2,
          Instant.EPOCH,
          Instant.EPOCH.plus(10, ChronoUnit.MINUTES),
          Instant.EPOCH);

  public static final ChannelSegmentDescriptorRequest channelSegmentDescriptorRequest =
      ChannelSegmentDescriptorRequest.builder()
          .setChannelSegmentDescriptors(Arrays.asList(channelSegmentDescriptor))
          .build();

  public static final ChannelSegmentDescriptorRequest channelSegmentDescriptorRequest2 =
      ChannelSegmentDescriptorRequest.builder()
          .setChannelSegmentDescriptors(
              Arrays.asList(channelSegmentDescriptor, channelSegmentDescriptor2))
          .build();

  public static final ChannelSegmentDescriptorRequest facetedChannelSegmentDescriptorRequest =
      ChannelSegmentDescriptorRequest.builder()
          .setChannelSegmentDescriptors(Arrays.asList(channelSegmentDescriptor))
          .setFacetingDefinition(channelSegmentFacetingDefinition)
          .build();

  public static final ChannelsTimeFacetRequest channelsTimeFacetRequest =
      ChannelsTimeFacetRequest.builder()
          .setChannelNames(List.of(WAVEFORM_CHANNEL.getName()))
          .setEffectiveTime(WFDISC_DAO_1.getTime())
          .setFacetingDefinition(
              FacetingDefinition.builder()
                  .setPopulated(true)
                  .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                  .build())
          .build();

  public static final ChannelsTimeFacetRequest channelsTimeFacetRequest2 =
      ChannelsTimeFacetRequest.builder()
          .setChannelNames(List.of(WAVEFORM_CHANNEL.getName(), WAVEFORM_CHANNEL_2.getName()))
          .setEffectiveTime(WFDISC_DAO_1.getTime())
          .setFacetingDefinition(
              FacetingDefinition.builder()
                  .setPopulated(true)
                  .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                  .build())
          .build();

  public static final ChannelsTimeFacetRequest channelsTimeFacetRequest3 =
      ChannelsTimeFacetRequest.builder()
          .setChannelNames(List.of(WAVEFORM_CHANNEL.getName()))
          .setEffectiveTime(WFDISC_TEST_DAO_4.getTime())
          .setFacetingDefinition(
              FacetingDefinition.builder()
                  .setPopulated(true)
                  .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                  .build())
          .build();

  private WaveformRequestTestFixtures() {
    // private default constructor to hide implicit public one.
  }
}
