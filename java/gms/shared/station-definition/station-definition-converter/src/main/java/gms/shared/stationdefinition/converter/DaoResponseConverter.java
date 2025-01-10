package gms.shared.stationdefinition.converter;

import static gms.shared.stationdefinition.converter.ConverterWarnings.WFDISC_NOT_NULL;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.channel.Response.Data;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.bridge.database.converter.PositiveNaInstantToDoubleConverter;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class DaoResponseConverter implements ResponseConverter {

  /**
   * Converts the WfdiscDao, to an entity reference {@link Response} object.
   *
   * @param wfdiscDao object
   * @return A Response object containing the information passed in through wfDiscDAO and FAP.
   */
  public Response convertToEntity(WfdiscDao wfdiscDao) {
    Preconditions.checkNotNull(wfdiscDao, WFDISC_NOT_NULL);

    String id = wfdiscDao.getStationCode() + wfdiscDao.getChannelCode();
    return Response.createEntityReference(UUID.nameUUIDFromBytes(id.getBytes()));
  }

  /**
   * Converts the WfdiscDao, Calibrationobjects, to a {@link Response} object.
   *
   * @param wfdiscDao object
   * @param calibration object
   * @param frequencyAmplitudePhase object
   * @return A Response object containing the information passed in through wfDiscDAO and FAP.
   */
  public Response convert(
      WfdiscDao wfdiscDao,
      SensorDao sensorDao,
      Calibration calibration,
      FrequencyAmplitudePhase frequencyAmplitudePhase) {

    Preconditions.checkNotNull(wfdiscDao, WFDISC_NOT_NULL);
    Preconditions.checkNotNull(
        sensorDao,
        "SensorDao cannot be null for wfdisc dao %s.%s",
        wfdiscDao.getStationCode(),
        wfdiscDao.getChannelCode());
    Preconditions.checkNotNull(
        calibration,
        "Calibration cannot be null for wfdisc dao %s.%s",
        wfdiscDao.getStationCode(),
        wfdiscDao.getChannelCode());
    Preconditions.checkNotNull(
        frequencyAmplitudePhase,
        "FrequencyAmplitudePhase cannot be null for " + "wfdisc dao %s.%s",
        wfdiscDao.getStationCode(),
        wfdiscDao.getChannelCode());

    String id = wfdiscDao.getStationCode() + wfdiscDao.getChannelCode();

    // both wfdiscDao and sensorDao contain version attributes that could trigger a new version.
    // therfore, whichever one has changed versions earlier (denoted by endTime) will set the
    // response effectiveUntil time
    Instant newEndDate =
        (wfdiscDao.getEndTime().isAfter(sensorDao.getSensorKey().getEndTime()))
            ? sensorDao.getSensorKey().getEndTime()
            : wfdiscDao.getEndTime();

    // this should be done in the jpa converter, but there are side effects of setting it to null,
    // needs to be set to Optional.empty()
    if (newEndDate.equals(PositiveNaInstantToDoubleConverter.NA_TIME)) {
      newEndDate = null;
    }

    return Response.builder()
        .setData(
            Data.builder()
                .setFapResponse(frequencyAmplitudePhase)
                .setCalibration(calibration)
                .setEffectiveUntil(newEndDate)
                .build())
        .setId(UUID.nameUUIDFromBytes(id.getBytes()))
        .setEffectiveAt(wfdiscDao.getTime())
        .build();
  }
}
