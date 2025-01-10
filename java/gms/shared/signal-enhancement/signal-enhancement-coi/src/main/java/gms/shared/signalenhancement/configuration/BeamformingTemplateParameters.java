package gms.shared.signalenhancement.configuration;

import com.google.common.collect.ImmutableList;
import java.time.Duration;

/** BeamformingTemplateParameters for resolving configuration fields */
public record BeamformingTemplateParameters(
    String station,
    Duration leadDuration,
    Duration beamDuration,
    Double orientationAngleToleranceDeg,
    Double sampleRateToleranceHz,
    Integer minWaveformsToBeam,
    ImmutableList<String> inputChannelGroups,
    ImmutableList<String> inputChannels,
    BeamDescriptionParameters beamDescriptionParams) {}
