package gms.shared.waveform.bridge.repository;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.QcSegmentTestFixtures.DEFAULT_END;
import static gms.shared.waveform.testfixture.QcSegmentTestFixtures.DEFAULT_START;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.waveform.bridge.repository.utils.BridgedProcessingMaskCache;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentRepository;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedProcessingMaskRepositoryTest {

  @InjectMocks BridgedProcessingMaskRepository bridgedProcessingMaskRepository;

  @Mock BridgedProcessingMaskCache bridgedProcessingMaskCache;

  @Mock QcSegmentRepository qcSegmentRepositoryInterface;

  @Test
  void testCreate() {
    assertNotNull(
        new BridgedProcessingMaskRepository(
            bridgedProcessingMaskCache, qcSegmentRepositoryInterface));
  }

  @Test
  void testFindProcessingMasksByIdsNullCheck() {
    assertThrows(
        NullPointerException.class,
        () -> bridgedProcessingMaskRepository.findProcessingMasksByIds(null));
  }

  @Test
  void testFindProcessingMasksByIds() {
    var uuid = UUID.fromString("00000001-001-0001-0001-000000000001");
    var processingMaskItem = ProcessingMask.createEntityReference(uuid);

    when(bridgedProcessingMaskCache.findById(any())).thenReturn(Optional.of(processingMaskItem));
    var procMaskList = bridgedProcessingMaskRepository.findProcessingMasksByIds(List.of(uuid));
    assertEquals(List.of(processingMaskItem), procMaskList);
  }

  @Test
  void testCreateForChannelAndTimeRangeNullCheck() {
    var mockChannel = Mockito.mock(Channel.class);
    var mockInstant = Mockito.mock(Instant.class);
    var mockDefinition = Mockito.mock(ProcessingMaskDefinition.class);
    assertThrows(
        NullPointerException.class,
        () ->
            bridgedProcessingMaskRepository.createForChannelAndTimeRange(
                null, mockInstant, mockInstant, mockDefinition));
    assertThrows(
        NullPointerException.class,
        () ->
            bridgedProcessingMaskRepository.createForChannelAndTimeRange(
                mockChannel, null, mockInstant, mockDefinition));
    assertThrows(
        NullPointerException.class,
        () ->
            bridgedProcessingMaskRepository.createForChannelAndTimeRange(
                mockChannel, mockInstant, null, mockDefinition));
    assertThrows(
        NullPointerException.class,
        () ->
            bridgedProcessingMaskRepository.createForChannelAndTimeRange(
                mockChannel, mockInstant, mockInstant, null));
  }

  @Test
  void testCreateForChannelAndTimeRangeSimple() {
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    assertTrue(qcSegment.getData().isPresent(), "Precondition QcSegment must contain data");

    when(qcSegmentRepositoryInterface.findQcSegmentsByChannelsAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(qcSegment));

    // 1 channel, 1 processing mask, 1 qc segment
    var mockInstant = Mockito.mock(Instant.class);
    var def = ProcessingMaskTestFixtures.PROC_MASK_DEF_WAVEFORM_SPIKE;
    var procMaskList =
        bridgedProcessingMaskRepository.createForChannelAndTimeRange(
            WaveformTestFixtures.CHANNEL_NO_DATA, mockInstant, mockInstant, def);
    assertEquals(1, procMaskList.size(), "Expected ProcessingMask list size");
    // TODO validate that effectiveAt
    procMaskList.forEach(
        proc -> assertEquals(1, proc.getData().get().getMaskedQcSegmentVersions().size()));
    procMaskList.forEach(
        proc -> assertEquals(QcSegmentTestFixtures.DEFAULT_END, proc.getData().get().getEndTime()));
    procMaskList.forEach(
        proc ->
            assertEquals(QcSegmentTestFixtures.DEFAULT_END, proc.getData().get().getEffectiveAt()));
  }

  @Test
  void testCreateForChannelAndTimeRangeMultiple() {
    var uuid1 = UUID.fromString("21000000-100-0000-1000-100000000001");
    var uuid2 = UUID.fromString("21000000-100-0000-1000-100000000002");
    var qcSegment1 =
        QcSegmentTestFixtures.getGenericQcSegment(uuid1, DEFAULT_START, DEFAULT_END, DEFAULT_END);
    var shiftedStartTime = DEFAULT_END;
    var shiftedEndTime = DEFAULT_END.plus(60, ChronoUnit.SECONDS);
    var qcSegment2 =
        QcSegmentTestFixtures.getGenericQcSegment(
            uuid2, shiftedStartTime, shiftedEndTime, shiftedEndTime);

    assertTrue(qcSegment1.getData().isPresent(), "Precondition QcSegment must contain data");
    assertTrue(qcSegment2.getData().isPresent(), "Precondition QcSegment must contain data");

    when(qcSegmentRepositoryInterface.findQcSegmentsByChannelsAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(qcSegment1, qcSegment2));

    // 1 channel, 1 processing mask, 2 qc segments
    var mockInstant = Mockito.mock(Instant.class);
    var def = ProcessingMaskTestFixtures.PROC_MASK_DEF_WAVEFORM_SPIKE;
    var procMaskList =
        bridgedProcessingMaskRepository.createForChannelAndTimeRange(
            WaveformTestFixtures.CHANNEL_NO_DATA, mockInstant, mockInstant, def);
    assertEquals(1, procMaskList.size(), "Expected ProcessingMask list size");

    procMaskList.stream()
        .forEach(
            proc ->
                assertEquals(
                    2,
                    proc.getData().get().getMaskedQcSegmentVersions().size(),
                    "Expected QcSegmentVersions in ProcessingMask"));
    procMaskList.stream()
        .forEach(
            proc ->
                assertEquals(
                    DEFAULT_START,
                    proc.getData().get().getStartTime(),
                    "Expected ProcessingMask StartTime"));
    procMaskList.stream()
        .forEach(
            proc ->
                assertEquals(
                    shiftedEndTime,
                    proc.getData().get().getEndTime(),
                    "Expected ProcessingMask EndTime"));
    procMaskList.stream()
        .forEach(
            proc ->
                assertEquals(
                    shiftedEndTime,
                    proc.getData().get().getEffectiveAt(),
                    "Expected ProcessingMask EffectiveAt"));
  }

  @Test
  void testNoDerivedChannelInput() {
    var expectedErrorMsg = "Derived input channel discovered.  Must be a raw channel";
    var uuid = UUID.fromString("21000000-100-0000-1000-100000000003");

    var mockInstant = Mockito.mock(Instant.class);
    var def = ProcessingMaskTestFixtures.PROC_MASK_DEF_WAVEFORM_SPIKE;

    var filteredChannel = ChannelFactory.createMasked(CHANNEL, def);
    var err =
        assertThrows(
            IllegalStateException.class,
            () ->
                bridgedProcessingMaskRepository.createForChannelAndTimeRange(
                    filteredChannel, mockInstant, mockInstant, def));
    assertEquals(expectedErrorMsg, err.getMessage());
  }
}
