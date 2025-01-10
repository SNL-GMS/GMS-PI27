package gms.shared.stationdefinition.converter;

import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHAN_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.VERSION_RANGE_STR;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelNameUtilities;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverterTransform;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.bridge.database.converter.PositiveNaInstantToDoubleConverter;
import java.time.Instant;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DaoChannelConverter implements ChannelConverter {

  private final DaoCalibrationConverter calibrationConverter;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;

  @Autowired
  public DaoChannelConverter(
      DaoCalibrationConverter calibrationConverter,
      StationDefinitionIdUtility stationDefinitionIdUtility) {
    this.calibrationConverter = calibrationConverter;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
  }

  @Override
  public Channel convert(
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      SensorDao sensorDao,
      InstrumentDao instrumentDao,
      WfdiscDao wfdiscDao,
      Range<Instant> versionRange,
      ResponseConverterTransform responseConverterTransform) {

    Preconditions.checkNotNull(responseConverterTransform);
    var stationName = siteDao.getReferenceStation();
    var response =
        getResponse(sensorDao, wfdiscDao, instrumentDao, responseConverterTransform, stationName);

    var station = Station.createVersionReference(stationName, siteDao.getId().getOnDate());

    return convertWithStation(
        siteChanDao, siteDao, instrumentDao, wfdiscDao, versionRange, response, station);
  }

  @Override
  public Channel convert(
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      InstrumentDao instrumentDao,
      WfdiscDao wfdiscDao,
      Range<Instant> versionRange,
      Response response) {

    var stationName = siteDao.getReferenceStation();
    var station = Station.createEntityReference(stationName);

    return convertWithStation(
        siteChanDao, siteDao, instrumentDao, wfdiscDao, versionRange, response, station);
  }

  public Channel convertWithStation(
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      InstrumentDao instrumentDao,
      WfdiscDao wfdiscDao,
      Range<Instant> versionRange,
      Response response,
      Station station) {

    Preconditions.checkNotNull(versionRange, "Version range cannot be null.");
    Preconditions.checkNotNull(
        siteChanDao, SITE_CHAN_MUST_NOT_BE_NULL + VERSION_RANGE_STR, versionRange);
    Preconditions.checkNotNull(siteDao, SITE_MUST_NOT_BE_NULL + VERSION_RANGE_STR, versionRange);

    Preconditions.checkState(
        instrumentDao != null || wfdiscDao != null,
        ConverterWarnings.INSTRUMENT_WFDISC_MUST_NOT_BE_NULL + VERSION_RANGE_STR,
        versionRange);

    Optional<ChannelTypes> channelTypesOptional =
        ChannelTypesParser.parseChannelTypes(siteChanDao.getId().getChannelCode());

    String siteName = siteChanDao.getId().getStationCode();

    Preconditions.checkState(
        channelTypesOptional.isPresent(),
        ConverterWarnings.COULD_NOT_PARSE_CHANNEL_TYPES_FOR_SITE_CHAN_DAO + " %s.%s",
        siteChanDao.getId().getStationCode(),
        siteChanDao.getId().getChannelCode());

    var channelTypes = channelTypesOptional.get();

    // could make instrumentDao optional
    double sampleRate =
        instrumentDao != null ? instrumentDao.getSampleRate() : wfdiscDao.getSampRate();

    var location =
        Location.from(
            siteDao.getLatitude(),
            siteDao.getLongitude(),
            siteChanDao.getEmplacementDepth(),
            siteDao.getElevation());

    var orientation =
        Orientation.from(
            Optional.of(siteChanDao.getHorizontalAngle()),
            Optional.of(siteChanDao.getVerticalAngle()));

    String name =
        ChannelNameUtilities.createShortName(
            siteDao.getReferenceStation(),
            siteDao.getId().getStationCode(),
            siteChanDao.getId().getChannelCode());

    Instant effectiveUntil = versionRange.upperEndpoint();
    if (effectiveUntil.equals(PositiveNaInstantToDoubleConverter.NA_TIME)) {
      effectiveUntil = null;
    }

    EnumMap<ChannelProcessingMetadataType, Object> channelProcessingMetadataMap =
        new EnumMap<>(ChannelProcessingMetadataType.class);
    channelProcessingMetadataMap.put(ChannelProcessingMetadataType.CHANNEL_GROUP, siteName);
    HashMap<String, Object> processingDefinitionMap = new HashMap<>();

    Optional<Response> responseOptional = Optional.ofNullable(response);

    var channelData =
        Channel.Data.builder()
            .setCanonicalName(name)
            .setEffectiveUntil(effectiveUntil)
            .setDescription(siteChanDao.getChannelDescription())
            .setStation(station)
            .setChannelDataType(channelTypes.getDataType())
            .setChannelBandType(channelTypes.getBandType())
            .setChannelInstrumentType(channelTypes.getInstrumentType())
            .setChannelOrientationType(channelTypes.getOrientationType())
            .setChannelOrientationCode(channelTypes.getOrientationCode())
            .setUnits(Units.determineUnits(channelTypes.getDataType()))
            .setNominalSampleRateHz(sampleRate)
            .setLocation(location)
            .setOrientationAngles(orientation)
            .setConfiguredInputs(List.of())
            .setProcessingDefinition(processingDefinitionMap)
            .setProcessingMetadata(channelProcessingMetadataMap)
            .setResponse(responseOptional)
            .build();

    Channel unnamed =
        Channel.builder()
            .setName("[PLACEHOLDER]")
            .setEffectiveAt(versionRange.lowerEndpoint())
            .setData(channelData)
            .build();

    return unnamed.toBuilder()
        .setName(name)
        .setData(channelData.toBuilder().setCanonicalName(name).build())
        .build();
  }

  private static Optional<Channel> buildChannelData(
      Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
      HashMap<String, Object> processingDefinitionMap,
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      Optional<Response> response,
      String description,
      double sampleRate) {

    Optional<ChannelTypes> channelTypesOptional =
        ChannelTypesParser.parseChannelTypes(siteChanDao.getId().getChannelCode());

    String stationName = siteDao.getReferenceStation();

    Preconditions.checkState(
        channelTypesOptional.isPresent(),
        ConverterWarnings.COULD_NOT_PARSE_CHANNEL_TYPES_FOR_SITE_CHAN_DAO + " %s.%s",
        siteChanDao.getId().getStationCode(),
        siteChanDao.getId().getChannelCode());

    var channelTypes = channelTypesOptional.get();

    var location =
        Location.from(
            siteDao.getLatitude(),
            siteDao.getLongitude(),
            siteChanDao.getEmplacementDepth(),
            siteDao.getElevation());

    var orientation =
        Orientation.from(
            Optional.of(siteChanDao.getHorizontalAngle()),
            Optional.of(siteChanDao.getVerticalAngle()));

    String name =
        ChannelNameUtilities.createShortName(
            siteDao.getReferenceStation(),
            siteDao.getId().getStationCode(),
            siteChanDao.getId().getChannelCode());
    Instant effectiveUntil = siteChanDao.getOffDate();
    if (effectiveUntil.equals(PositiveNaInstantToDoubleConverter.NA_TIME)) {
      effectiveUntil = null;
    }
    var channelData =
        Channel.Data.builder()
            .setCanonicalName(name)
            .setEffectiveUntil(effectiveUntil)
            .setDescription(description)
            .setStation(Station.createVersionReference(stationName, siteDao.getId().getOnDate()))
            .setChannelDataType(channelTypes.getDataType())
            .setChannelBandType(channelTypes.getBandType())
            .setChannelInstrumentType(channelTypes.getInstrumentType())
            .setChannelOrientationType(channelTypes.getOrientationType())
            .setChannelOrientationCode(channelTypes.getOrientationCode())
            .setUnits(Units.determineUnits(channelTypes.getDataType()))
            .setNominalSampleRateHz(sampleRate)
            .setLocation(location)
            .setOrientationAngles(orientation)
            .setConfiguredInputs(List.of())
            .setProcessingDefinition(processingDefinitionMap)
            .setProcessingMetadata(processingMetadataMap)
            .setResponse(response)
            .build();

    Channel unnamed =
        Channel.builder()
            .setName("[PLACEHOLDER]")
            .setEffectiveAt(siteChanDao.getId().getOnDate())
            .setData(channelData)
            .build();

    return Optional.of(
        unnamed.toBuilder()
            .setName(name)
            .setData(channelData.toBuilder().setCanonicalName(name).build())
            .build());
  }

  private static Channel convertToDerived(
      Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
      HashMap<String, Object> processingDefinitionMap,
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      Pair<Instant, Instant> channelEffectiveTimes,
      String description,
      WfdiscDao wfdiscDao) {

    return buildChannelData(
            processingMetadataMap,
            processingDefinitionMap,
            siteChanDao,
            siteDao,
            Optional.empty(),
            description,
            wfdiscDao.getSampRate())
        .map(
            (Channel channel) -> {
              var channelData = channel.getData().orElseThrow();
              return channel.toBuilder()
                  .setEffectiveAt(channelEffectiveTimes.getLeft())
                  .setData(
                      channelData.toBuilder()
                          .setEffectiveUntil(channelEffectiveTimes.getRight())
                          .build())
                  .build();
            })
        .orElseThrow();
  }

  @Override
  public Channel convertToBeamDerived(
      SiteDao siteDao,
      SiteChanDao siteChanDao,
      WfdiscDao wfdiscDao,
      Instant channelEffectiveTime,
      Instant channelEndTime,
      Optional<BeamDao> beamDao,
      Map<ChannelProcessingMetadataType, Object> processingMetadataMap) {

    Preconditions.checkNotNull(channelEffectiveTime, "Channel effective time must not be null.");
    Preconditions.checkNotNull(channelEndTime, "Channel end time must not be null.");
    Preconditions.checkNotNull(
        siteChanDao,
        String.format(SITE_CHAN_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime));
    Preconditions.checkNotNull(
        siteDao, String.format(SITE_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime));
    Preconditions.checkNotNull(
        wfdiscDao,
        String.format("Wfdisc cannot be null." + EFFECTIVE_TIME_STR, channelEffectiveTime));
    Preconditions.checkNotNull(
        beamDao, String.format("Beam cannot be null." + EFFECTIVE_TIME_STR, channelEffectiveTime));

    Preconditions.checkState(
        channelEffectiveTime.isBefore(channelEndTime),
        ConverterWarnings.CHANNEL_START_END_TIME_STR,
        channelEffectiveTime,
        channelEndTime);

    HashMap<String, Object> processingDefinitionMap = new HashMap<>();

    beamDao.ifPresent(
        (BeamDao beam) -> {
          processingMetadataMap.put(
              ChannelProcessingMetadataType.BEAM_SUMMATION, siteChanDao.getChannelType());
          processingMetadataMap.put(
              ChannelProcessingMetadataType.STEERING_BACK_AZIMUTH, beam.getAzimuth());
          processingMetadataMap.put(
              ChannelProcessingMetadataType.STEERING_SLOWNESS, beam.getSlowness());
          processingMetadataMap.put(ChannelProcessingMetadataType.CHANNEL_GROUP, "beam");
          processingDefinitionMap.put(
              ChannelProcessingMetadataType.BEAM_SUMMATION.name(), siteChanDao.getChannelType());
          processingDefinitionMap.put(
              ChannelProcessingMetadataType.STEERING_BACK_AZIMUTH.name(), beam.getAzimuth());
          processingDefinitionMap.put(
              ChannelProcessingMetadataType.STEERING_SLOWNESS.name(), beam.getSlowness());
        });

    var channel =
        convertToDerived(
            processingMetadataMap,
            processingDefinitionMap,
            siteChanDao,
            siteDao,
            Pair.of(channelEffectiveTime, channelEndTime),
            beamDao.map(BeamDao::getDescription).orElseGet(siteChanDao::getChannelDescription),
            wfdiscDao);

    String name = ChannelNameUtilities.createName(channel);
    var data = channel.getData().orElseThrow();
    return channel.toBuilder()
        .setName(name)
        .setData(data.toBuilder().setCanonicalName(name).build())
        .build();
  }

  /**
   * Converts the SiteChan and Site objects to a {@link Channel} coi version reference
   *
   * @param siteDao the corresponding site of the channel
   * @param siteChanDao the SiteChan that represents the channels characteristics
   * @return Channel coi version reference object
   */
  @Override
  public Channel convertToVersionReference(SiteDao siteDao, SiteChanDao siteChanDao) {
    Preconditions.checkNotNull(siteDao, SITE_MUST_NOT_BE_NULL);
    Preconditions.checkNotNull(
        siteChanDao, SITE_CHAN_MUST_NOT_BE_NULL + " For site %s", siteDao.getId().getStationCode());

    final String channelName =
        ChannelNameUtilities.createShortName(
            siteDao.getReferenceStation(),
            siteDao.getId().getStationCode(),
            siteChanDao.getId().getChannelCode());
    return Channel.createVersionReference(channelName, siteChanDao.getId().getOnDate());
  }

  @Override
  public Channel convertToEntityReference(SiteDao siteDao, SiteChanDao siteChanDao) {
    return Channel.createEntityReference(
        ChannelNameUtilities.createShortName(
            siteDao.getReferenceStation(),
            siteDao.getId().getStationCode(),
            siteChanDao.getId().getChannelCode()));
  }

  private Response getResponse(
      SensorDao sensorDao,
      WfdiscDao wfdiscDao,
      InstrumentDao instrumentDao,
      ResponseConverterTransform responseConverterTransform,
      String stationName) {
    if (instrumentDao == null || wfdiscDao == null || sensorDao == null) {
      return null;
    } else {
      var calibration = calibrationConverter.convert(wfdiscDao, sensorDao);

      var stationCode = wfdiscDao.getStationCode();
      var channelCode = wfdiscDao.getChannelCode();
      var instrumentId = instrumentDao.getInstrumentId();
      var fapUuid =
          stationDefinitionIdUtility.storeInstrumentIdFrequencyAmplitudePhaseMapping(
              stationName
                  + Channel.NAME_SEPARATOR
                  + stationCode
                  + Channel.NAME_SEPARATOR
                  + channelCode,
              instrumentId);
      var frequencyAmplitudePhase = FrequencyAmplitudePhase.createEntityReference(fapUuid);

      return responseConverterTransform.getResponse(
          wfdiscDao, sensorDao, calibration, frequencyAmplitudePhase);
    }
  }
}
