package gms.shared.signalfeaturemeasurement.configuration;

import gms.shared.signalenhancement.configuration.BeamformingTemplateParameters;
import gms.shared.signalenhancement.configuration.RotationTemplateParameters;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Optional;

/** AmplitudeMeasurementConditioningParameters for resolving conditioning configs */
public record AmplitudeMeasurementConditioningTemplateParameters(
    Optional<BeamformingTemplateParameters> beamformingTemplate,
    Optional<String> measuredChannel,
    Optional<FilterDefinition> filterDefinition,
    Optional<RotationTemplateParameters> rotationTemplate) {}
