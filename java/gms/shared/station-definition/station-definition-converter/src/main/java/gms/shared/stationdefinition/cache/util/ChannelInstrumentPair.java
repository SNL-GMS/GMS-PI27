package gms.shared.stationdefinition.cache.util;

import java.util.Objects;

/**
 * Value class for storing the {@link Channel} name and {@link Instrument} id for the {@link
 * FrequencyAmplitudePhase} map cache in {@link StationDefinitionIdUtility}
 */
public final class ChannelInstrumentPair {
  private String channelName;
  private Long instrumentId;

  /**
   * Value class for storing the {*link Channel} name and {@link Instrument} id for the {@link
   * FrequencyAmplitudePhase} map cache in {@link StationDefinitionIdUtility}
   *
   * @param channelName the name of a {@link Channel}
   * @param instrumentId the id of an {@link Instrument}
   */
  public ChannelInstrumentPair(String channelName, Long instrumentId) {
    this.channelName = channelName;
    this.instrumentId = instrumentId;
  }

  public String getChannelName() {
    return this.channelName;
  }

  public Long getInstrumentId() {
    return this.instrumentId;
  }

  public void setChannelName(String channelName) {
    this.channelName = channelName;
  }

  public void setInstrumentId(Long instrumentId) {
    this.instrumentId = instrumentId;
  }

  @Override
  public boolean equals(Object that) {
    if (this == that) {
      return true;
    }

    if (!(that instanceof ChannelInstrumentPair)) {
      return false;
    }

    var thatPair = (ChannelInstrumentPair) that;

    boolean nameMatch;
    if (this.getChannelName() == null) {
      nameMatch = (thatPair.getChannelName() == null);
    } else {
      nameMatch = (this.getChannelName().equals(thatPair.getChannelName()));
    }

    return nameMatch && Objects.equals(this.getInstrumentId(), thatPair.getInstrumentId());
  }

  @Override
  public int hashCode() {
    var hash = 5;
    hash = 79 * hash + Objects.hashCode(this.channelName);
    hash = 79 * hash + Objects.hashCode(this.instrumentId);
    return hash;
  }
}
