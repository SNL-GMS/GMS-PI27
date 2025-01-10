package gms.shared.waveform.bridge.repository;

import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Preconditions.checkState;

import gms.shared.processingmask.utility.WaveformMaskingUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.waveform.bridge.repository.utils.BridgedProcessingMaskCache;
import gms.shared.waveform.processingmask.api.ProcessingMaskRepository;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentRepository;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/** A {@link ProcessingMaskRepository} implementation using the GMS bridged design structure */
@Component
public class BridgedProcessingMaskRepository implements ProcessingMaskRepository {

  private static final String QC_DATA_MISSING_MSG = "QcSegmentVersionId effectiveAt missing";

  private final BridgedProcessingMaskCache bridgedProcessingMaskCache;
  private final QcSegmentRepository qcSegmentRepositoryInterface;

  @Autowired
  public BridgedProcessingMaskRepository(
      BridgedProcessingMaskCache bridgedProcessingMaskCache,
      @Qualifier("bridgedQcSegmentRepository") QcSegmentRepository qcSegmentRepositoryInterface) {
    this.bridgedProcessingMaskCache = bridgedProcessingMaskCache;
    this.qcSegmentRepositoryInterface = qcSegmentRepositoryInterface;
  }

  @Override
  public Collection<ProcessingMask> findProcessingMasksByIds(Collection<UUID> idList) {

    checkNotNull(idList, "Input ID list must not be null");

    return idList.stream()
        .map(bridgedProcessingMaskCache::findById)
        .flatMap(Optional::stream)
        .toList();
  }

  /**
   * Creates bridged {@link ProcessingMask} objects masking the provided raw {@link Channel} within
   * the provided time range (startTime and endTime both inclusive)
   *
   * @param channel Associated {@link Channel}
   * @param startTime Beginning of the time range
   * @param endTime End of the time range
   * @param pmDefinition {@link ProcessingMaskDefinition} identifying the configuration to the
   *     {@link ProcessingMask} elements
   * @return List of {@link ProcessingMask} objects
   */
  public Collection<ProcessingMask> createForChannelAndTimeRange(
      Channel channel, Instant startTime, Instant endTime, ProcessingMaskDefinition pmDefinition) {

    checkNotNull(channel, "Input Channel must not be null");
    checkNotNull(startTime, "Input Start Time must not be null");
    checkNotNull(endTime, "Input End Time must not be null");
    checkNotNull(pmDefinition, "Input ProcessingMaskDefinition must not be null");

    checkState(
        !Channel.isDerivedChannel(channel),
        "Derived input channel discovered.  Must be a raw channel");

    var channelQcSegments =
        qcSegmentRepositoryInterface
            .findQcSegmentsByChannelsAndTimeRange(List.of(channel), startTime, endTime)
            .stream()
            .map(mapper -> mapper.getData().get().getVersionHistory().last())
            .collect(Collectors.toSet());
    var masks =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            channelQcSegments, pmDefinition);
    masks =
        masks.stream().map(item -> updateEffectiveAt(item)).collect(Collectors.toUnmodifiableSet());
    bridgedProcessingMaskCache.cache(masks);
    return masks;
  }

  private static ProcessingMask updateEffectiveAt(ProcessingMask item) {

    checkNotNull(item, "ProcessingMask must not be null");
    checkState(item.getData().isPresent(), "ProcessingMask Data must not be empty");

    var dataOptional = item.getData();
    if (dataOptional.isPresent()) {

      var localQcVersionsList = dataOptional.get().getMaskedQcSegmentVersions();
      var dataBuilder = dataOptional.get().toBuilder();
      var maskBuilder = item.toBuilder();

      var effectiveAtEnd =
          localQcVersionsList.stream()
              .map(QcSegmentVersion::getId)
              .map(QcSegmentVersionId::getEffectiveAt)
              .max(Instant::compareTo)
              .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

      var data = dataBuilder.setEffectiveAt(effectiveAtEnd).build();

      return maskBuilder.setData(data).build();
    } else {
      throw new IllegalStateException("Unable to update ProcessingMask with empty data field");
    }
  }
}
