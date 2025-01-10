package gms.shared.stationdefinition.cache.util;

import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import java.util.Optional;

@AutoValue
public abstract class DerivedChannelIdComponents {

  public abstract long getWfid();

  public abstract Optional<AssociatedRecordInfo> getAssociatedRecordInfo();

  public abstract Optional<Long> getFilterId();

  public static Builder builder() {
    return new AutoValue_DerivedChannelIdComponents.Builder();
  }

  abstract Builder toBuilder();

  @AutoValue.Builder
  public abstract static class Builder {

    public abstract Builder setWfid(long wfid);

    public abstract Builder setAssociatedRecordInfo(AssociatedRecordInfo associatedRecordInfo);

    public Builder setAssociatedRecordInfo(TagName associatedRecordType, Long associatedRecordId) {
      this.setAssociatedRecordInfo(
          AssociatedRecordInfo.create(associatedRecordType, associatedRecordId));
      return this;
    }

    public abstract Builder setFilterId(long filterId);

    protected abstract DerivedChannelIdComponents autoBuild();

    public DerivedChannelIdComponents build() {
      return autoBuild();
    }
  }

  @AutoValue
  public abstract static class AssociatedRecordInfo {
    public abstract TagName getAssociatedRecordType();

    public abstract Long getAssociatedRecordId();

    public static AssociatedRecordInfo create(
        TagName associatedrecordType, Long associatedRecordId) {
      return new AutoValue_DerivedChannelIdComponents_AssociatedRecordInfo(
          associatedrecordType, associatedRecordId);
    }
  }
}
