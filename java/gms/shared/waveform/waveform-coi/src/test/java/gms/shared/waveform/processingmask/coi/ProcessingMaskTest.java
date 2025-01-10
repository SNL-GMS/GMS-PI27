package gms.shared.waveform.processingmask.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** */
class ProcessingMaskTest {

  @Test
  void testEntityReferenceSerialization() {
    var uuid = UUID.fromString("10000000-100-0000-1000-100000000077");

    var pmEntity = ProcessingMask.createEntityReference(uuid);

    JsonTestUtilities.assertSerializes(pmEntity, ProcessingMask.class);
  }

  @Test
  void testSerialization() {

    var currTime = Instant.now();

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(UUID.fromString("10000000-100-0000-1000-100000000078"))
            .build();

    var qcSegmentVersionOne =
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

    var qcSegmentVersionTwo =
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
                    .setType(QcSegmentType.NOISY)
                    .build())
            .build();

    var pmData =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(currTime)
            .setStartTime(currTime)
            .setEndTime(currTime)
            .setProcessingOperation(ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM)
            .setAppliedToRawChannel(channel.toEntityReference())
            .setMaskedQcSegmentVersions(List.of(qcSegmentVersionOne, qcSegmentVersionTwo));

    var idArray =
        Arrays.toString(Long.toString(404).getBytes())
            + Arrays.toString(Long.toString(0).getBytes())
            + ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM
            + channel.getName();
    var uuid = UUID.nameUUIDFromBytes(idArray.getBytes());

    var pmFull = ProcessingMask.instanceBuilder().setId(uuid).setData(pmData.build()).build();

    JsonTestUtilities.assertSerializes(pmFull, ProcessingMask.class);
  }

  @Test
  void testDataEmptyPreconditions() {

    var timeInstant = Instant.now();
    var pmBuider = ProcessingMask.Data.instanceBuilder();
    assertThrows(IllegalStateException.class, () -> pmBuider.build());

    // times are missing
    var data =
        ProcessingMask.Data.instanceBuilder()
            .setProcessingOperation(ProcessingOperation.ROTATION)
            .setAppliedToRawChannel(Channel.createEntityReference("testchannel"))
            .setMaskedQcSegmentVersions(List.of());

    assertThrows(IllegalStateException.class, () -> data.build());

    // empty version list
    var data1 =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(timeInstant)
            .setStartTime(timeInstant)
            .setEndTime(timeInstant)
            .setProcessingOperation(ProcessingOperation.ROTATION)
            .setAppliedToRawChannel(Channel.createEntityReference("testchannel"))
            .setMaskedQcSegmentVersions(List.of());

    var exceptionResult = assertThrows(IllegalStateException.class, () -> data1.build());
    assertEquals("MaskedQcSegmentVersions must not be empty", exceptionResult.getMessage());

    // end time before start time
    var data2 =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(timeInstant)
            .setStartTime(timeInstant)
            .setEndTime(timeInstant.minusNanos(1))
            .setProcessingOperation(ProcessingOperation.ROTATION)
            .setAppliedToRawChannel(Channel.createEntityReference("testchannel"))
            .setMaskedQcSegmentVersions(List.of());

    assertThrows(IllegalStateException.class, () -> data2.build());
  }

  @Test
  void testDataBadChannel() {

    var currTime = Instant.now();

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(UUID.fromString("10000000-100-0000-1000-100000000079"))
            .build();

    var qcSegmentVersionOne =
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

    var pmData =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(currTime)
            .setStartTime(currTime)
            .setEndTime(currTime)
            .setProcessingOperation(ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM)
            .setAppliedToRawChannel(Channel.createEntityReference("TestChannelNameOne"))
            .setMaskedQcSegmentVersions(List.of(qcSegmentVersionOne));

    var exceptionResult = assertThrows(IllegalStateException.class, () -> pmData.build());
    assertTrue(exceptionResult.getMessage().contains("does not match all of the channel names"));
  }
}
