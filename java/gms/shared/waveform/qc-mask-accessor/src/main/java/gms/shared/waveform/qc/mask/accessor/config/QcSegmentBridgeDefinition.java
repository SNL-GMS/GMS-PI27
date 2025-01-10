package gms.shared.waveform.qc.mask.accessor.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import java.time.Duration;
import java.time.LocalTime;

@AutoValue
public abstract class QcSegmentBridgeDefinition {

  public abstract Duration getMaxQcSegmentDuration();

  public abstract LocalTime getSeedQcMaskInfoStartTime();

  public abstract Duration getSeedQcMaskInfoDuration();

  @JsonCreator
  public static QcSegmentBridgeDefinition create(
      @JsonProperty("maxQcSegmentDuration") Duration maxQcSegmentDuration,
      @JsonProperty("seedQcMaskInfoStartTime") LocalTime seedQcMaskInfoStartTime,
      @JsonProperty("seedQcMaskInfoDuration") Duration seedQcMaskInfoDuration) {

    Preconditions.checkState(
        !maxQcSegmentDuration.isNegative(), "Max QcSegment duration cannot be negative");

    Preconditions.checkState(
        !seedQcMaskInfoDuration.isNegative(), "Seed QcMaskInfo duration cannot be negative");

    return new AutoValue_QcSegmentBridgeDefinition(
        maxQcSegmentDuration, seedQcMaskInfoStartTime, seedQcMaskInfoDuration);
  }
}
