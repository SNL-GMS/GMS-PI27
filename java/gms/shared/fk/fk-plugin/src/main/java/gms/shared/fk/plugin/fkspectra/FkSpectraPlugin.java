package gms.shared.fk.plugin.fkspectra;

import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.pluginregistry.Plugin;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectra;
import gms.shared.waveform.coi.Waveform;
import java.util.Collection;
import java.util.List;

public interface FkSpectraPlugin extends Plugin {

  /**
   * Generates the results of an Fk Spectrum
   *
   * @param channelSegments Collection of {@link ChannelSegment} containing waveforms for an Fk
   *     Spectrum, not null
   * @param definition The Fk Spectrum definition identifying window lead and length, low/high
   *     frequencies, sample rate, etc. used by the Fk Spectrum plugin
   * @return Fk Spectrum results
   */
  List<FkSpectra> generateFk(
      Station station,
      Collection<ChannelSegment<Waveform>> channelSegments,
      FkSpectraDefinition definition);
}
