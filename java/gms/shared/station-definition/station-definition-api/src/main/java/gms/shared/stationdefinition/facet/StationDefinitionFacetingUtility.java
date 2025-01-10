package gms.shared.stationdefinition.facet;

import static com.google.common.base.Preconditions.checkState;
import static gms.shared.stationdefinition.facet.FacetingTypes.*;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/** Utility for building faceted StationGroup, Station, ChannelGroups, and Channels */
public final class StationDefinitionFacetingUtility {
  private final StationDefinitionAccessor stationDefinitionAccessor;

  private StationDefinitionFacetingUtility(StationDefinitionAccessor stationDefinitionAccessor) {
    this.stationDefinitionAccessor = stationDefinitionAccessor;
  }

  /**
   * Returns a new StationDefnitionFaceitngUtility that uses an accessor to retrieve data that is
   * not present
   *
   * @param stationDefinitionAccessor the {@link StationDefinitionAccessor} for * retrieving data
   *     not present
   * @return
   */
  public static StationDefinitionFacetingUtility create(
      StationDefinitionAccessor stationDefinitionAccessor) {
    Preconditions.checkNotNull(
        stationDefinitionAccessor,
        "StationDefinitionFacetingUtility must have a non-null StationDefinitionAccessor to"
            + " delegate to");
    return new StationDefinitionFacetingUtility(stationDefinitionAccessor);
  }

  /**
   * Generate a faceted {@link StationGroup}
   *
   * @param initial the {@link StationGroup} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet value
   * @param effectiveAt Instant for querying
   * @return a faceted {@link StationGroup}
   */
  public StationGroup populateFacets(
      StationGroup initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(facetingDefinition);
    Objects.requireNonNull(effectiveAt);
    checkState(facetingDefinition.getClassType().equals(STATION_GROUP_TYPE.getValue()));

    if (facetingDefinition.isPopulated()) {
      return getPopulatedStationGroup(initial, facetingDefinition, effectiveAt);
    } else {
      if (initial.getEffectiveAt().isPresent()) {
        return toVersionReference(initial);
      } else {
        return toVersionReference(initial.toBuilder().setEffectiveAt(effectiveAt).build());
      }
    }
  }

  /**
   * Generate a faceted {@link Station}
   *
   * @param initial the {@link Station} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet
   * @param effectiveAt the time for retrieving ata in the initial value
   * @return a faceted {@link Station}
   */
  public Station populateFacets(
      Station initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(facetingDefinition);
    Objects.requireNonNull(effectiveAt);
    checkState(facetingDefinition.getClassType().equals(STATION_TYPE.getValue()));

    if (facetingDefinition.isPopulated()) {
      return getPopulatedStation(initial, facetingDefinition, effectiveAt);
    } else {
      if (initial.getEffectiveAt().isPresent()) {
        return toVersionReference(initial);
      } else {
        return toVersionReference(initial.toBuilder().setEffectiveAt(effectiveAt).build());
      }
    }
  }

  /**
   * Generate a faceted {@link ChannelGroup}
   *
   * @param initial the {@link ChannelGroup} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet
   * @param effectiveAt the effective time used to retrieve data value
   * @return a faceted {@link ChannelGroup}
   */
  public ChannelGroup populateFacets(
      ChannelGroup initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(facetingDefinition);
    Objects.requireNonNull(effectiveAt);
    checkState(facetingDefinition.getClassType().equals(CHANNEL_GROUP_TYPE.getValue()));

    if (facetingDefinition.isPopulated()) {
      return getPopulatedChannelGroup(initial, facetingDefinition, effectiveAt);
    } else {
      if (initial.getEffectiveAt().isPresent()) {
        return toVersionReference(initial);
      } else {
        return toVersionReference(initial.toBuilder().setEffectiveAt(effectiveAt).build());
      }
    }
  }

