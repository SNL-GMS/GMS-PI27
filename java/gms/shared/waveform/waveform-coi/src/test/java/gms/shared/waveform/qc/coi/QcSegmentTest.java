package gms.shared.waveform.qc.coi;

import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class QcSegmentTest {

  @Test
  void testQcSegmentVersionOrdering() {

    var uuid = UUID.fromString("10000000-100-0000-1000-100000000080");

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");

    var qcSegmentVersionId_1 =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersionId_2 =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN.plusSeconds(10))
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersion_1 = QcSegmentVersion.createEntityReference(qcSegmentVersionId_1);
    var qcSegmentVersion_2 = QcSegmentVersion.createEntityReference(qcSegmentVersionId_2);

    var versionSet = Set.of(qcSegmentVersion_2, qcSegmentVersion_1);

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(channel)
            .setVersionHistory(new TreeSet<>(versionSet))
            .build();

    var qcSegment = QcSegment.instanceBuilder().setId(uuid).setData(data).build();

    Assertions.assertSame(qcSegmentVersion_2, qcSegment.getData().get().getVersionHistory().last());
  }

  @Test
  void testSerialization() {

    var uuid = UUID.fromString("10000000-100-0000-1000-1000000000801");

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(channel)
            .setVersionHistory(
                new TreeSet<>(
                    Set.of(
                        QcSegmentVersion.instanceBuilder()
                            .setId(qcSegmentVersionId)
                            .setData(
                                QcSegmentVersion.Data.instanceBuilder()
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
                            .build())))
            .build();

    var fullQcSegment = QcSegment.instanceBuilder().setId(uuid).setData(data).build();

    JsonTestUtilities.assertSerializes(fullQcSegment, QcSegment.class);
  }

  @Test
  void testFacetedVersionSerialization() {
    var uuid = UUID.fromString("10000000-100-0000-1000-100000000082");

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersionEntityReference =
        QcSegmentVersion.createEntityReference(qcSegmentVersionId);

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(channel)
            .setVersionHistory(new TreeSet<>(Set.of(qcSegmentVersionEntityReference)))
            .build();

    var fullQcSegment = QcSegment.instanceBuilder().setId(uuid).setData(data).build();

    JsonTestUtilities.assertSerializes(fullQcSegment, QcSegment.class);
  }

  @Test
  void testPreviousHistoryFaceting() {
    var uuid = UUID.fromString("10000000-100-0000-1000-100000000084");

    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channelSegment =
        ChannelSegmentTestFixtures.createChannelSegment(
            channel, List.of(WaveformTestFixtures.WAVEFORM_1));

    var qcSegmentVersionId_1 =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersionId_2 =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN.plusSeconds(10))
            .setParentQcSegmentId(uuid)
            .build();

    var qcSegmentVersion_1 =
        QcSegmentVersion.instanceBuilder()
            .setId(qcSegmentVersionId_1)
            .setData(
                QcSegmentVersion.Data.instanceBuilder()
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

    var qcSegmentVersion_2 =
        QcSegmentVersion.instanceBuilder()
            .setId(qcSegmentVersionId_2)
            .setData(
                QcSegmentVersion.Data.instanceBuilder()
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

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(channel)
            .setVersionHistory(new TreeSet<>(Set.of(qcSegmentVersion_1, qcSegmentVersion_2)))
            .build();

    var fullQcSegment = QcSegment.instanceBuilder().setId(uuid).setData(data).build();

    var reducedQcSegment = fullQcSegment.withPreviousHistoryAsEntityReference();

    Assertions.assertTrue(
        reducedQcSegment.getData().get().getVersionHistory().last().getData().isPresent());
    Assertions.assertTrue(
        reducedQcSegment.getData().get().getVersionHistory().first().getData().isEmpty());
  }
}
