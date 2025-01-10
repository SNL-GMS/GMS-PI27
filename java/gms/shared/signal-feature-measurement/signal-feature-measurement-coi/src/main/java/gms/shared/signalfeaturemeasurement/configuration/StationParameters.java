package gms.shared.signalfeaturemeasurement.configuration;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;

/** Contains Station collection parameters for feature measurement */
public record StationParameters(ImmutableList<String> stations) {
  public StationParameters {
    Preconditions.checkNotNull(stations);
  }
}
