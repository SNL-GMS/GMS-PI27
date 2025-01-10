package gms.shared.waveform.qc.coi;

import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class QcSegmentVersionTest {

  @Test
  void testSerialization() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000085");

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersion =
        QcSegmentVersion.instanceBuilder()
            .setId(qcSegmentVersionId)
            .setData(
                QcSegmentVersion.Data.instanceBuilder()
                    .setStageId(WorkflowDefinitionId.from("My Workflow"))
                    .setChannels(List.of(channel))
                    .setDiscoveredOn(List.of(channelSegment))
                    .setCreatedBy("The Creator")
                    .setRationale("Seemed like a good idea")
                    .setStartTime(Instant.MIN)
                    .setEndTime(Instant.MIN.plusSeconds(1))
                    .setRejected(false)
                    .setCategory(QcSegmentCategory.WAVEFORM)
                    .setType(QcSegmentType.FLAT)
                    .build())
            .build();

    JsonTestUtilities.assertSerializes(qcSegmentVersion, QcSegmentVersion.class);
  }

  @Test
  void testEntityReferenceSerialization() {
    var uuid = UUID.fromString("10000000-100-0000-1000-100000000086");

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersion = QcSegmentVersion.createEntityReference(qcSegmentVersionId);

    JsonTestUtilities.assertSerializes(qcSegmentVersion, QcSegmentVersion.class);
  }

  @ParameterizedTest
  @MethodSource("catagoryTypeSource")
  void testCatagoryTypeValidation(
      QcSegmentVersion.Data.Builder dataBuilder, boolean shouldThrowException) {

    if (shouldThrowException) {
      Assertions.assertThrows(IllegalArgumentException.class, () -> dataBuilder.build());
    } else {
      Assertions.assertDoesNotThrow(() -> dataBuilder.build());
    }
  }

  private static Stream<Arguments> catagoryTypeSource() {

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    return Stream.of(
        Arguments.arguments(
            QcSegmentVersion.Data.instanceBuilder()
                .setStageId(WorkflowDefinitionId.from("My Workflow"))
                .setChannels(List.of(channel))
                .setDiscoveredOn(List.of(channelSegment))
                .setCreatedBy("The Creator")
                .setRationale("Seemed like a good idea")
                .setStartTime(Instant.MIN)
                .setEndTime(Instant.MIN.plusSeconds(1))
                .setRejected(false)
                .setCategory(QcSegmentCategory.WAVEFORM)
                .setType(QcSegmentType.STATION_PROBLEM),
            true),
        Arguments.arguments(
            QcSegmentVersion.Data.instanceBuilder()
                .setStageId(WorkflowDefinitionId.from("My Workflow"))
                .setChannels(List.of(channel))
                .setDiscoveredOn(List.of(channelSegment))
                .setCreatedBy("The Creator")
                .setRationale("Seemed like a good idea")
                .setStartTime(Instant.MIN)
                .setEndTime(Instant.MIN.plusSeconds(1))
                .setRejected(false)
                .setType(QcSegmentType.NOISY),
            true),
        Arguments.arguments(
            QcSegmentVersion.Data.instanceBuilder()
                .setStageId(WorkflowDefinitionId.from("My Workflow"))
                .setChannels(List.of(channel))
                .setDiscoveredOn(List.of(channelSegment))
                .setCreatedBy("The Creator")
                .setRationale("Seemed like a good idea")
                .setStartTime(Instant.MIN)
                .setEndTime(Instant.MIN.plusSeconds(1))
                .setRejected(true)
                .setCategory(QcSegmentCategory.WAVEFORM)
                .setType(QcSegmentType.FLAT),
            true),
        Arguments.arguments(
            QcSegmentVersion.Data.instanceBuilder()
                .setStageId(WorkflowDefinitionId.from("My Workflow"))
                .setChannels(List.of(channel))
                .setDiscoveredOn(List.of(channelSegment))
                .setCreatedBy("The Creator")
                .setRationale("Seemed like a good idea")
                .setStartTime(Instant.MIN)
                .setEndTime(Instant.MIN.plusSeconds(1))
                .setRejected(false)
                .setCategory(QcSegmentCategory.ANALYST_DEFINED),
            false));
  }
}
