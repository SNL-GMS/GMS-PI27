package gms.shared.stationdefinition.cache;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CachePopulator {

  private static final Logger LOGGER = LoggerFactory.getLogger(CachePopulator.class);

  private final StationDefinitionAccessor stationDefinitionAccessor;

  @Autowired
  public CachePopulator(StationDefinitionAccessor stationDefinitionAccessor) {
    Objects.requireNonNull(stationDefinitionAccessor);
    this.stationDefinitionAccessor = stationDefinitionAccessor;
  }

  /**
   * Populates this instance's {@link StationDefinitionAccessor} with data for the provided time
   * period, using the provided list of station group names
   *
   * @param stationGroupNames the station group names used to populate the cache
   * @param periodStart The beginning of the operational time period
   * @param periodEnd The end of the operational time period
   * @param retryPolicy RetryPolicy for populating cache
   */
  public void populate(
      List<String> stationGroupNames,
      Duration periodStart,
      Duration periodEnd,
      RetryPolicy<Void> retryPolicy) {
    Objects.requireNonNull(stationGroupNames);
    Objects.requireNonNull(periodStart);
    Objects.requireNonNull(periodEnd);
    Objects.requireNonNull(retryPolicy);

    Preconditions.checkState(
        !periodStart.isNegative(), "Cannot populate cache based on negative period start duration");
    Preconditions.checkState(
        !periodEnd.isNegative(), "Cannot populate cache based on a negative period end duration");
    Preconditions.checkState(
        periodStart.compareTo(periodEnd) != 0,
        "Cannot populate cache with empty cache duration (period start equal to period end");
    Preconditions.checkState(
        periodStart.compareTo(periodEnd) > 0,
        "Cannot populate cache with a negative caching duration (period start shorter than period"
            + " end");

    Instant startTime = Instant.now().minus(periodStart);
    Instant endTime = Instant.now().minus(periodEnd);

    try {
      Failsafe.with(retryPolicy)
          .run(() -> stationDefinitionAccessor.cache(stationGroupNames, startTime, endTime));
    } catch (Exception ex) {
      LOGGER.error("Error loading cache", ex);
    }
  }
}
