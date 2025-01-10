package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.bridge.repository.utils.CannedQcUtility;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.io.IOException;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

public class CannedProcessingMaskLoader implements ProcessingMaskLoader {

  private static final Logger LOGGER = LoggerFactory.getLogger(CannedProcessingMaskLoader.class);

  @Value("${gms-canned-processing-mask:MULTIPLE}")
  private String cannedProcessingMaskConfig;

  private final Set<String> seenStations = new HashSet<>();

  public String getCannedProcessingMaskConfig() {

    return cannedProcessingMaskConfig;
  }

  @Override
  public List<ProcessingMask> loadProcessingMasks(
      Channel channel, Instant startTime, Instant dummyEndTime) {

    LOGGER.debug(
        "Loading processing masks for channel:{} startTime:{}", channel.getName(), startTime);

    // String.split uses a regular expresion. It just so happnes that as of this
    // writing, Channel.NAME_SEPERATOR is ".", which would need to be escaped.
    var channelName = channel.getName();
    var station = getStationNameFromChannelName(channelName);

    if (seenStations.contains(station)) {
      return List.of();
    }

    seenStations.add(station);

    return loadCannedData(startTime).stream()
        .filter(
            mask ->
                getStationNameFromChannelName(
                        mask.getData().get().getAppliedToRawChannel().getName())
                    .equals(station))
        .findFirst()
        .map(List::of)
        .orElse(List.of());
  }

  private List<ProcessingMask> loadCannedData(Instant startTime) {
    try {
      var cannedQcData = CannedQcUtility.readCannedQcData();
      var cannedPMData = CannedQcUtility.readCannedPMData(cannedProcessingMaskConfig);

      return new PmDataGenerator()
          .createProcessingMasks(cannedPMData.getPmList(), cannedQcData.getQcList(), startTime);
    } catch (IOException ex) {
      throw new LoadCannedDataRuntimeException(ex);
    }
  }

  private static class LoadCannedDataRuntimeException extends RuntimeException {
    public LoadCannedDataRuntimeException(IOException ex) {}
  }

  private static String getStationNameFromChannelName(String channelName) {
    return channelName.substring(0, channelName.indexOf(Channel.NAME_SEPARATOR));
  }
}
