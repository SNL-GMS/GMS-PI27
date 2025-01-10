package gms.shared.frameworks.osd.repository;

import com.google.auto.value.AutoValue;
import gms.shared.frameworks.osd.api.OsdRepository;
import gms.shared.frameworks.osd.api.channel.ChannelRepository;
import gms.shared.frameworks.osd.api.station.StationGroupRepository;
import gms.shared.frameworks.osd.api.station.StationRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceChannelRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceNetworkRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceResponseRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSensorRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSiteRepository;
import gms.shared.frameworks.osd.api.stationreference.ReferenceStationRepository;
import gms.shared.frameworks.osd.api.stationreference.util.NetworkMembershipRequest;
import gms.shared.frameworks.osd.api.stationreference.util.ReferenceSiteMembershipRequest;
import gms.shared.frameworks.osd.api.stationreference.util.ReferenceStationMembershipRequest;
import gms.shared.frameworks.osd.api.util.ReferenceChannelRequest;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ReferenceChannel;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroupDefinition;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetwork;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetworkMembership;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceResponse;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSensor;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSite;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSiteMembership;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStation;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStationMembership;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@AutoValue
public abstract class DefaultOsdRepository implements OsdRepository {

  public abstract ChannelRepository getChannelRepository();

  public abstract ReferenceChannelRepository getReferenceChannelRepository();

  public abstract ReferenceNetworkRepository getReferenceNetworkRepository();

  public abstract ReferenceResponseRepository getReferenceResponseRepository();

  public abstract ReferenceSensorRepository getReferenceSensorRepository();

  public abstract ReferenceSiteRepository getReferenceSiteRepository();

  public abstract ReferenceStationRepository getReferenceStationRepository();

  public abstract StationGroupRepository getStationGroupRepository();

  public abstract StationRepository getStationRepository();

  public static DefaultOsdRepository from(
      ChannelRepository channelRepository,
      ReferenceChannelRepository referenceChannelRepository,
      ReferenceNetworkRepository referenceNetworkRepository,
      ReferenceResponseRepository referenceResponseRepository,
      ReferenceSensorRepository referenceSensorRepository,
      ReferenceSiteRepository referenceSiteRepository,
      ReferenceStationRepository referenceStationRepository,
      StationGroupRepository stationGroupRepository,
      StationRepository stationRepository) {
    return new AutoValue_DefaultOsdRepository.Builder()
        .setChannelRepository(channelRepository)
        .setReferenceChannelRepository(referenceChannelRepository)
        .setReferenceNetworkRepository(referenceNetworkRepository)
        .setReferenceResponseRepository(referenceResponseRepository)
        .setReferenceSensorRepository(referenceSensorRepository)
        .setReferenceSiteRepository(referenceSiteRepository)
        .setReferenceStationRepository(referenceStationRepository)
        .setStationGroupRepository(stationGroupRepository)
        .setStationRepository(stationRepository)
        .build();
  }

  public abstract Builder builder();

  @AutoValue.Builder
  public interface Builder {

    Builder setChannelRepository(ChannelRepository i);

    Builder setStationGroupRepository(StationGroupRepository i);

    Builder setStationRepository(StationRepository i);

    Builder setReferenceChannelRepository(ReferenceChannelRepository i);

    Builder setReferenceNetworkRepository(ReferenceNetworkRepository i);

    Builder setReferenceResponseRepository(ReferenceResponseRepository i);

    Builder setReferenceSensorRepository(ReferenceSensorRepository i);

    Builder setReferenceSiteRepository(ReferenceSiteRepository i);

    Builder setReferenceStationRepository(ReferenceStationRepository i);

    DefaultOsdRepository build();
  }

  @Override
  public List<Channel> retrieveChannels(Collection<String> channelIds) {
    return getChannelRepository().retrieveChannels(channelIds);
  }

  @Override
  public Set<String> storeChannels(Collection<Channel> channels) {
    return getChannelRepository().storeChannels(channels);
  }

  @Override
  public List<StationGroup> retrieveStationGroups(Collection<String> stationGroupNames) {
    return getStationGroupRepository().retrieveStationGroups(stationGroupNames);
  }

  @Override
  public void storeStationGroups(Collection<StationGroup> stationGroups) {
    getStationGroupRepository().storeStationGroups(stationGroups);
  }

  @Override
  public void updateStationGroups(Collection<StationGroupDefinition> stationGroupDefinitions) {
    getStationGroupRepository().updateStationGroups(stationGroupDefinitions);
  }

  @Override
  public List<Station> retrieveAllStations(Collection<String> stationNames) {
    return getStationRepository().retrieveAllStations(stationNames);
  }

  @Override
  public void storeStations(Collection<Station> stations) {
    getStationRepository().storeStations(stations);
  }

  @Override
  public List<ReferenceChannel> retrieveReferenceChannels(
      ReferenceChannelRequest referenceChannelRequest) {
    return getReferenceChannelRepository().retrieveReferenceChannels(referenceChannelRequest);
  }

  @Override
  public void storeReferenceChannels(Collection<ReferenceChannel> channels) {
    getReferenceChannelRepository().storeReferenceChannels(channels);
  }

  @Override
  public List<ReferenceNetwork> retrieveNetworks(Collection<UUID> networkIds) {
    return getReferenceNetworkRepository().retrieveNetworks(networkIds);
  }

