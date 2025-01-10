package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;
import org.apache.commons.lang3.Validate;

/** A request object sent to the SignalEnhancementService to resolve BeamformingTemplates */
@AutoValue
@JsonSerialize(as = BeamformingTemplatesRequest.class)
@JsonDeserialize(builder = AutoValue_BeamformingTemplatesRequest.Builder.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class BeamformingTemplatesRequest {

  public abstract ImmutableList<PhaseType> getPhases();

  public abstract ImmutableList<Station> getStations();

  public abstract BeamType getBeamType();

  /**
   * Builder
   *
   * @return returns a builder for beamformingTemplatesRequest
   */
  public static BeamformingTemplatesRequest.Builder builder() {
    return new AutoValue_BeamformingTemplatesRequest.Builder();
  }

  /**
   * @return {@link BeamformingTemplatesRequest.Builder}
   */
  public abstract BeamformingTemplatesRequest.Builder toBuilder();

  /** A builder for BeamformingTemplateRequest */
  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {
    /**
     * @param phaseTypes a list of phase types
     * @return
     */
    BeamformingTemplatesRequest.Builder setPhases(ImmutableList<PhaseType> phaseTypes);

    /**
     * @param phaseTypes a collection of phasetypes
     * @return
     */
    default BeamformingTemplatesRequest.Builder setPhases(Collection<PhaseType> phaseTypes) {
      return setPhases(ImmutableList.copyOf(phaseTypes));
    }

    /**
     * @param stations a list of stations
     * @return
     */
    BeamformingTemplatesRequest.Builder setStations(ImmutableList<Station> stations);

    /**
     * @param stations a collection of stations
     * @return
     */
    default BeamformingTemplatesRequest.Builder setStations(Collection<Station> stations) {
      return setStations(ImmutableList.copyOf(stations));
    }

    /**
     * @param beamType a beam type
     * @return
     */
    BeamformingTemplatesRequest.Builder setBeamType(BeamType beamType);

    /**
     * @return {@link BeamformingTemplatesRequest}
     */
    BeamformingTemplatesRequest autoBuild();

    /**
     * Builds a BeamformingTemplateRequest
     *
     * @return {@link BeamformingTemplateRequest}
     */
    default BeamformingTemplatesRequest build() {
      var beamformingTemplatesRequest = autoBuild();
      Validate.notEmpty(
          beamformingTemplatesRequest.getStations(), "Request must contain at least one station");

      Validate.notEmpty(
          beamformingTemplatesRequest.getPhases(), "Request must contain at least phase type");

      return beamformingTemplatesRequest;
    }
  }
}
