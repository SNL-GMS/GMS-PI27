package gms.shared.signalenhancement.configuration;

import gms.shared.common.coi.types.PhaseType;
import java.util.Set;

/**
 * Intermediate configuration representation of FK reviewable phases necessary to resolve from
 * configuration JSON
 */
public record FkReviewablePhasesConfiguration(Set<PhaseType> phases) {}