  /**
   * Generate a faceted {@link Channel}
   *
   * @param initial the {@link Channel} to facet
   * @param facetingDefinition the {@link FacetingDefinition} defining the fields to facet value
   * @param effectiveAt the effective time used to retrieve data
   * @return a faceted {@link Channel}
   */
  public Channel populateFacets(
      Channel initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(effectiveAt);
    Objects.requireNonNull(facetingDefinition);
    checkState(facetingDefinition.getClassType().equals(CHANNEL_TYPE.getValue()));

    if (facetingDefinition.isPopulated()) {
      return getPopulatedChannel(initial, facetingDefinition, effectiveAt);
    } else {
      if (initial.getEffectiveAt().isPresent()) {
        return toVersionReference(initial);
      } else {
        return toVersionReference(initial.toBuilder().setEffectiveAt(effectiveAt).build());
      }
    }
  }

  /**
   * Generate a faceted {@link Response}
   *
   * @param initial the initial {@link Response}
   * @param facetingDefinition the {@link FacetingDefinition} defining how to facet the {@link
   *     Response}
   * @param effectiveAt the effective time used to retrieve additional data
   * @return a faceted {@link Response}
   */
  public Response populateFacets(
      Response initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(facetingDefinition);
    Objects.requireNonNull(effectiveAt);
    Preconditions.checkState(facetingDefinition.getClassType().equals(RESPONSE_TYPE.getValue()));

    if (facetingDefinition.isPopulated()) {
      return getPopulatedResponse(initial, facetingDefinition, effectiveAt);
    } else {
      if (initial.getEffectiveAt().isPresent()) {
        return Response.createVersionReference(initial);
      } else {
        return Response.createVersionReference(initial.getId(), effectiveAt);
      }
    }
  }

  /**
   * Generates a faceted {@link FrequencyAmplitudePhase}
   *
   * @param initial the initial {@link FrequencyAmplitudePhase}
   * @param facetingDefinition the {@link FacetingDefinition} defining how to facet the {@link
   *     FrequencyAmplitudePhase}
   * @param effectiveAt the effective time for the populated {@link FrequencyAmplitudePhase}; not
   *     currently used
   * @return a {@link FrequencyAmplitudePhase}, populated if the {@link FacetingDefinition} is
   *     populated, otherwise an entity reference
   */
  public FrequencyAmplitudePhase populateFacets(
      FrequencyAmplitudePhase initial, FacetingDefinition facetingDefinition, Instant effectiveAt) {

    Objects.requireNonNull(initial);
    Objects.requireNonNull(facetingDefinition);
    Objects.requireNonNull(effectiveAt);
    Preconditions.checkState(
        facetingDefinition.getClassType().equals(FREQUENCY_AMPLITUDE_PHASE_TYPE.getValue()));

    var uuid = initial.getId();

    if (facetingDefinition.isPopulated()) {
      if (initial.isPresent()) {
        return initial;
      } else {
        return stationDefinitionAccessor.findFrequencyAmplitudePhaseById(uuid);
      }
    } else {
      return FrequencyAmplitudePhase.createEntityReference(uuid);
    }
  }

  /**
   * Populate the {@link StationGroup} and check lower level {@link Station}s
   *
   * @param initial Initial StationGroup to populate
   * @param facetingDefinition {@link FacetingDefinition} for the StationGroup
   * @param effectiveTime Instant for querying stations
   * @return populated {@link StationGroup}
   */
  private StationGroup getPopulatedStationGroup(
      StationGroup initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    final var stationFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(STATIONS_KEY.getValue());
    final var data = initial.getData().orElseThrow();

    Collection<Station> stationList = data.getStations();

    // if Station faceting definition is defined, then populate the children accordingly
    if (stationFacetingDefinition.isPresent()) {
      stationList =
          stationList.stream()
              .map(c -> populateFacets(c, stationFacetingDefinition.get(), effectiveTime))
              .filter(Objects::nonNull)
              .toList();
    }

    if (stationList.isEmpty()) {
      return null;
    } else {
      return initial.toBuilder().setData(data.toBuilder().setStations(stationList).build()).build();
    }
  }

