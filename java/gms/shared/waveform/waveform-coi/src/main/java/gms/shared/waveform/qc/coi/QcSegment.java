package gms.shared.waveform.qc.coi;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableSortedSet;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.List;
import java.util.Optional;
import java.util.SortedSet;
import java.util.UUID;
import java.util.stream.Collectors;

/** Models the QcSegment COI, with faceting. */
@AutoValue
@JsonSerialize(as = QcSegment.class)
@JsonDeserialize(builder = AutoValue_QcSegment.Builder.class)
public abstract class QcSegment {

  /**
   * @return Identifier of this QcSegment
   */
  public abstract UUID getId();

  /**
   * @return Data fields if populated, empty optional otherwise.
   */
  @JsonUnwrapped
  public abstract Optional<Data> getData();

  /**
   * @return A builder for building an instance of this class.
   */
  public static Builder instanceBuilder() {
    return new AutoValue_QcSegment.Builder();
  }

  /**
   * @return A builder with fields already sat to match the fields of this class.
   */
  public abstract Builder toBuilder();

  /**
   * Like toBuilder, but prevents the id from being changed.
   *
   * @return a builder.
   */
  public Builder toIdPreservingBuilder() {
    return toBuilder().lockId(getId());
  }

  /**
   * Create an entity reference, that is, a faceted object with only the identifier populated.
   *
   * @param id ID of QcSegment
   * @return Entity reference for a QcSegmnet
   */
  public static QcSegment createEntityReference(UUID id) {
    return instanceBuilder().setId(id).build();
  }

  /**
   * Turn this object into an entity reference.
   *
   * @return QcSegment with no data fields.
   */
  public QcSegment toEntityReference() {
    return instanceBuilder().setId(getId()).build();
  }

  /**
   * Return set of vQcSegmentVersions, where the latest is fully populated and the rest are entity
   * references.
   *
   * @return QcSegment with same identity but with the "proper" history of QcSegmentVersions as
   *     entity references.
   */
  public QcSegment withPreviousHistoryAsEntityReference() {

    return getData()
        .map(
            (Data data) -> {
              var lastVersion = data.getVersionHistory().last();
              var set = data.getVersionHistory().headSet(lastVersion);

              var facetedSet =
                  set.stream().map(QcSegmentVersion::toEntityReference).collect(Collectors.toSet());

              facetedSet.add(lastVersion);

              return toBuilder()
                  .setData(
                      data.toBuilder()
                          .setVersionHistory(ImmutableSortedSet.copyOf(facetedSet))
                          .build())
                  .build();
            })
        .orElseThrow(
            () ->
                new IllegalStateException(
                    "Calling withPreviousHistoryAsEntityReference on an entity reference"));
  }

  /** Builder class. */
  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private UUID lockedId;

    private Builder lockId(UUID uuid) {
      this.lockedId = uuid;
      return this;
    }

    public abstract Builder setId(UUID id);

    @JsonUnwrapped
    public abstract Builder setData(Data data);

    abstract QcSegment autoBuild();

    public QcSegment build() {
      var tentativeQcSegment = autoBuild();

      if (lockedId != null && !tentativeQcSegment.getId().equals(lockedId)) {
        throw new IllegalStateException("The id for this builder is locked");
      }

      return tentativeQcSegment;
    }
  }

  /** Data class. */
  @AutoValue
  @JsonSerialize(as = QcSegment.Data.class)
  @JsonDeserialize(builder = AutoValue_QcSegment_Data.Builder.class)
  public abstract static class Data {

    public abstract Channel getChannel();

    public abstract SortedSet<QcSegmentVersion> getVersionHistory();

    public abstract Builder toBuilder();

    public static Builder instanceBuilder() {
      return new AutoValue_QcSegment_Data.Builder();
    }

    /** Builder for data class. */
    @AutoValue.Builder
    @JsonPOJOBuilder(withPrefix = "set")
    public abstract static class Builder {

      public abstract Builder setChannel(Channel channel);

      public abstract Builder setVersionHistory(SortedSet<QcSegmentVersion> versionHistory);

      abstract Data autoBuild();

      public Data build() {
        var tentativeData = autoBuild();

        var versionChannels =
            tentativeData.getVersionHistory().stream()
                .map(QcSegmentVersion::getData)
                .flatMap(Optional::stream)
                .map(QcSegmentVersion.Data::getChannels)
                .flatMap(List::stream)
                .map(Channel::getName)
                .collect(Collectors.toSet());

        Preconditions.checkState(
            versionChannels.stream()
                .allMatch(channelName -> channelName.equals(tentativeData.getChannel().getName())),
            "Channel %s does not match all of the channel names: %s",
            tentativeData.getChannel(),
            versionChannels);

        // Use immutable list
        return tentativeData.toBuilder()
            .setVersionHistory(ImmutableSortedSet.copyOf(tentativeData.getVersionHistory()))
            // Use autoBuild so we dont recurse
            .autoBuild();
      }
    }
  }
}
