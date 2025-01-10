package gms.shared.fk.plugin;

import com.google.auto.service.AutoService;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.plugin.algorithms.CaponFkSpectrumAlgorithm;
import gms.shared.fk.plugin.algorithms.util.MediumVelocities;
import gms.shared.fk.plugin.fkspectra.FkSpectraPlugin;
import gms.shared.fk.pluginregistry.Plugin;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectra;
import gms.shared.waveform.coi.Waveform;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@AutoService(Plugin.class)
public class CaponFkSpectraPlugin implements FkSpectraPlugin {

  private static final String DEFAULT_MODEL_NAME = "ak135";

  @Override
  public String getName() {
    return "caponFkSpectraPlugin";
  }

  @Override
  public List<FkSpectra> generateFk(
      Station station,
      Collection<ChannelSegment<Waveform>> channelSegments,
      FkSpectraDefinition definition) {

    Objects.requireNonNull(
        channelSegments, getName() + " cannot generate FK spectra from null channel segments");
    Objects.requireNonNull(
        definition, getName() + " cannot generate FK spectra from null FK spectra definition");

    var mediumVelocities = new MediumVelocities();
    try {
      mediumVelocities.initialize(DEFAULT_MODEL_NAME);
    } catch (IOException e) {
      throw new IllegalStateException("Failed to initialize MediumVelocities Utility", e);
    }

    double mediumVelocity =
        mediumVelocities.getMediumVelocity(station.getLocation(), definition.getPhaseType());

    Map<Channel, RelativePosition> relativePositionsByChannelName =
        station.getRelativePositionsByChannel();

    var algorithm =
        CaponFkSpectrumAlgorithm.create(definition, mediumVelocity, relativePositionsByChannelName);

    FkSpectra.Builder spectra =
        FkSpectra.builder()
            .setStartTime(
                channelSegments
                    .iterator()
                    .next()
                    .getId()
                    .getStartTime()
                    .plus(definition.getWindowLead()))
            .setSampleRateHz(definition.getSampleRateHz())
            .withValues(algorithm.generateFk(channelSegments));

    spectra
        .metadataBuilder()
        .setPhaseType(definition.getPhaseType())
        .setSlowStartX(definition.getSlowStartXSecPerKm())
        .setSlowDeltaX(definition.getSlowDeltaXSecPerKm())
        .setSlowStartY(definition.getSlowStartYSecPerKm())
        .setSlowDeltaY(definition.getSlowDeltaYSecPerKm());

    return List.of(spectra.build());
  }
}