  /**
   * Populate the {@link Station} and check lower level {@link ChannelGroup}s and {@link Channel}s
   *
   * @param initial initial {@link Station} to populate
   * @param facetingDefinition {@link FacetingDefinition} for Station
   * @param effectiveTime Instant for querying
   * @return populated {@link Station}
   */
  private Station getPopulatedStation(
      Station initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    Station populatedStation;

    if (initial.isPresent()) {
      // Station is populated but need to check the ChannelGroup and Channel FacetingDefinitions
      populatedStation =
          populateChannelGroupsAndChannels(initial, facetingDefinition, effectiveTime);
    } else {

      // Query for populated Station then check the ChannelGroup and Channel FacetingDefinitions
      List<Station> populatedStations =
          stationDefinitionAccessor.findStationsByNameAndTime(
              List.of(initial.getName()), effectiveTime);

      populatedStation =
          populatedStations.isEmpty()
              ? null
              : populateChannelGroupsAndChannels(
                  populatedStations.get(0), facetingDefinition, effectiveTime);
    }

    return populatedStation;
  }

  /**
   * Populate the {@link ChannelGroup} and check lower level {@link Channel}s
   *
   * @param initial {@link ChannelGroup} to populate
   * @param facetingDefinition {@link FacetingDefinition} for population
   * @param effectiveTime Instant to query
   * @return populated {@link ChannelGroup}
   */
  private ChannelGroup getPopulatedChannelGroup(
      ChannelGroup initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    ChannelGroup populatedChannelGroup;

    if (initial.isPresent()) {
      // ChannelGroup is populated but need to check the Channel FacetingDefinitions
      populatedChannelGroup = populateChannels(initial, facetingDefinition, effectiveTime);
    } else {

      // Query for populated ChannelGroup then check the Channel FacetingDefinitions
      List<ChannelGroup> populatedChannelGroups =
          stationDefinitionAccessor.findChannelGroupsByNameAndTime(
              List.of(initial.getName()), effectiveTime);

      populatedChannelGroup =
          populatedChannelGroups.isEmpty()
              ? null
              : populateChannels(populatedChannelGroups.get(0), facetingDefinition, effectiveTime);
    }

    return populatedChannelGroup;
  }

  /**
   * Populate the {@link Channel} and check lower level {@link Response}s
   *
   * @param initial {@link Channel} to populate
   * @param facetingDefinition {@link FacetingDefinition} for population
   * @param effectiveTime Instant to query
   * @return populated {@link Channel}
   */
  private Channel getPopulatedChannel(
      Channel initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    Channel populatedChannel;

    if (initial.isPresent()) {
      // Channel is populated but need to check the Response FacetingDefinitions
      populatedChannel = populateResponses(initial, facetingDefinition, effectiveTime);
    } else {
      // Query for the populated Channel then check the Response FacetingDefinitions
      List<Channel> populatedChannels =
          stationDefinitionAccessor.findChannelsByNameAndTime(
              List.of(initial.getName()), effectiveTime);

      populatedChannel =
          populatedChannels.isEmpty()
              ? null
              : populateResponses(populatedChannels.get(0), facetingDefinition, effectiveTime);
    }

    return populatedChannel;
  }

  /**
   * Populate the {@link Response} and check lower level {@link FrequencyAmplitudePhase}
   *
   * @param initial the initial {@link Response} (can be empty)
   * @param facetingDefinition the {@link FacetingDefinition} to be applied (should be at the
   *     Response level)
   * @param effectiveAt the Instant to query
   * @return
   */
  private Response getPopulatedResponse(
      Response initial, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    Response populatedResponse;

    if (initial.isPresent()) {
      // Response is populated; populate FAP according to definition
      populatedResponse =
          populateFrequencyAmplitudePhase(initial, facetingDefinition, effectiveTime);
    } else {
      // Get populated response, then populate FAP
      List<Response> populatedResponses =
          stationDefinitionAccessor.findResponsesById(List.of(initial.getId()), effectiveTime);
      populatedResponse =
          populatedResponses.isEmpty()
              ? null
              : populateFrequencyAmplitudePhase(
                  populatedResponses.get(0), facetingDefinition, effectiveTime);
    }

    return populatedResponse;
  }

