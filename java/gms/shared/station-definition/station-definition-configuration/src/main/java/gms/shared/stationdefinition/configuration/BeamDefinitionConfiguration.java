package gms.shared.stationdefinition.configuration;

import gms.shared.common.coi.types.SamplingType;
import gms.shared.derivedchannel.coi.BeamDescription;

/** Record containing configurations needed for BeamDefinition */
public record BeamDefinitionConfiguration(
    double sampleRateToleranceHz,
    int minWaveformsToBeam,
    BeamDescription beamDescription,
    SamplingType samplingType,
    boolean isTwoDimensional) {}
