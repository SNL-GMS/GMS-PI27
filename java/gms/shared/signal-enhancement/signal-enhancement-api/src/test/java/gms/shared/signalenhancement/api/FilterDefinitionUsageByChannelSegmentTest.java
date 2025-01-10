package gms.shared.signalenhancement.api;

import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class FilterDefinitionUsageByChannelSegmentTest {
  @Test
  void testSerialization() {
    FilterDefinitionByUsageByChannelSegment filterDefinitionByUsageForChannelSegmentDescriptor =
        FilterDefinitionByUsageByChannelSegment.from(
            getChannelSegmentFilterDefinitionByFilterDefinitionUsagePair());

    JsonTestUtilities.assertSerializes(
        filterDefinitionByUsageForChannelSegmentDescriptor,
        FilterDefinitionByUsageByChannelSegment.class);
  }

  @Test
  void testChannelSegmentByFilterDefinitionByFilterDefinitionUsageMap() {
    FilterDefinitionByUsageByChannelSegment filterDefinitionByUsageForChannelSegment =
        FilterDefinitionByUsageByChannelSegment.from(
            getChannelSegmentFilterDefinitionByFilterDefinitionUsagePair());

    Map<ChannelSegment<Waveform>, FilterDefinitionByFilterDefinitionUsage>
        channelSegmentByFilterDefinitionByFilterDefinitionUsage =
            filterDefinitionByUsageForChannelSegment
                .getChannelSegmentByFilterDefinitionByFilterDefinitionUsage();

    Assertions.assertFalse(channelSegmentByFilterDefinitionByFilterDefinitionUsage.isEmpty());
  }

  @Test
  void testChannelSegmentDescriptorByFilterDefinitionUsageMap() {
    FilterDefinitionByUsageByChannelSegment filterDefinitionByUsageForChannelSegment =
        FilterDefinitionByUsageByChannelSegment.from(
            getChannelSegmentFilterDefinitionByFilterDefinitionUsagePair());

    Map<ChannelSegment<Waveform>, List<FilterDefinitionUsage>>
        channelSegmentByFilterDefinitionUsageMap =
            filterDefinitionByUsageForChannelSegment.getChannelSegmentByFilterDefinitionUsage();

    Assertions.assertEquals(2, channelSegmentByFilterDefinitionUsageMap.size());

    List<FilterDefinitionUsage> filterDefinitionUsages =
        channelSegmentByFilterDefinitionUsageMap.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());

    Assertions.assertTrue(filterDefinitionUsages.contains(FilterDefinitionUsage.FK));
  }

  @Test
  void testChannelSegmentByFilterDefinitionMap() {
    FilterDefinitionByUsageByChannelSegment filterDefinitionByUsageForChannelSegment =
        FilterDefinitionByUsageByChannelSegment.from(
            getChannelSegmentFilterDefinitionByFilterDefinitionUsagePair());

    Map<ChannelSegment<Waveform>, List<FilterDefinition>>
        signalDetectionHypothesisByFilterDefinitionUsageMap =
            filterDefinitionByUsageForChannelSegment.getChannelSegmentByFilterDefinition();

    Assertions.assertEquals(2, signalDetectionHypothesisByFilterDefinitionUsageMap.size());

    List<FilterDefinition> filterDefinitionUsages =
        signalDetectionHypothesisByFilterDefinitionUsageMap.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());

    Assertions.assertEquals("0.4 3.5 48 BP causal", filterDefinitionUsages.get(0).getName());
  }

  private List<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair>
      getChannelSegmentFilterDefinitionByFilterDefinitionUsagePair() {
    Channel channel =
        Channel.builder().setName("Test Channel").setEffectiveAt(Instant.EPOCH).build();
    ChannelSegment cs1 =
        ChannelSegment.builder()
            .setId(
                ChannelSegmentDescriptor.from(
                    channel, Instant.EPOCH.plusSeconds(10), Instant.EPOCH, Instant.EPOCH))
            .build();
    ChannelSegment cs2 =
        ChannelSegment.builder()
            .setId(
                ChannelSegmentDescriptor.from(
                    channel, Instant.EPOCH.plusSeconds(20), Instant.EPOCH, Instant.EPOCH))
            .build();
    ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair
        channelSegmentDescriptorFilterDefinitionUsagePair1 =
            ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.create(
                cs1, getFilterDefinitionByFilterDefinitionUsage());
    ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair
        channelSegmentDescriptorFilterDefinitionUsagePair2 =
            ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.create(
                cs2, getFilterDefinitionByFilterDefinitionUsage());
    return List.of(
        channelSegmentDescriptorFilterDefinitionUsagePair1,
        channelSegmentDescriptorFilterDefinitionUsagePair2);
  }

  private FilterDefinitionByFilterDefinitionUsage getFilterDefinitionByFilterDefinitionUsage() {
    Map<FilterDefinitionUsage, FilterDefinition> map = new HashMap<>();
    map.put(FilterDefinitionUsage.FK, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    return FilterDefinitionByFilterDefinitionUsage.from(ImmutableMap.copyOf(map));
  }
}
