package gms.shared.frameworks.osd.api;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.frameworks.osd.api.channel.ChannelRepository;
import gms.shared.frameworks.osd.api.station.StationGroupRepository;
import gms.shared.frameworks.osd.api.station.StationRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceChannelRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceNetworkRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceResponseRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSensorRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSiteRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceStationRepository;
import jakarta.ws.rs.Path;

/**
 * Interface for the GMS Object Storage and Distribution mechanism
 *
 * @deprecated PI26.6 This service path is removed from capability deployments
 */
@Deprecated(since = "PI26.6", forRemoval = true)
@Component("osd")
@Path("/frameworks-osd-service/osd")
public interface OsdRepository
    extends ChannelRepository,
        ReferenceChannelRepository,
        ReferenceNetworkRepository,
        ReferenceResponseRepository,
        ReferenceSensorRepository,
        ReferenceSiteRepository,
        ReferenceStationRepository,
        StationGroupRepository,
        StationRepository {}
