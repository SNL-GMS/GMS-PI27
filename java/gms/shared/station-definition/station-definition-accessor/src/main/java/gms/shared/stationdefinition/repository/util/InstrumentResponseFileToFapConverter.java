package gms.shared.stationdefinition.repository.util;

import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Converts the data in an Instrument Response File into a {@link FrequencyAmplitudePhase} */
public final class InstrumentResponseFileToFapConverter {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(InstrumentResponseFileToFapConverter.class);

  private InstrumentResponseFileToFapConverter() {
    // Utility class
  }

  /**
   * Constructs a {@link FrequencyAmplitudePhase} based on the data stored in an instrument response
   * data file
   *
   * @param dao the {@link InstrumentDao} containing the necessary information to construct the
   *     {@link FrequencyAmplitudePhase} (namely the sample rate, calibration period, calibration
   *     factor, and name of the instrument response file)
   * @param fapDef the {@link FrequencyAmplitudePhaseDefinition} containing the data used to
   *     construct the list of frequencies stored in the {@link FrequencyAmplitudePhase}
   * @param id the UUID for the {@link FrequencyAmplitudePhase}
   * @param channelDataType the {@link ChannelDataType} of the instrument's {@link Channel}, used to
   *     set the units of the response amplitude
   * @return an entity reference {@link FrequencyAmplitudePhase} if an error occurs during the
   *     conversion; a fully populated {@link FrequencyAmplitudePhase} otherwise
   */
  public static FrequencyAmplitudePhase convertFileToFrequencyAmplitudePhase(
      InstrumentDao dao,
      FrequencyAmplitudePhaseDefinition fapDef,
      UUID id,
      ChannelDataType channelDataType) {

    String fileName;
    if (dao.getDirectory().endsWith(File.separator)) {
      fileName = dao.getDirectory() + dao.getDataFile();
    } else {
      fileName = dao.getDirectory() + File.separator + dao.getDataFile();
    }

    Collection<InstrumentResponseDataBlock> dataBlocks;
    try {
      dataBlocks = InstrumentResponseDataReader.parseFile(fileName);
    } catch (IOException e) {
      LOGGER.warn("Instrument response file '{}' could not be read: {}", fileName, e.getMessage());
      return FrequencyAmplitudePhase.createEntityReference(id);
    }

    var sampleRate = dao.getSampleRate();
    var calFreq = 1.0 / dao.getNominalCalibrationPeriod();
    var freqList =
        FrequencyAmplitudePhaseUtility.generateFrequencyList(fapDef, sampleRate, calFreq);

    var responses =
        dataBlocks.stream()
            .map(
                (InstrumentResponseDataBlock datablock) -> {
                  try {
                    return datablock
                        .getFormat()
                        .getBlockParser()
                        .parseBlock(datablock.getBlock(), freqList);
                  } catch (IllegalArgumentException e) {
                    LOGGER.info(
                        "InstrumentResponseDatablock with first line '{}' could not be parsed: {}",
                        datablock.getBlock()[0],
                        e.getMessage());
                    return null;
                  }
                })
            .filter(Objects::nonNull)
            .toList();

    if (responses.isEmpty()) {
      LOGGER.warn("Instrument response file '{}' contained no parseable data blocks.", fileName);
      return FrequencyAmplitudePhase.createEntityReference(id);
    }

    FrequencyAmplitudePhase result;
    try {
      result =
          FrequencyAmplitudePhaseUtility.constructFrequencyAmplitudePhase(
              FrequencyAmplitudePhaseUtility.consolidateDataBlocks(responses),
              dao.getNominalCalibrationFactor(),
              dao.getNominalCalibrationPeriod(),
              sampleRate,
              id,
              channelDataType);
    } catch (IllegalStateException e) {
      LOGGER.warn("FrequencyAmplitudePhase object could not be created: {}", e.getMessage());
      result = FrequencyAmplitudePhase.createEntityReference(id);
    }

    return result;
  }
}
