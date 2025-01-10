package gms.shared.waveform.processingmask.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nullable;

/** */
@AutoValue
@JsonSerialize(as = ProcessingMask.class)
@JsonDeserialize(builder = AutoValue_ProcessingMask.Builder.class)
public abstract class ProcessingMask {

  @Override
  public String toString() {
    return "ProcessingMask[id=" + getId() + "data=" + getData() + "]";
  }

  /**
   * @return Identifier of this ProcessingMask
   */
  public abstract UUID getId();

  /**
   * @return Data fields if populated, empty optional otherwise.
   */
  @JsonUnwrapped
  public abstract Optional<Data> getData();

  public boolean isPresent() {
    return getData().isPresent();
  }

  /**
   * @return A builder for building an instance of this class.
   */
  public static Builder instanceBuilder() {
    return new AutoValue_ProcessingMask.Builder();
  }

  /**
   * @return A builder with fields already sat to match the fields of this class.
   */
  public abstract Builder toBuilder();

  /**
   * Create an entity reference, that is, a faceted object with only the identifier populated.
   *
   * @param id ID of ProcessingMask
   * @return Entity reference for a ProcessingMask
   */
  public static ProcessingMask createEntityReference(UUID id) {
    return instanceBuilder().setId(id).build();
  }

  /**
   * Turn this object into an entity reference.
   *
   * @return ProcessingMask with no data fields.
   */
  public ProcessingMask toEntityReference() {
    return instanceBuilder().setId(getId()).build();
  }

  /** Builder class. */
  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setId(UUID id);

    @JsonUnwrapped
    public abstract Builder setData(@Nullable Data data);

    public abstract ProcessingMask build();
  }

  /** Data class. */
  @AutoValue
  @JsonSerialize(as = ProcessingMask.Data.class)
  @JsonDeserialize(builder = ProcessingMask.Data.JacksonBuilder.class)
  public abstract static class Data {

    public abstract Channel getAppliedToRawChannel();

    public abstract Instant getEffectiveAt();

    public abstract Instant getStartTime();

    public abstract Instant getEndTime();

    public abstract ProcessingOperation getProcessingOperation();

    public abstract Collection<QcSegmentVersion> getMaskedQcSegmentVersions();

    public abstract Builder toBuilder();

    public static Builder instanceBuilder() {
      return new AutoValue_ProcessingMask_Data.Builder();
    }

    //
    // Since we have two builder classes, have an interface that has all of the
    // needed setters and build methods.
    //
    public interface Buildable {

      Buildable setAppliedToRawChannel(Channel applyToRawChannel);

      Buildable setEffectiveAt(Instant effectiveAt);

      Buildable setStartTime(Instant startTime);

      Buildable setEndTime(Instant endTime);

      Buildable setProcessingOperation(ProcessingOperation processingOperation);

      Buildable setMaskedQcSegmentVersions(Collection<QcSegmentVersion> maskedVersions);

      Data build();
    }

    /** Data builder class for use by developers. */
    @AutoValue.Builder
    public abstract static class Builder implements Buildable {

      abstract Data autoBuild();

      @Nullable @Override
      public Data build() {
        var tentativeData = autoBuild();

        checkState(
            tentativeData.getStartTime().equals(tentativeData.getEndTime())
                || tentativeData.getStartTime().isBefore(tentativeData.getEndTime()),
            "Start time ["
                + tentativeData.getStartTime()
                + "] must equal or preceed end time ["
                + tentativeData.getEndTime()
                + "]");
        checkState(
            !tentativeData.getMaskedQcSegmentVersions().isEmpty(),
            "MaskedQcSegmentVersions must not be empty");

        var versionChannels =
            tentativeData.getMaskedQcSegmentVersions().stream()
                .map(QcSegmentVersion::getData)
                .flatMap(Optional::stream)
                .map(QcSegmentVersion.Data::getChannels)
                .flatMap(List::stream)
                .map(Channel::getName)
                .collect(Collectors.toSet());

        checkState(
            versionChannels.stream()
                .allMatch(
                    channelName ->
                        channelName.equals(tentativeData.getAppliedToRawChannel().getName())),
            "Channel %s does not match all of the channel names: %s",
            tentativeData.getAppliedToRawChannel(),
            versionChannels);

        return tentativeData;
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

      private final AutoValue_ProcessingMask_Data.Builder delgateBuilder =
          new AutoValue_ProcessingMask_Data.Builder();
      private int invokedSetterCount;

      @Override
      public Buildable setAppliedToRawChannel(Channel applyToRawChannel) {
        invokedSetterCount++;
        delgateBuilder.setAppliedToRawChannel(applyToRawChannel);
        return this;
      }

      @Override
      public Buildable setEffectiveAt(Instant effectiveAt) {
        invokedSetterCount++;
        delgateBuilder.setEffectiveAt(effectiveAt);
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
      public Buildable setProcessingOperation(ProcessingOperation processingOperation) {
        invokedSetterCount++;
        delgateBuilder.setProcessingOperation(processingOperation);
        return this;
      }

      @Override
      public Buildable setMaskedQcSegmentVersions(Collection<QcSegmentVersion> maskedVersions) {
        invokedSetterCount++;
        delgateBuilder.setMaskedQcSegmentVersions(maskedVersions);
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
