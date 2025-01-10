package gms.shared.frameworks.osd.repository;

import gms.shared.frameworks.osd.repository.channel.ChannelRepositoryJpa;
import gms.shared.frameworks.osd.repository.station.StationGroupRepositoryJpa;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceChannelRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceNetworkRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceResponseRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceSensorRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceSiteRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.ReferenceStationRepositoryJpa;
import gms.shared.frameworks.osd.repository.utils.CoiEntityManagerFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class OsdRepositoryFactory {

  private static final Logger LOGGER = LoggerFactory.getLogger(OsdRepositoryFactory.class);

  private OsdRepositoryFactory() {}

  public static DefaultOsdRepository createOsdRepository(SystemConfig config) {
    var emf = CoiEntityManagerFactory.create(config);
    var elevEmf = CoiEntityManagerFactory.createElev(config);
    Runtime.getRuntime()
        .addShutdownHook(
            new Thread(
                () -> {
                  LOGGER.info("Shutting down EntityManagerFactories");
                  emf.close();
                  elevEmf.close();
                }));

    return DefaultOsdRepository.from(
        new ChannelRepositoryJpa(emf),
        new ReferenceChannelRepositoryJpa(emf),
        new ReferenceNetworkRepositoryJpa(emf),
        new ReferenceResponseRepositoryJpa(emf),
        new ReferenceSensorRepositoryJpa(emf),
        new ReferenceSiteRepositoryJpa(emf),
        new ReferenceStationRepositoryJpa(emf),
        new StationGroupRepositoryJpa(elevEmf),
        new StationRepositoryJpa(elevEmf));
  }
}
