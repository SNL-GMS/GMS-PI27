package gms.shared.event.accessor.facet;

import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Provides configured beans for autowiring in the {@link EventFacetingUtility} */
@Configuration
public class FacetingUtilityConfiguration {

  @Autowired
  @Bean
  public StationDefinitionFacetingUtility stationDefinitionFacetingUtility(
      @Qualifier("defaultStationDefinitionAccessor") StationDefinitionAccessor stationDefinitionAccessorImpl) {
    return StationDefinitionFacetingUtility.create(stationDefinitionAccessorImpl);
  }

  @Autowired
  @Bean
  public SignalDetectionFacetingUtility signalDetectionFacetingUtility(
      @Qualifier("bridgedSignalDetectionAccessor") SignalDetectionAccessor signalDetectionAccessor,
      WaveformAccessor waveformAccessor,
      @Qualifier("defaultStationDefinitionAccessor") StationDefinitionAccessor stationDefinitionAccessorImpl,
      StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {

    return SignalDetectionFacetingUtility.create(
        signalDetectionAccessor,
        new WaveformFacetingUtility(waveformAccessor, stationDefinitionAccessorImpl),
        stationDefinitionFacetingUtility);
  }
}
