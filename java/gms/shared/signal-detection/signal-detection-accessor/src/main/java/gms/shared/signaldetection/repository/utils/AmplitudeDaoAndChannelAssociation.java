package gms.shared.signaldetection.repository.utils;

import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;

/**
 * Wrapper class to primarily associate amplitude components used in creating {@link
 * FeatureMeasurement}s.
 */
@AutoValue
public abstract class AmplitudeDaoAndChannelAssociation {

  /**
   * Creates a wrapper instance that associates components used to create a {@link
   * FeatureMeasurement} from amplitudes.
   *
   * @param amplitudeDao {@link AmplitudeDao} record used to create a feature measurement
   * @param channel {@link Channel} corresponding to the amplitude record
   * @param channelSegment {@link ChannelSegment} associated with the channel
   * @return {@link AmplitudeDaoAndChannelAssociation} instance that wraps the values associated
   *     with creating a {@link FeatureMeasurement}
   */
  public static AmplitudeDaoAndChannelAssociation create(
      AmplitudeDao amplitudeDao,
      Channel channel,
      ChannelSegment<? extends Timeseries> channelSegment) {
    return new AutoValue_AmplitudeDaoAndChannelAssociation(amplitudeDao, channel, channelSegment);
  }

  /**
   * @return {@link AmplitudeDao} record used to create a feature measurement
   */
  public abstract AmplitudeDao getAmplitudeDao();

  /**
   * @return {@link Channel} corresponding to the amplitude record
   */
  public abstract Channel getChannel();

  /**
   * @return {@link ChannelSegment} associated with channel.
   */
  public abstract ChannelSegment<? extends Timeseries> getChannelSegment();
}