  /**
   * Method to populate nested {@link ChannelGroup}s and {@link Channel}s for the given {@link
   * Station}
   *
   * @param station - initial populated {@link Station}
   * @param effectiveTime - effective time Instant
   * @param facetingDefinition - Station {@link FacetingDefinition}
   * @return {@link Station}
   */
  private Station populateChannelGroupsAndChannels(
      Station station, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    final var channelGroupFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(CHANNEL_GROUPS_KEY.getValue());
    final var channelFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(CHANNELS_KEY.getValue());

    final var data = station.getData().orElseThrow();

    Collection<ChannelGroup> channelGroupList = data.getChannelGroups();
    Collection<Channel> channelList = data.getAllRawChannels();

    // if ChannelGroup faceting definition is defined, then populate the facets
    if (channelGroupFacetingDefinition.isPresent()) {

      // populate the channel group facets accordingly
      channelGroupList =
          channelGroupList.stream()
              .map(c -> populateFacets(c, channelGroupFacetingDefinition.get(), effectiveTime))
              .filter(Objects::nonNull)
              .toList();
    }

    // if Channel faceting definition is defined, then populate the facets
    if (channelFacetingDefinition.isPresent()) {
      // populate the channel facets accordingly
      channelList =
          channelList.stream()
              .map(c -> populateFacets(c, channelFacetingDefinition.get(), effectiveTime))
              .filter(Objects::nonNull)
              .toList();
    }
    // if we are populating channel groups, we need to be sure that the list of channels represented
    // in channel groups
    // and the list of channels in the allRawChannels collection are the same.
    // If we are not populating channel groups, we will not modify the allRawChannels collection
    List<Channel> expectedChannels;
    if (channelGroupFacetingDefinition.isPresent()
        && channelGroupFacetingDefinition.get().isPopulated()) {
      Collection<Channel> channelGroupChannels =
          channelGroupList.stream()
              .map(ChannelGroup::getChannels)
              .flatMap(Set::stream)
              .map(Channel::toEntityReference)
              .toList();
      expectedChannels =
          channelList.stream()
              .filter(channel -> containsChannelEntity(channel, channelGroupChannels))
              .filter(channel -> channelGroupChannels.contains(channel.toEntityReference()))
              .toList();
    } else {
      expectedChannels = channelList.stream().map(Channel::toEntityReference).toList();
    }

    // Build up the new channel group with the filtered channels
    Collection<ChannelGroup> updatedChannelGroups =
        channelGroupList.stream()
            .map(
                (ChannelGroup channelGroup) -> {
                  if (channelGroup.isPresent()) {
                    return updateChannelGroup(channelGroup, expectedChannels);
                  } else {
                    return channelGroup;
                  }
                })
            .filter(Objects::nonNull)
            .toList();

    List<Channel> updatedChannels =
        channelList.stream()
            .filter(channel -> containsChannelEntity(channel, expectedChannels))
            .toList();

    List<Channel> expectedChannelEntities =
        expectedChannels.stream().map(Channel::toEntityReference).toList();
    List<RelativePositionChannelPair> updatedRelativePositionChannelPairs =
        station.getRelativePositionChannelPairs().stream()
            .filter(pair -> expectedChannelEntities.contains(pair.getChannel().toEntityReference()))
            .toList();

    if (updatedChannels.isEmpty() || updatedChannelGroups.isEmpty()) {
      return null;
    } else {
      return station.toBuilder()
          .setData(
              data.toBuilder()
                  .setAllRawChannels(updatedChannels)
                  .setChannelGroups(updatedChannelGroups)
                  .setRelativePositionChannelPairs(updatedRelativePositionChannelPairs)
                  .build())
          .build();
    }
  }

  private static ChannelGroup updateChannelGroup(
      ChannelGroup channelGroup, List<Channel> expectedChannels) {
    List<Channel> filteredChannels =
        channelGroup.getChannels().stream()
            .filter(channel -> containsChannelEntity(channel, expectedChannels))
            .toList();

    // Create the ChannelGroup.Data
    if (filteredChannels.isEmpty()) {
      return null;
    } else {
      final var newGroupData =
          ChannelGroup.Data.builder()
              .setDescription(channelGroup.getDescription())
              .setLocation(channelGroup.getLocation().orElseThrow())
              .setEffectiveUntil(channelGroup.getEffectiveUntil())
              .setType(channelGroup.getType())
              .setChannels(filteredChannels)
              .build();

      // Update the ChannelGroup main object
      return ChannelGroup.builder()
          .setName(channelGroup.getName())
          .setEffectiveAt(channelGroup.getEffectiveAt())
          .setData(newGroupData)
          .build();
    }
  }

