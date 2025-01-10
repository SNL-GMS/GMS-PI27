package gms.shared.stationdefinition.converter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Component;

@Component
public class DaoStationGroupConverter implements StationGroupConverter {

  /**
   * Converts a NetworkKey pair and a list of {@link Station}s into {@link StationGroup}
   *
   * @param networkKey - pair containing network name and effective at time
   * @param networkDescription - network description for network
   * @param stationList - list of {@link Station}s
   * @return station group coi
   */
  @Override
  public StationGroup convert(
      Pair<String, Instant> networkKey, String networkDescription, List<Station> stationList) {

    Preconditions.checkNotNull(networkKey);

    String networkName = networkKey.getLeft();
    Instant networkEffectiveAt = networkKey.getRight();

    var stationGroupData =
        StationGroup.Data.builder()
            .setDescription(networkDescription)
            .setStations(stationList)
            .build();

    return StationGroup.builder()
        .setName(networkName)
        .setEffectiveAt(networkEffectiveAt)
        .setData(stationGroupData)
        .build();
  }

  @Override
  public StationGroup convert(
      Instant versionTime,
      Optional<Instant> effectiveUntil,
      NetworkDao network,
      List<Station> stations) {
    Preconditions.checkNotNull(network, "Network cannot be null for version time %s", versionTime);
    Preconditions.checkNotNull(
        stations, "Stations cannot be null for version time %s", versionTime);

    var stationGroupData =
        StationGroup.Data.builder()
            .setDescription(network.getDescription())
            .setStations(stations)
            .build();

    return StationGroup.builder()
        .setName(network.getNet())
        .setEffectiveAt(versionTime)
        .setEffectiveUntil(effectiveUntil)
        .setData(stationGroupData)
        .build();
  }
}
