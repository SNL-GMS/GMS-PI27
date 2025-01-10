package gms.shared.waveform.api.util;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.WaveformRequestTestFixtures;
import java.io.IOException;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class SerializationTest {

  @ParameterizedTest
  @MethodSource("getSerializationArguments")
  @SuppressWarnings("unchecked")
  <T> void testSerialization(T request, Class<T> clazz) throws IOException {
    JsonTestUtilities.assertSerializes(request, clazz);
  }

  static Stream<Arguments> getSerializationArguments() {
    return Stream.of(
        arguments(
            WaveformRequestTestFixtures.channelTimeRangeRequest, ChannelTimeRangeRequest.class),
        arguments(
            WaveformRequestTestFixtures.facetedChannelTimeRangeRequest,
            ChannelTimeRangeRequest.class),
        arguments(
            WaveformRequestTestFixtures.channelSegmentDescriptorRequest,
            ChannelSegmentDescriptorRequest.class),
        arguments(
            WaveformRequestTestFixtures.facetedChannelSegmentDescriptorRequest,
            ChannelSegmentDescriptorRequest.class));
  }
}
