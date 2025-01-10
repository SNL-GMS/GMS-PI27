package gms.shared.stationdefinition.coi.utils;

import java.time.Instant;
import java.util.Optional;

public interface StationDefinitionObject {

  Optional<Instant> getEffectiveAt();

  Optional<Instant> getEffectiveUntil();

  String getName();

  StationDefinitionObject setEffectiveUntil(Instant effectiveUntil);

  StationDefinitionObject setEffectiveAt(Instant effectiveAt);
}
