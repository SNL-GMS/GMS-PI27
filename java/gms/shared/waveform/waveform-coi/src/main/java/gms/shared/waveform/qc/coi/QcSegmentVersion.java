package gms.shared.waveform.qc.coi;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import javax.annotation.Nullable;

/** Models the QcSgementVersion COI, with faceting. */
@AutoValue
@JsonSerialize(as = QcSegmentVersion.class)
@JsonDeserialize(builder = AutoValue_QcSegmentVersion.Builder.class)
public abstract class QcSegmentVersion implements Comparable<QcSegmentVersion> {

  /**
   * @return Identifier of this QcSegmentVersion
   */
  public abstract QcSegmentVersionId getId();

  /**
   * @return Data fields if populated, empty optional otherwise.
   */
  @JsonUnwrapped
  public abstract Optional<Data> getData();

  /**
   * @return A builder for building an instance of this class.
   */
  public static Builder instanceBuilder() {
    return new AutoValue_QcSegmentVersion.Builder();
  }

  /**
   * @return A builder with fields already sat to match the fields of this class.
   */
  public abstract Builder toBuilder();

  /**
   * Create an entity reference, that is, a faceted object with only the identifier populated.
   *
   * @param id ID of QcSegmentVersion
   * @return Entity reference for a QcSegmnetVersion
   */
  public static QcSegmentVersion createEntityReference(QcSegmentVersionId id) {
    return instanceBuilder().setId(id).build();
  }

  /**
   * Turn this object into an entity reference.
   *
   * @return QcSegmentVersion with no data fields.
   */
  public QcSegmentVersion toEntityReference() {
    return instanceBuilder().setId(getId()).build();
  }

  /**
   * Compare with another QcSegmentVersion for ordering. Compares the effective date in the
   * identifier.
   *
   * @param t Other QcSegmentVersion to compare to
   * @return Result of comparing the Instants returned by getEffectiveAt()
   */
  @Override
  public int compareTo(QcSegmentVersion t) {
    return this.getId().getEffectiveAt().compareTo(t.getId().getEffectiveAt());
  }

  /** Builder class. */
  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setId(QcSegmentVersionId id);

    @JsonUnwrapped
    public abstract Builder setData(@Nullable Data data);

