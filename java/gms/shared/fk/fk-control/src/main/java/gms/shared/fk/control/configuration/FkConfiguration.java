package gms.shared.fk.control.configuration;

import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.control.api.FkStreamingRequest;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.UnaryOperator;

public final class FkConfiguration {

  private static final String DEFAULT_SPECTRA_PLUGIN_NAME = "caponFkSpectraPlugin";
  private static final String DEFAULT_ATTRIBUTES_PLUGIN_NAME = "maxPowerFkAttributesPlugin";
  private static final String SEPARATOR = ".";
  private static final String FK_PREFIX = "fk-control" + SEPARATOR;
  private static final UnaryOperator<String> KEY_BUILDER = s -> FK_PREFIX + s;

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  private FkConfiguration(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  public static FkConfiguration create(ConfigurationConsumerUtility configurationConsumerUtility) {
    Objects.requireNonNull(
        configurationConsumerUtility,
        "FkConfiguration cannot be created with null ConfigurationConsumerUtility");

    return new FkConfiguration(configurationConsumerUtility);
  }

  /**
   * Creates {@link FkSpectraParameters} given input {@link FkStreamingRequest}
   *
   * @return Parameters used to run FkAnalysis
   */
  public FkSpectraParameters createFkSpectraParameters(
      FkStreamingRequest request, double waveformSampleRateHz) {
    Objects.requireNonNull(
        request, "Cannot create FkSpectraParameters from null FkStreamingRequest");

    var builder =
        getDefaultFkSpectraDefinition().toBuilder()
            .setSampleRateHz(request.getSampleRate())
            .setWindowLead(request.getWindowLead())
            .setWindowLength(request.getWindowLength())
            .setLowFrequencyHz(request.getLowFrequency())
            .setHighFrequencyHz(request.getHighFrequency())
            .setUseChannelVerticalOffsets(request.getUseChannelVerticalOffset())
            .setNormalizeWaveforms(request.getNormalizeWaveforms())
            .setPhaseType(request.getPhaseType())
            .setWaveformSampleRateHz(waveformSampleRateHz);

    request.getSlowStartX().ifPresent(builder::setSlowStartXSecPerKm);
    request.getSlowDeltaX().ifPresent(builder::setSlowDeltaXSecPerKm);
    request.getSlowCountX().ifPresent(builder::setSlowCountX);
    request.getSlowStartY().ifPresent(builder::setSlowStartYSecPerKm);
    request.getSlowDeltaY().ifPresent(builder::setSlowDeltaYSecPerKm);
    request.getSlowCountY().ifPresent(builder::setSlowCountY);

    return FkSpectraParameters.from(
        DEFAULT_SPECTRA_PLUGIN_NAME, request.getChannels(), builder.build());
  }

  public static List<FkAttributesParameters> createFkAttributesParameters(
      FkSpectraDefinition definition) {
    Objects.requireNonNull(
        definition, "Cannot create FkAttributesParameters from null FkSpectraDefinition");

    return List.of(
        FkAttributesParameters.from(
            DEFAULT_ATTRIBUTES_PLUGIN_NAME,
            Map.of(
                "lowFrequency",
                definition.getLowFrequencyHz(),
                "highFrequency",
                definition.getHighFrequencyHz(),
                "eastSlowStart",
                definition.getSlowStartXSecPerKm(),
                "eastSlowDelta",
                definition.getSlowDeltaXSecPerKm(),
                "northSlowStart",
                definition.getSlowStartYSecPerKm(),
                "northSlowDelta",
                definition.getSlowDeltaYSecPerKm())));
  }

  private FkSpectraDefinition getDefaultFkSpectraDefinition() {
    return configurationConsumerUtility.resolve(
        KEY_BUILDER.apply("fk-spectra-definitions"), List.of(), FkSpectraDefinition.class);
  }
}
