package gms.shared.waveform.testfixture;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategoryAndType;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.coi.qc.TaperDefinition;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Holds constants and generators for unit testing */
public final class ProcessingMaskTestFixtures {

  public static final TaperDefinition TAPER_DEFINITION =
      new TaperDefinition(4, TaperFunction.BLACKMAN);

  public static final ProcessingMaskDefinition PROC_MASK_DEF_ROT =
      new ProcessingMaskDefinition(
          Duration.ofSeconds(1),
          ProcessingOperation.ROTATION,
          Set.of(
              QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY),
              QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
          TAPER_DEFINITION);

  public static final ProcessingMaskDefinition PROC_MASK_DEF_ROT_FLAT =
      new ProcessingMaskDefinition(
          Duration.ofSeconds(1),
          ProcessingOperation.ROTATION,
          Set.of(
              QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.FLAT),
              QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
          TAPER_DEFINITION);

  public static final ProcessingMaskDefinition PROC_MASK_DEF_ANALYST =
      new ProcessingMaskDefinition(
          Duration.ofSeconds(1),
          ProcessingOperation.ROTATION,
          Set.of(
              QcSegmentCategoryAndType.create(
                  QcSegmentCategory.ANALYST_DEFINED, QcSegmentType.FLAT),
              QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
          TAPER_DEFINITION);

  public static final ProcessingMaskDefinition PROC_MASK_DEF_WAVEFORM_SPIKE =
      new ProcessingMaskDefinition(
          Duration.ofSeconds(1),
          ProcessingOperation.ROTATION,
          Set.of(QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE)),
          TAPER_DEFINITION);

  public static final FacetingDefinition PROCESSING_MASK_FACET_ID_ONLY =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.PROCESSING_MASK_TYPE.getValue())
          .setPopulated(false)
          .build();

  public static final FacetingDefinition PROCESSING_MASK_FACET_DEFAULT =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.PROCESSING_MASK_TYPE.getValue())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.APPLIED_TO_RAW_CHANNEL.getValue(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                  .setPopulated(false)
                  .build())
          .addFacetingDefinitions(
              FacetingTypes.MASKED_QC_SEGMENT_VERSION_KEY.getValue(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
                  .setPopulated(false)
                  .build())
          .build();

  public static final FacetingDefinition PROCESSING_MASK_FACET__CHANNEL_POPULATED =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.PROCESSING_MASK_TYPE.getValue())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.APPLIED_TO_RAW_CHANNEL.getValue(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
                  .setPopulated(true)
                  .build())
          .build();

  public static final FacetingDefinition PROCESSING_MASK_FACET__QCSEGVERS_POPULATED =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.PROCESSING_MASK_TYPE.getValue())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.MASKED_QC_SEGMENT_VERSION_KEY.getValue(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.QC_SEGMENT_VERSION_TYPE.getValue())
                  .setPopulated(true)
                  .build())
          .build();

  private ProcessingMaskTestFixtures() {
    // private default constructor to hide implicit public one.
  }

  /**
   * Generates a {@link ProcessingMask} for unit tests. The effectiveAt, startTime, and endTime are
   * set to the current time. The QcSegmentVersion starts at Instant.MIN, has a duration of 1
   * second, is assigned a random parent UUID, and is WAVEFORM/FLAT.
   *
   * @param processingOperation the {@link ProcessingOperation} for the {@link ProcessingMask}
   * @param channels a list of {@link Channel}s for the {@link ProcessingMask}
   * @param channelSegments a list of {@link ChannelSegment}s for the {@link ProcessingMask}
   * @return a {@link ProcessingMask} with the specified characteristics
   */
  public static ProcessingMask getProcessingMask(
      ProcessingOperation processingOperation,
      List<Channel> channels,
      List<ChannelSegment<?>> channelSegments) {
    var currTime = Instant.now();

    var qcSegmentVersionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(UUID.randomUUID())
            .build();

    var qcSegmentVersionOne =
        QcSegmentVersion.instanceBuilder()
            .setId(qcSegmentVersionId)
            .setData(
                QcSegmentVersion.Data.instanceBuilder()
                    .setStageId(WorkflowDefinitionId.from("My Workflow"))
                    .setChannels(channels)
                    .setDiscoveredOn(channelSegments)
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
            .setProcessingOperation(processingOperation)
            .setAppliedToRawChannel(channels.get(0).toEntityReference())
            .setMaskedQcSegmentVersions(List.of(qcSegmentVersionOne));

    var idArray =
        Arrays.toString(Long.toString(404).getBytes())
            + Arrays.toString(Long.toString(0).getBytes())
            + processingOperation
            + channels.get(0).getName();
    var uuid = UUID.nameUUIDFromBytes(idArray.getBytes());

    return ProcessingMask.instanceBuilder().setId(uuid).setData(pmData.build()).build();
  }
}
