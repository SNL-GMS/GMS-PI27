package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.accessor.DefaultStationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategoryAndType;
import gms.shared.stationdefinition.coi.qc.TaperDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.FieldMapUtilities;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedProcessingMaskLoaderTest {

  @InjectMocks
  private final DefaultStationDefinitionAccessor accessor =
      Mockito.mock(DefaultStationDefinitionAccessor.class);

  @InjectMocks
  private final BridgedProcessingMaskRepository repository =
      Mockito.mock(BridgedProcessingMaskRepository.class);

  private final BridgedProcessingMaskLoader pmlb =
      new BridgedProcessingMaskLoader(accessor, repository);

  private final Channel RAW_CHANNEL = Channel.createVersionReference("Raw Channel", Instant.MIN);

  private final Channel.Data DATA =
      Channel.Data.builder()
          .setCanonicalName("Canonical Name")
          .setChannelBandType(ChannelBandType.BROADBAND)
          .setChannelDataType(ChannelDataType.WEATHER)
          .setChannelInstrumentType(ChannelInstrumentType.ACCELEROMETER)
          .setChannelOrientationCode('N')
          .setChannelOrientationType(ChannelOrientationType.NORTH_SOUTH)
          .setConfiguredInputs(List.of())
          .setDescription("Description")
          .setEffectiveUntil(Instant.EPOCH)
          .setLocation(Location.from(0, 0, 0, 0))
          .setNominalSampleRateHz(100)
          .setOrientationAngles(Orientation.from(Optional.of(10.0), Optional.of(10.0)))
          .setProcessingDefinition(Map.of())
          .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "CG value"))
          .setResponse(Optional.empty())
          .setStation(Station.createEntityReference("Station"))
          .setUnits(Units.UNITLESS)
          .build();

  private final ProcessingMaskDefinition PROC_MASK_DEF =
      new ProcessingMaskDefinition(
          Duration.ofMinutes(0),
          ProcessingOperation.ROTATION,
          Set.of(QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
          new TaperDefinition(4, TaperFunction.BLACKMAN));

  private final ProcessingMask PROC_MASK_ENTITY =
      ProcessingMask.createEntityReference(UUID.fromString("12345cc2-8c86-4fa1-a764-c9b9944614b7"));

  private final ProcessingMask PROC_MASK_AMB =
      ProcessingMask.instanceBuilder()
          .setId(UUID.fromString("12346cc2-8c86-4fa1-a764-c9b9944614b7"))
          .setData(
              ProcessingMask.Data.instanceBuilder()
                  .setAppliedToRawChannel(RAW_CHANNEL)
                  .setProcessingOperation(ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM)
                  .setEffectiveAt(Instant.MIN)
                  .setEndTime(Instant.EPOCH)
                  .setStartTime(Instant.MIN)
                  .setMaskedQcSegmentVersions(
                      List.of(
                          QcSegmentVersion.createEntityReference(
                              QcSegmentVersionId.instanceBuilder()
                                  .setEffectiveAt(Instant.EPOCH)
                                  .setParentQcSegmentId(
                                      UUID.fromString("12346cc2-8c86-4fa1-a764-c9b9944614b7"))
                                  .build())))
                  .build())
          .build();

  private final ProcessingMask PROC_MASK_DF =
      ProcessingMask.instanceBuilder()
          .setId(UUID.fromString("12347cc2-8c86-4fa1-a764-c9b9944614b7"))
          .setData(
              ProcessingMask.Data.instanceBuilder()
                  .setAppliedToRawChannel(RAW_CHANNEL)
                  .setProcessingOperation(ProcessingOperation.DISPLAY_FILTER)
                  .setEffectiveAt(Instant.MIN)
                  .setEndTime(Instant.EPOCH)
                  .setStartTime(Instant.MIN)
                  .setMaskedQcSegmentVersions(
                      List.of(
                          QcSegmentVersion.createEntityReference(
                              QcSegmentVersionId.instanceBuilder()
                                  .setEffectiveAt(Instant.EPOCH)
                                  .setParentQcSegmentId(
                                      UUID.fromString("12347cc2-8c86-4fa1-a764-c9b9944614b7"))
                                  .build())))
                  .build())
          .build();

  private final ProcessingMask PROC_MASK_SDB =
      ProcessingMask.instanceBuilder()
          .setId(UUID.fromString("12348cc2-8c86-4fa1-a764-c9b9944614b7"))
          .setData(
              ProcessingMask.Data.instanceBuilder()
                  .setAppliedToRawChannel(RAW_CHANNEL)
                  .setProcessingOperation(ProcessingOperation.SIGNAL_DETECTION_BEAM)
                  .setEffectiveAt(Instant.MIN)
                  .setEndTime(Instant.EPOCH)
                  .setStartTime(Instant.MIN)
                  .setMaskedQcSegmentVersions(
                      List.of(
                          QcSegmentVersion.createEntityReference(
                              QcSegmentVersionId.instanceBuilder()
                                  .setEffectiveAt(Instant.EPOCH)
                                  .setParentQcSegmentId(
                                      UUID.fromString("12348cc2-8c86-4fa1-a764-c9b9944614b7"))
                                  .build())))
                  .build())
          .build();

  private final ProcessingMask PROC_MASK_SG =
      ProcessingMask.instanceBuilder()
          .setId(UUID.fromString("12349cc2-8c86-4fa1-a764-c9b9944614b7"))
          .setData(
              ProcessingMask.Data.instanceBuilder()
                  .setAppliedToRawChannel(RAW_CHANNEL)
                  .setProcessingOperation(ProcessingOperation.SPECTROGRAM)
                  .setEffectiveAt(Instant.MIN)
                  .setEndTime(Instant.EPOCH)
                  .setStartTime(Instant.MIN)
                  .setMaskedQcSegmentVersions(
                      List.of(
                          QcSegmentVersion.createEntityReference(
                              QcSegmentVersionId.instanceBuilder()
                                  .setEffectiveAt(Instant.EPOCH)
                                  .setParentQcSegmentId(
                                      UUID.fromString("12349cc2-8c86-4fa1-a764-c9b9944614b7"))
                                  .build())))
                  .build())
          .build();

  @BeforeEach
  void setupTest() {
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(RAW_CHANNEL.getName()), RAW_CHANNEL.getEffectiveAt().get()))
        .thenReturn(List.of(RAW_CHANNEL));
  }

  @Test
  void testRepositoryAndAccessor() {
    Assertions.assertNotNull(pmlb);
  }

  @Test
  void testEntityReferenceAsInput() {
    var entityReference = Channel.createEntityReference("Entity");

    Assertions.assertThrows(
        IllegalStateException.class,
        () -> pmlb.loadProcessingMasks(entityReference, Instant.MIN, Instant.EPOCH));
  }

  @Test
  void testRawAsInput() {
    var masks = pmlb.loadProcessingMasks(RAW_CHANNEL, Instant.MIN, Instant.EPOCH);
    Assertions.assertEquals(0, masks.size(), "No masks should be returned for raw inputs");
  }

  @Test
  void testNoMaskedAsInput() {
    var derivedChildVer = Channel.createVersionReference("Derived Channel Child/beam", Instant.MIN);
    var derivedChildFull =
        derivedChildVer.toBuilder()
            .setData(
                DATA.toBuilder().setConfiguredInputs(List.of(RAW_CHANNEL, RAW_CHANNEL)).build())
            .build();

    var derivedTopVer = Channel.createVersionReference("Derived Channel Top/beam", Instant.MIN);
    var derivedTopFull =
        derivedTopVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL, derivedChildVer, derivedChildVer))
                    .build())
            .build();

    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(derivedChildVer.getName()), derivedChildVer.getEffectiveAt().get()))
        .thenReturn(List.of(derivedChildFull));

    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(derivedTopVer.getName()), derivedTopVer.getEffectiveAt().get()))
        .thenReturn(List.of(derivedTopFull));

    var masks = pmlb.loadProcessingMasks(derivedTopVer, Instant.MIN, Instant.EPOCH);
    Assertions.assertEquals(
        0, masks.size(), "No masks should be returned for derived inputs that aren't masked");
  }

  @Test
  void testDerivedChannelWithNoConfiguredInputs() {
    var maskedVer = Channel.createVersionReference("Masked Channel/masked", Instant.MIN);
    var maskedFull =
        maskedVer.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of()).build())
            .build();

    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedVer.getName()), maskedVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedFull));

    Assertions.assertThrows(
        IllegalStateException.class,
        () -> pmlb.loadProcessingMasks(maskedVer, Instant.MIN, Instant.EPOCH));
  }

  @Test
  void testMaskedNoProcessingMaskDefinition() {
    var maskedVer = Channel.createVersionReference("Masked Channel/masked", Instant.MIN);
    var maskedFull =
        maskedVer.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of(RAW_CHANNEL)).build())
            .build();

    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedVer.getName()), maskedVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedFull));

    Assertions.assertThrows(
        IllegalStateException.class,
        () -> pmlb.loadProcessingMasks(maskedVer, Instant.MIN, Instant.EPOCH));
  }

  @Test
  void testSingleMaskedAsInput() {
    var maskedVer = Channel.createVersionReference("Masked Channel/masked", Instant.MIN);
    var maskedFull =
        maskedVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();

    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedVer.getName()), maskedVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedFull));

    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_ENTITY, PROC_MASK_AMB));

    var masks = pmlb.loadProcessingMasks(maskedVer, Instant.MIN, Instant.EPOCH);
    Assertions.assertEquals(2, masks.size());
    Assertions.assertTrue(masks.contains(PROC_MASK_ENTITY));
    Assertions.assertTrue(masks.contains(PROC_MASK_AMB));
  }

  @Test
  void testMultipleMaskedAsInput() {

    // Derived Leaf
    var derivedLeafVer = Channel.createVersionReference("Derived Channel Leaf/beam", Instant.MIN);
    var derivedLeafFull =
        derivedLeafVer.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of(RAW_CHANNEL)).build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(derivedLeafVer.getName()), derivedLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(derivedLeafFull));

    // PROC_MASK_ENTITY Leaf
    var maskedEntityLeafVer =
        Channel.createVersionReference("Masked Channel - Entity/masked", Instant.MIN);
    var maskedEntityLeafFull =
        maskedEntityLeafVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedEntityLeafVer.getName()), maskedEntityLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedEntityLeafFull));
    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedEntityLeafFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_ENTITY));

    // PROC_MASK_AMB Leaf
    var maskedAMBLeafVer =
        Channel.createVersionReference("Masked Channel - AMB/masked", Instant.MIN);
    var maskedAMBLeafFull =
        maskedAMBLeafVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedAMBLeafVer.getName()), maskedAMBLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedAMBLeafFull));
    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedAMBLeafFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_AMB));

    // PROC_MASK_DF Leaf
    var maskedDFLeafVer = Channel.createVersionReference("Masked Channel - DF/masked", Instant.MIN);
    var maskedDFLeafFull =
        maskedDFLeafVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedDFLeafVer.getName()), maskedDFLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedDFLeafFull));
    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedDFLeafFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_DF));

    // PROC_MASK_SDB Leaf
    var maskedSDBLeafVer =
        Channel.createVersionReference("Masked Channel - SDB/masked", Instant.MIN);
    var maskedSDBLeafFull =
        maskedSDBLeafVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedSDBLeafVer.getName()), maskedSDBLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedSDBLeafFull));
    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedSDBLeafFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_SDB));

    // PROC_MASK_SG Leaf
    var maskedSGLeafVer = Channel.createVersionReference("Masked Channel - SG/masked", Instant.MIN);
    var maskedSGLeafFull =
        maskedSGLeafVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(List.of(RAW_CHANNEL))
                    .setProcessingDefinition(FieldMapUtilities.toFieldMap(PROC_MASK_DEF))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(maskedSGLeafVer.getName()), maskedSGLeafVer.getEffectiveAt().get()))
        .thenReturn(List.of(maskedSGLeafFull));
    Mockito.when(
            repository.createForChannelAndTimeRange(
                maskedSGLeafFull, Instant.MIN, Instant.EPOCH, PROC_MASK_DEF))
        .thenReturn(List.of(PROC_MASK_SG));

    // Shallow Node
    var shallowNodeVer = Channel.createVersionReference("Shallow Node/beam", Instant.MIN);
    var shallowNodeFull =
        shallowNodeVer.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of(maskedAMBLeafVer)).build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(shallowNodeVer.getName()), shallowNodeVer.getEffectiveAt().get()))
        .thenReturn(List.of(shallowNodeFull));

    // Deep Node 3
    var deepNode3Ver = Channel.createVersionReference("Deep Node 3/masked", Instant.MIN);
    var deepNode3Full =
        deepNode3Ver.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of(maskedSGLeafVer)).build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(deepNode3Ver.getName()), deepNode3Ver.getEffectiveAt().get()))
        .thenReturn(List.of(deepNode3Full));

    // Deep Node 2
    var deepNode2Ver = Channel.createVersionReference("Deep Node 2/masked/beam", Instant.MIN);
    var deepNode2Full =
        deepNode2Ver.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(
                        List.of(
                            deepNode3Ver,
                            maskedDFLeafVer,
                            maskedSDBLeafVer,
                            derivedLeafVer,
                            RAW_CHANNEL))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(deepNode2Ver.getName()), deepNode2Ver.getEffectiveAt().get()))
        .thenReturn(List.of(deepNode2Full));

    // Deep Node 1
    var deepNode1Ver = Channel.createVersionReference("Deep Node 1/masked", Instant.MIN);
    var deepNode1Full =
        deepNode1Ver.toBuilder()
            .setData(DATA.toBuilder().setConfiguredInputs(List.of(deepNode2Ver)).build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(deepNode1Ver.getName()), deepNode1Ver.getEffectiveAt().get()))
        .thenReturn(List.of(deepNode1Full));

    // Top Node
    var topNodeVer = Channel.createVersionReference("Top Node/beam/masked", Instant.MIN);
    var topNodeFull =
        topNodeVer.toBuilder()
            .setData(
                DATA.toBuilder()
                    .setConfiguredInputs(
                        List.of(
                            RAW_CHANNEL,
                            derivedLeafVer,
                            maskedEntityLeafVer,
                            shallowNodeVer,
                            deepNode2Ver))
                    .build())
            .build();
    Mockito.when(
            accessor.findChannelsByNameAndTime(
                List.of(topNodeVer.getName()), topNodeVer.getEffectiveAt().get()))
        .thenReturn(List.of(topNodeFull));

    var masks = pmlb.loadProcessingMasks(topNodeVer, Instant.MIN, Instant.EPOCH);
    Assertions.assertEquals(5, masks.size());
    Assertions.assertTrue(masks.contains(PROC_MASK_ENTITY));
    Assertions.assertTrue(masks.contains(PROC_MASK_AMB));
    Assertions.assertTrue(masks.contains(PROC_MASK_DF));
    Assertions.assertTrue(masks.contains(PROC_MASK_SDB));
    Assertions.assertTrue(masks.contains(PROC_MASK_SG));
  }
}
