package gms.shared.signaldetection.repository.utils;

import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;

/**
 * Wrapper class to primarily associate arrival components used in creating Feature Measurements.
 */
@AutoValue
public abstract class ArrivalDaoAndChannelAssociation {

  /**
   * Creates a wrapper instance that associates components used to create a {@link
   * FeatureMeasurement} from arrivals.
   *
   * @param arrivalDao {@link ArrivalDao} used to create a {@link FeatureMeasurement}
   * @param channel {@link Channel} associated with the arrivalDao
   * @param channelSegment {@link ChannelSegment} associated with the arrivalDao and channel.
   * @return {@link ArrivalDaoAndChannelAssociation} instance wrapping the associated values.
   */
  public static ArrivalDaoAndChannelAssociation create(
      ArrivalDao arrivalDao, Channel channel, ChannelSegment<? extends Timeseries> channelSegment) {
    return new AutoValue_ArrivalDaoAndChannelAssociation(arrivalDao, channel, channelSegment);
  }

  /**
   * @return {@link ArrivalDao} An arrival record used to create a Feature Measurement
   */
  public abstract ArrivalDao getArrivalDao();

  /**
   * @return {@link Channel} Channel associated with the arrivalDao
   */
  public abstract Channel getChannel();

  /**
   * @return {@link ChannelSegment} Channel segment associated with the arrivalDao and its channel.
   */
  public abstract ChannelSegment<? extends Timeseries> getChannelSegment();
}
