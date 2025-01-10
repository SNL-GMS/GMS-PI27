package gms.shared.waveform.api.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;

/**
 * An Object used to describe a segment of Channel data. Used in place of return the actual segment
 * data itself.
 */
@AutoValue
@JsonSerialize(as = ChannelSegmentDescriptorRequest.class)
@JsonDeserialize(builder = AutoValue_ChannelSegmentDescriptorRequest.Builder.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class ChannelSegmentDescriptorRequest {

  public abstract Collection<ChannelSegmentDescriptor> getChannelSegmentDescriptors();

  public abstract Optional<FacetingDefinition> getFacetingDefinition();

  public static ChannelSegmentDescriptorRequest.Builder builder() {
    return new AutoValue_ChannelSegmentDescriptorRequest.Builder();
  }

  public abstract ChannelSegmentDescriptorRequest.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    ChannelSegmentDescriptorRequest.Builder setChannelSegmentDescriptors(
        Collection<ChannelSegmentDescriptor> channelSegmentDescriptors);

    Collection<ChannelSegmentDescriptor> getChannelSegmentDescriptors();

    ChannelSegmentDescriptorRequest.Builder setFacetingDefinition(
        @Nullable FacetingDefinition facetingDefinition);

    /**
     * Clears an already-set {@link FacetingDefinition}
     *
     * @return the updated Builder
     */
    default ChannelSegmentDescriptorRequest.Builder noFacetingDefinition() {
      return this.setFacetingDefinition(null);
    }

    Optional<FacetingDefinition> getFacetingDefinition();

    ChannelSegmentDescriptorRequest build();
  }
}
