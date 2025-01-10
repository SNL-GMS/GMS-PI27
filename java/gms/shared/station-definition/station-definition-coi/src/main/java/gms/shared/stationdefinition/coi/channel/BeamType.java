package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonValue;

/** Represents the Beam Type that can be part of a {@link Channel}'s processing metadata. */
public enum BeamType {
  AMPLITUDE,
  CONTINUOUS_LOCATION,
  DETECTION,
  EVENT,
  FK;

  private final String label;

  /** Construct a beam type whose label matches the enum. */
  BeamType() {
    this.label = this.name();
  }

  @JsonValue
  public String getLabel() {
    return label;
  }
}
