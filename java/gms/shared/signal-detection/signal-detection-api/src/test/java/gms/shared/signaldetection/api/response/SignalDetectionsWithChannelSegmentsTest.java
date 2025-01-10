package gms.shared.signaldetection.api.response;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION;

import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class SignalDetectionsWithChannelSegmentsTest {

  @Disabled("Disabled until Feature Measurement's measuredChannelSegment attribute is repopulated")
  @Test
  void testSerialization() throws IOException {
    List<ChannelSegment<? extends Timeseries>> channelSegments =
        SIGNAL_DETECTION.getSignalDetectionHypotheses().stream()
            .map(SignalDetectionHypothesis::getFeatureMeasurements)
            .flatMap(Collection::stream)
            .flatMap(fm -> fm.getMeasuredChannelSegment().stream())
            .collect(Collectors.toList());
    SignalDetectionsWithChannelSegments sigDetWithSegments =
        SignalDetectionsWithChannelSegments.builder()
            .addSignalDetection(SIGNAL_DETECTION)
            .setChannelSegments(ImmutableSet.copyOf(channelSegments))
            .build();

    JsonTestUtilities.assertSerializes(
        sigDetWithSegments, SignalDetectionsWithChannelSegments.class);
  }
}
