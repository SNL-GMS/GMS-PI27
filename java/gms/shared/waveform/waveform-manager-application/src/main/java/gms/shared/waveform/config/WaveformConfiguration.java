package gms.shared.waveform.config;

import gms.shared.stationdefinition.cache.configuration.CacheAccessorConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@ComponentScan(
    basePackages = {
      "gms.shared.spring",
      "gms.shared.emf.qc",
      "gms.shared.stationdefinition",
      "gms.shared.event",
      "gms.shared.emf.staged",
      "gms.shared.signaldetection.repository",
      "gms.shared.signaldetection.accessor",
      "gms.shared.signaldetection.cache.util",
      "gms.shared.signalenhancementconfiguration.config",
      "gms.shared.signaldetection.database.connector.config",
      "gms.shared.event.accessor",
      "gms.shared.signalenhancementconfiguration.api.webclient.config"
    })
@Import(CacheAccessorConfiguration.class)
public class WaveformConfiguration {}