  @Override
  public List<ReferenceNetwork> retrieveNetworksByName(List<String> names) {
    return getReferenceNetworkRepository().retrieveNetworksByName(names);
  }

  @Override
  public void storeReferenceNetwork(Collection<ReferenceNetwork> network) {
    getReferenceNetworkRepository().storeReferenceNetwork(network);
  }

  @Override
  public Map<UUID, List<ReferenceNetworkMembership>> retrieveNetworkMembershipsByNetworkId(
      Collection<UUID> networkIds) {
    return getReferenceNetworkRepository().retrieveNetworkMembershipsByNetworkId(networkIds);
  }

  @Override
  public Map<UUID, List<ReferenceNetworkMembership>> retrieveNetworkMembershipsByStationId(
      Collection<UUID> referenceStationIds) {
    return getReferenceNetworkRepository()
        .retrieveNetworkMembershipsByStationId(referenceStationIds);
  }

  @Override
  public List<ReferenceNetworkMembership> retrieveNetworkMembershipsByNetworkAndStationId(
      NetworkMembershipRequest request) {
    return getReferenceNetworkRepository().retrieveNetworkMembershipsByNetworkAndStationId(request);
  }

  @Override
  public void storeNetworkMemberships(Collection<ReferenceNetworkMembership> memberships) {
    getReferenceNetworkRepository().storeNetworkMemberships(memberships);
  }

  @Override
  public List<ReferenceResponse> retrieveReferenceResponses(Collection<String> channelNames) {
    return getReferenceResponseRepository().retrieveReferenceResponses(channelNames);
  }

  @Override
  public void storeReferenceResponses(Collection<ReferenceResponse> referenceResponses) {
    getReferenceResponseRepository().storeReferenceResponses(referenceResponses);
  }

  @Override
  public List<ReferenceSensor> retrieveReferenceSensorsById(Collection<UUID> sensorIds) {
    return getReferenceSensorRepository().retrieveReferenceSensorsById(sensorIds);
  }

  @Override
  public Map<String, List<ReferenceSensor>> retrieveSensorsByChannelName(
      Collection<String> channelNames) {
    return getReferenceSensorRepository().retrieveSensorsByChannelName(channelNames);
  }

  @Override
  public void storeReferenceSensors(Collection<ReferenceSensor> sensors) {
    getReferenceSensorRepository().storeReferenceSensors(sensors);
  }

  @Override
  public List<ReferenceSite> retrieveSites(List<UUID> entityIds) {
    return getReferenceSiteRepository().retrieveSites(entityIds);
  }

  @Override
  public List<ReferenceSite> retrieveSitesByName(List<String> names) {
    return getReferenceSiteRepository().retrieveSitesByName(names);
  }

  @Override
  public void storeReferenceSites(Collection<ReferenceSite> sites) {
    getReferenceSiteRepository().storeReferenceSites(sites);
  }

  @Override
  public Map<UUID, List<ReferenceSiteMembership>> retrieveSiteMembershipsBySiteId(
      List<UUID> siteIds) {
    return getReferenceSiteRepository().retrieveSiteMembershipsBySiteId(siteIds);
  }

  @Override
  public Map<String, List<ReferenceSiteMembership>> retrieveSiteMembershipsByChannelNames(
      List<String> channelNames) {
    return getReferenceSiteRepository().retrieveSiteMembershipsByChannelNames(channelNames);
  }

  @Override
  public List<ReferenceSiteMembership> retrieveSiteMembershipsBySiteIdAndChannelName(
      ReferenceSiteMembershipRequest request) {
    return getReferenceSiteRepository().retrieveSiteMembershipsBySiteIdAndChannelName(request);
  }

  @Override
  public void storeSiteMemberships(Collection<ReferenceSiteMembership> memberships) {
    getReferenceSiteRepository().storeSiteMemberships(memberships);
  }

  @Override
  public List<ReferenceStation> retrieveStations(List<UUID> entityIds) {
    return getReferenceStationRepository().retrieveStations(entityIds);
  }

  @Override
  public List<ReferenceStation> retrieveStationsByVersionIds(Collection<UUID> stationVersionIds) {
    return getReferenceStationRepository().retrieveStationsByVersionIds(stationVersionIds);
  }

  @Override
  public List<ReferenceStation> retrieveStationsByName(List<String> names) {
    return getReferenceStationRepository().retrieveStationsByName(names);
  }

  @Override
  public void storeReferenceStation(Collection<ReferenceStation> stations) {
    getReferenceStationRepository().storeReferenceStation(stations);
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMemberships(List<UUID> ids) {
    return getReferenceStationRepository().retrieveStationMemberships(ids);
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMembershipsByStationId(
      List<UUID> stationIds) {
    return getReferenceStationRepository().retrieveStationMembershipsByStationId(stationIds);
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMembershipsBySiteId(
      List<UUID> siteIds) {
    return getReferenceStationRepository().retrieveStationMembershipsBySiteId(siteIds);
  }

  @Override
  public List<ReferenceStationMembership> retrieveStationMembershipsByStationAndSiteId(
      ReferenceStationMembershipRequest request) {
    return getReferenceStationRepository().retrieveStationMembershipsByStationAndSiteId(request);
  }

  @Override
  public void storeStationMemberships(Collection<ReferenceStationMembership> memberships) {
    getReferenceStationRepository().storeStationMemberships(memberships);
  }
}
