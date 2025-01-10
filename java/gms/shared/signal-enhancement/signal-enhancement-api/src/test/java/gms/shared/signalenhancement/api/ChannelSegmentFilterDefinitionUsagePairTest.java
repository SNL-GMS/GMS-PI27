package gms.shared.signalenhancement.api;

import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ChannelSegmentFilterDefinitionUsagePairTest {
  @Test
  void testSerialization() {
    Channel channel =
        Channel.builder().setName("Test Channel").setEffectiveAt(Instant.EPOCH).build();
    ChannelSegment cs =
        ChannelSegment.builder()
            .setId(
                ChannelSegmentDescriptor.from(
                    channel, Instant.EPOCH.plusSeconds(10), Instant.EPOCH, Instant.EPOCH))
            .build();
    ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair
        channelSegmentDescriptorFilterDefinitionUsagePair =
            ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.create(
                cs, getFilterDefinitionByFilterDefinitionUsage());

    JsonTestUtilities.assertSerializes(
        channelSegmentDescriptorFilterDefinitionUsagePair,
        ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.class);
  }

  private FilterDefinitionByFilterDefinitionUsage getFilterDefinitionByFilterDefinitionUsage() {
    Map<FilterDefinitionUsage, FilterDefinition> map = new HashMap<>();
    map.put(FilterDefinitionUsage.FK, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    return FilterDefinitionByFilterDefinitionUsage.from(ImmutableMap.copyOf(map));
  }
}
