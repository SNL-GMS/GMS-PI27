package gms.shared.stationdefinition.converter;

import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNEL_FUNC_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_AT_UNTIL_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_UNTIL_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHANS_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHANS_NOT_EMPTY;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_MUST_NOT_BE_NULL;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteDao;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.function.UnaryOperator;
import org.springframework.stereotype.Component;

@Component
public class DaoChannelGroupConverter implements ChannelGroupConverter {

  private static final int INTERMEDIARY_SCALE = 10;
  private static final int FINAL_SCALE = 4;

  public static Location getLocation(SiteDao siteDao, Collection<SiteChanDao> siteChanDaos) {
    OptionalDouble possibleChannelGroupAverageDepth =
        siteChanDaos.stream().mapToDouble(SiteChanDao::getEmplacementDepth).average();

    double channelGroupAverageDepth = possibleChannelGroupAverageDepth.orElse(0);
    var roundedChannelGroupAverageDepth =
        BigDecimal.valueOf(channelGroupAverageDepth)
            .setScale(INTERMEDIARY_SCALE, RoundingMode.HALF_UP)
            .setScale(FINAL_SCALE, RoundingMode.HALF_UP)
            .doubleValue();

    return Location.from(
        siteDao.getLatitude(),
        siteDao.getLongitude(),
        roundedChannelGroupAverageDepth,
        siteDao.getElevation());
  }

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link
   * ChannelGroup}. {@link Channel}s in the {@link ChannelGroup} will be version references NOTE:
   * The depth is currently ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the provided CSS data
   */
  @Override
  public ChannelGroup convert(
      SiteDao siteDao,
      Collection<SiteChanDao> siteChanDaos,
      UnaryOperator<Channel> channelFunction,
      Instant effectiveAt,
      Instant effectiveUntil,
      Collection<Channel> channels) {

    Preconditions.checkNotNull(effectiveAt, EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(effectiveUntil, EFFECTIVE_UNTIL_NOT_NULL);
    Preconditions.checkNotNull(siteDao, SITE_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(
        siteChanDaos, SITE_CHANS_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(
        channelFunction, CHANNEL_FUNC_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);

    Preconditions.checkState(
        effectiveAt.isBefore(effectiveUntil),
        EFFECTIVE_AT_UNTIL_TIME_STR,
        effectiveAt,
        effectiveUntil);
    Preconditions.checkState(
        !siteChanDaos.isEmpty(), SITE_CHANS_NOT_EMPTY + EFFECTIVE_TIME_STR, effectiveAt);

    return getChannelGroup(
        siteDao, siteChanDaos, channels, effectiveAt, effectiveUntil, channelFunction);
  }

  private static ChannelGroup getChannelGroup(
      SiteDao siteDao,
      Collection<SiteChanDao> siteChanDaos,
      Collection<Channel> channels,
      Instant effectiveAt,
      Instant effectiveUntil,
      UnaryOperator<Channel> channelFunction) {
    Instant newEndDate = effectiveUntil;
    // this should be done in the jpa converter, but there are side effects of setting it to null,
    // needs to be set to Optional.empty()
    if (newEndDate.equals(Instant.MAX)) {
      newEndDate = null;
    }

    if (channelFunction != null) {
      channels = channels.stream().map(channelFunction::apply).toList();
    } else {
      channels =
          channels.stream()
              .map(channel -> channel.toBuilder().setData(Optional.empty()).build())
              .toList();
    }

    final var newGroupData =
        ChannelGroup.Data.builder()
            .setDescription(siteDao.getStationName())
            .setLocation(getLocation(siteDao, siteChanDaos))
            .setStation(
                Station.createVersionReference(
                    siteDao.getReferenceStation(), siteDao.getId().getOnDate()))
            .setEffectiveUntil(newEndDate)
            .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
            .setChannels(channels)
            .build();

    return ChannelGroup.builder()
        .setName(siteDao.getId().getStationCode())
        .setEffectiveAt(effectiveAt)
        .setData(newGroupData)
        .build();
  }

  /**
   * Converts a {@link SiteDao}, and a passed list of {@link SiteChanDao} into a {@link
   * ChannelGroup}. {@link Channel}s in the {@link ChannelGroup} will be version references NOTE:
   * The depth is currently ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @param siteChanDaos The channels in the channel group, as specified by ChannelConverter
   * @return The {@link ChannelGroup} representing the provided CSS data
   */
  @Override
  public ChannelGroup convert(
      SiteDao siteDao,
      Collection<SiteChanDao> siteChanDaos,
      Instant effectiveAt,
      Instant effectiveUntil,
      Collection<Channel> channels) {
    Preconditions.checkNotNull(effectiveAt, EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(effectiveUntil, EFFECTIVE_UNTIL_NOT_NULL);
    Preconditions.checkNotNull(siteDao, SITE_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(
        siteChanDaos, SITE_CHANS_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveAt);

    Preconditions.checkState(
        effectiveAt.isBefore(effectiveUntil),
        EFFECTIVE_AT_UNTIL_TIME_STR,
        effectiveAt,
        effectiveUntil);
    Preconditions.checkState(
        !siteChanDaos.isEmpty(), SITE_CHANS_NOT_EMPTY + EFFECTIVE_TIME_STR, effectiveAt);

    return getChannelGroup(siteDao, siteChanDaos, channels, effectiveAt, effectiveUntil, null);
  }

  /**
   * Converts a Site into a {@link ChannelGroup} version reference. NOTE: The depth is currently
   * ignored and set to "0" as a hardcoded value.
   *
   * @param siteDao The Site for the ChannelGroup
   * @return The {@link ChannelGroup} representing the provided CSS data as a version reference
   */
  @Override
  public ChannelGroup convertToVersionReference(SiteDao siteDao) {

    Preconditions.checkNotNull(siteDao, SITE_MUST_NOT_BE_NULL);

    return ChannelGroup.createVersionReference(
        siteDao.getId().getStationCode(), siteDao.getId().getOnDate());
  }
}
