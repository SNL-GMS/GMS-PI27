package gms.shared.waveform.qc.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.time.Instant;
import java.util.UUID;

/** QcSegmentVersion identifier; includes UUID and effective date. */
@AutoValue
@JsonSerialize(as = QcSegmentVersionId.class)
@JsonDeserialize(builder = AutoValue_QcSegmentVersionId.Builder.class)
public abstract class QcSegmentVersionId {

  public abstract UUID getParentQcSegmentId();

  public abstract Instant getEffectiveAt();

  public static Builder instanceBuilder() {
    return new AutoValue_QcSegmentVersionId.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {
    public abstract Builder setParentQcSegmentId(UUID uuid);

    public abstract Builder setEffectiveAt(Instant effectiveAt);

    public abstract QcSegmentVersionId build();
  }
}
