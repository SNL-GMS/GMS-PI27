package gms.shared.signaldetection.repository.utils;

import static com.google.common.base.Preconditions.checkNotNull;

public record LegacyMapping<L, C>(L legacyValue, C coiValue) {
  public LegacyMapping {
    checkNotNull(legacyValue);
    checkNotNull(coiValue);
  }
}
