package gms.shared.signalenhancement.configuration;

import gms.shared.common.coi.types.BeamSummation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Optional;

/** BeamDescriptionParameters containing configuratin fields */
public record BeamDescriptionParameters(
    BeamSummation beamSummation,
    boolean twoDimensional,
    SamplingType samplingType,
    BeamType beamType,
    PhaseType phaseType,
    Optional<FilterDefinition> preFilterDefinition) {}