    public abstract QcSegmentVersion build();
  }

  /** Data class. */
  @AutoValue
  @JsonSerialize(as = QcSegmentVersion.Data.class)
  @JsonDeserialize(builder = QcSegmentVersion.Data.JacksonBuilder.class)
  public abstract static class Data {

    public abstract Optional<WorkflowDefinitionId> getStageId();

    public abstract List<ChannelSegment<? extends Timeseries>> getDiscoveredOn();

    public abstract List<Channel> getChannels();

    public abstract String getRationale();

    public abstract boolean isRejected();

    public abstract String getCreatedBy();

    public abstract Instant getEndTime();

    public abstract Instant getStartTime();

    public abstract Optional<QcSegmentType> getType();

    public abstract Optional<QcSegmentCategory> getCategory();

    public abstract Builder toBuilder();

    public static Builder instanceBuilder() {
      return new AutoValue_QcSegmentVersion_Data.Builder();
    }

    //
    // Since we have two builder classes, have an interface that has all of the
    // needed setters and build methods.
    //
    public interface Buildable {

      Buildable setStageId(@Nullable WorkflowDefinitionId stageId);

      Buildable setDiscoveredOn(List<ChannelSegment<? extends Timeseries>> segments);

      Buildable setChannels(List<Channel> channels);

      Buildable setRationale(String rationale);

      Buildable setRejected(boolean isRejected);

      Buildable setCreatedBy(String createdBy);

      Buildable setStartTime(Instant startTime);

      Buildable setEndTime(Instant endTime);

      Buildable setType(@Nullable QcSegmentType type);

      Buildable setCategory(@Nullable QcSegmentCategory category);

      Data build();
    }

    /** Data builder class for use by developers. */
    @AutoValue.Builder
    public abstract static class Builder implements Buildable {

      abstract Data autoBuild();

      @Nullable @Override
      public Data build() {

        var tentativeData = autoBuild();

        validateCategoryAndType(tentativeData);

        return tentativeData;
      }

      private static void validateCategoryAndType(Data tentativeData) {

        tentativeData
            .getCategory()
            .ifPresentOrElse(
                category -> checkDataAndCategoryTypes(tentativeData, category),
                () -> {
                  if (tentativeData.getType().isPresent()) {
                    throw new IllegalArgumentException("Type is specfied but category is not");
                  }
                });
      }

      private static void checkDataAndCategoryTypes(
          Data tentativeData, QcSegmentCategory category) {
        if (tentativeData.isRejected()) {
          throw new IllegalArgumentException("Rejected QcSegmentVersion can't have a category");
        }

        tentativeData
            .getType()
            .ifPresentOrElse(
                (QcSegmentType type) -> {
                  if (!category.getAllowableTypes().contains(type)) {
                    throw new IllegalArgumentException(
                        "Invalid type "
                            + tentativeData.getType()
                            + " for category "
                            + tentativeData.getCategory());
                  }
                },
                () -> {
                  if (!category.allowEmptyType()) {
                    throw new IllegalArgumentException(
                        "No type specified, but allowed types for category not empty");
                  }
                });
      }
    }

    //
    // Seperate data bulder class for Jackson. This was the only way, it seems,
    // to prevent calling AutoValues builder directly when all fields were empty,
    // which would cause Autovalues builder to fail. Since we dont want to turn
    // off null checks for that builder, use this one for Jackson which returns
    // null if all fields are unset, and delegates to Autovalues builder otherwise.
    //
    // Since this is not intended for developsrs, it is made private.
    //
    @JsonPOJOBuilder(withPrefix = "set")
    private static class JacksonBuilder implements Buildable {

      private final AutoValue_QcSegmentVersion_Data.Builder delgateBuilder =
          new AutoValue_QcSegmentVersion_Data.Builder();
      private int invokedSetterCount;

      @Override
      public Buildable setStageId(@Nullable WorkflowDefinitionId stageId) {
        invokedSetterCount++;
        delgateBuilder.setStageId(stageId);
        return this;
      }

      @Override
      public Buildable setDiscoveredOn(List<ChannelSegment<? extends Timeseries>> segments) {
        invokedSetterCount++;
        delgateBuilder.setDiscoveredOn(segments);
        return this;
      }

      @Override
      public Buildable setChannels(List<Channel> channels) {
        invokedSetterCount++;
        delgateBuilder.setChannels(channels);
        return this;
      }

      @Override
      public Buildable setRationale(String rationale) {
        invokedSetterCount++;
        delgateBuilder.setRationale(rationale);
        return this;
      }

      @Override
      public Buildable setRejected(boolean isRejected) {
        invokedSetterCount++;
        delgateBuilder.setRejected(isRejected);
        return this;
      }

      @Override
      public Buildable setCreatedBy(String createdBy) {
        invokedSetterCount++;
        delgateBuilder.setCreatedBy(createdBy);
        return this;
      }

      @Override
      public Buildable setStartTime(Instant startTime) {
        invokedSetterCount++;
        delgateBuilder.setStartTime(startTime);
        return this;
      }

      @Override
      public Buildable setEndTime(Instant endTime) {
        invokedSetterCount++;
        delgateBuilder.setEndTime(endTime);
        return this;
      }

      @Override
      public Buildable setType(@Nullable QcSegmentType type) {
        invokedSetterCount++;
        delgateBuilder.setType(type);
        return this;
      }

      @Override
      public Buildable setCategory(@Nullable QcSegmentCategory category) {
        invokedSetterCount++;
        delgateBuilder.setCategory(category);
        return this;
      }

      @Nullable @Override
      public Data build() {
        if (invokedSetterCount == 0) {
          return null;
        }

        return delgateBuilder.build();
      }
    }
  }
}