  /**
   * Populate the nested {@link Channel}s within the given {@link ChannelGroup} according to the
   * {@link FacetingDefinition}
   *
   * @param channelGroup - input ChannelGroup
   * @param facetingDefinition - ChannelGroup FacetingDefinition
   * @param effectiveTime - Instant to query
   * @return {@link ChannelGroup}
   */
  private ChannelGroup populateChannels(
      ChannelGroup channelGroup, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    final var channelFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(CHANNELS_KEY.getValue());

    final var data = channelGroup.getData().orElseThrow();
    Collection<Channel> channelList = data.getChannels();

    // if Channel faceting definition is defined, then populate the facets
    if (channelFacetingDefinition.isPresent()) {
      channelList =
          channelList.stream()
              .map(c -> populateFacets(c, channelFacetingDefinition.get(), effectiveTime))
              .filter(Objects::nonNull)
              .toList();
    }

    return channelList.isEmpty()
        ? null
        : channelGroup.toBuilder()
            .setData(data.toBuilder().setChannels(channelList).build())
            .build();
  }

  /**
   * Populate the nested {@link Response}s within the given {@link Channel} according to the {@link
   * FacetingDefinition}
   *
   * @param channel - input Channel
   * @param facetingDefinition - Channel {@link FacetingDefinition}
   * @param effectiveTime - Instant to query
   * @return {@link Channel}
   */
  private Channel populateResponses(
      Channel channel, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    final var responseFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(RESPONSES_KEY.getValue());

    final var data = channel.getData().orElseThrow();
    if (data.getResponse().isEmpty()) {
      return channel;
    }

    var response =
        data.getResponse().orElseThrow(() -> new IllegalArgumentException("No Response present"));

    // if Response faceting definition is defined, then populate the facets
    if (responseFacetingDefinition.isPresent()) {
      response = populateFacets(response, responseFacetingDefinition.get(), effectiveTime);
    }

    return response != null
        ? channel.toBuilder().setData(data.toBuilder().setResponse(response).build()).build()
        : null;
  }

  /**
   * Populate the nested {@link FrequencyAmplitudePhase} within the given {@link Response} according
   * to the {@link FacetingDefinition}
   *
   * @param response the input {@link Response}
   * @param facetingDefinition the Response {@link FacetingDefinition}
   * @param effectiveTime the {@link Instant} to query
   * @return the populated {@link Response}
   */
  private Response populateFrequencyAmplitudePhase(
      Response response, FacetingDefinition facetingDefinition, Instant effectiveTime) {

    final var fapFacetingDefinition =
        facetingDefinition.getFacetingDefinitionByName(FREQUENCY_AMPLITUDE_PHASE_KEY.getValue());

    final var data = response.getData().orElseThrow();

    var fap = data.getFapResponse();

    if (fapFacetingDefinition.isPresent()) {
      fap = populateFacets(fap, fapFacetingDefinition.get(), effectiveTime);
    }

    return fap != null
        ? response.toBuilder().setData(data.toBuilder().setFapResponse(fap).build()).build()
        : null;
  }

  private static StationGroup toVersionReference(StationGroup initial) {
    if (initial.isPresent()) {
      return StationGroup.createVersionReference(
          initial.getName(), initial.getEffectiveAt().orElseThrow());
    } else {
      return initial;
    }
  }

  private static Station toVersionReference(Station initial) {
    if (initial.isPresent()) {
      return Station.createVersionReference(
          initial.getName(), initial.getEffectiveAt().orElseThrow());
    } else {
      return initial;
    }
  }

  private static ChannelGroup toVersionReference(ChannelGroup initial) {
    if (initial.isPresent()) {
      return ChannelGroup.createVersionReference(
          initial.getName(), initial.getEffectiveAt().orElseThrow());
    } else {
      return initial;
    }
  }

  private static Channel toVersionReference(Channel initial) {
    if (initial.isPresent()) {
      return Channel.createVersionReference(
          initial.getName(), initial.getEffectiveAt().orElseThrow());
    } else {
      return initial;
    }
  }

  private static boolean containsChannelEntity(Channel channel, Collection<Channel> channelList) {
    return channelList.stream()
        .map(Channel::toEntityReference)
        .toList()
        .contains(channel.toEntityReference());
  }
}
