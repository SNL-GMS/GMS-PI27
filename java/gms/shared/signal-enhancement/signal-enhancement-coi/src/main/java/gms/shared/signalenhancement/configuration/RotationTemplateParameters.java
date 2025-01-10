package gms.shared.signalenhancement.configuration;

import com.google.common.collect.ImmutableList;
import gms.shared.signalenhancement.coi.rotation.RotationDescription;
import java.time.Duration;
import java.util.Optional;

/** RotationTemplateParameters for resolving rotation configs */
public record RotationTemplateParameters(
    Duration duration,
    Optional<ImmutableList<String>> inputChannels,
    Optional<String> inputChannelGroup,
    Duration leadDuration,
    double locationToleranceKm,
    double orientationAngleToleranceDeg,
    RotationDescription rotationDescription,
    double sampleRateToleranceHz,
    String station) {}
