package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.accessor.DefaultStationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.utils.FieldMapUtilities;
import gms.shared.waveform.processingmask.api.ProcessingMaskRepository;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

/** Implements the logic for loading real processing masks. */
public class BridgedProcessingMaskLoader implements ProcessingMaskLoader {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedProcessingMaskLoader.class);

  private static final String MASKED = Channel.COMPONENT_SEPARATOR + "masked";

  private final DefaultStationDefinitionAccessor accessor;
  private final BridgedProcessingMaskRepository repository;

  @Autowired
  public BridgedProcessingMaskLoader(
      DefaultStationDefinitionAccessor accessor, BridgedProcessingMaskRepository repository) {
    this.accessor = accessor;
    this.repository = repository;
  }

  /**
   * Creates a list of {@link ProcessingMask}s used in a {@link Channel} in a given time window
   * based on the data in the {@link ProcessingMaskRepository}.
   *
   * @param channel the {@link Channel} in which the {@link ProcessingMask}s are used
   * @param startTime the start of the time window
   * @param endTime the end of the time window
   * @return a list of the {@link ProcessingMask}s used in the input {@link Channel} during the
   *     requested time window
   * @throws IllegalStateException if the input channel is an entity reference, if a masked channel
   *     does not have a processing mask definition, or a derived channel does not have any
   *     configured input channels
   */
  @Override
  public List<ProcessingMask> loadProcessingMasks(
      Channel channel, Instant startTime, Instant endTime) {
    return flattenChannelToProcessingMasks(channel, startTime, endTime);
  }

  private List<ProcessingMask> flattenChannelToProcessingMasks(
      Channel channel, Instant startTime, Instant endTime) {

    // Populate the input channel
    var populatedInputChannel =
        accessor
            .findChannelsByNameAndTime(
                List.of(channel.getName()),
                channel
                    .getEffectiveAt()
                    .orElseThrow(
                        () -> {
                          LOGGER.error(
                              "Channel must be a version reference or fully populated Channel.");
                          return new IllegalStateException();
                        }))
            .get(0);

    var masks = new ArrayList<ProcessingMask>();

    // Skip raw channels
    if (!Channel.isDerivedChannel(populatedInputChannel)) {
      return masks;
    }

    // Return the masks for masked channels
    if (isMasked(populatedInputChannel)) {
      ProcessingMaskDefinition processingMaskDefinition;

      try {
        processingMaskDefinition =
            FieldMapUtilities.fromFieldMap(
                populatedInputChannel.getProcessingDefinition(), ProcessingMaskDefinition.class);
      } catch (IllegalArgumentException e) {
        throw new IllegalStateException(
            "Masked channel does not have a processing mask definition", e);
      }

      masks.addAll(
          repository.createForChannelAndTimeRange(
              populatedInputChannel, startTime, endTime, processingMaskDefinition));

      return masks;
    }

    // Otherwise keep looking for masked channels
    populatedInputChannel
        .getConfiguredInputs()
        .forEach(
            (Channel configInputChannel) ->
                masks.addAll(
                    flattenChannelToProcessingMasks(configInputChannel, startTime, endTime)));

    return masks;
  }

  private static boolean isMasked(Channel channel) {
    if (!channel.getName().contains(MASKED)) {
      return false;
    }

    if (channel.getConfiguredInputs().isEmpty()) {
      throw new IllegalStateException("Derived channel has no configured input channels");
    }

    if (channel.getConfiguredInputs().size() != 1) {
      return false;
    }

    // Masked channels will have a raw configured input channel
    return !Channel.isDerivedChannel(channel.getConfiguredInputs().get(0));
  }
}
