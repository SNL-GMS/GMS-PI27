package gms.shared.stationdefinition.repository.util;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Preconditions.checkState;

import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.BeamSummation;
import gms.shared.derivedchannel.coi.BeamDefinition;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelNameUtilities;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.filter.CascadeFilterDescription;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.FilterDescription;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.FieldMapUtilities;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.enums.ChannelType;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility to create {@link Channel}s */
public final class ChannelFactory {

  private static final Logger LOGGER = LoggerFactory.getLogger(ChannelFactory.class);
  private static final double NINETY_DEGREES = 90.0;
  private static final double ZERO_DEGREES = 0.0;

  private ChannelFactory() {
    // Hide implicit public constructor
  }

  /**
   * Creates an FK {@link Channel} from a list of input {@link Channel}s from a given {@link
   * Station} based on an {@link FkSpectraDefinition}
   *
   * @param station a non-null, fully-populated {@link Station}
   * @param inputChannels a non-null, non-empty list of populated input {@link Channel}s
   * @param fkSpectraDefinition the non-null {@link FkSpectraDefinition} to be applied
   * @return the derived FK {@link Channel}
   */
  public static Channel createFkChannel(
      Station station, List<Channel> inputChannels, FkSpectraDefinition fkSpectraDefinition) {
    checkNotNull(station, "Cannot create FK Channel from null Station");
    checkNotNull(inputChannels, "Cannot create FK Channel from null input Channels");
    checkNotNull(fkSpectraDefinition, "Cannot create FK Channel from null FkSpectraDefinition");
    checkArgument(station.isPresent(), "Cannot create FK Channel from faceted Station");
    checkArgument(!inputChannels.isEmpty(), "Cannot create FK Channel from empty input Channels");

    List<Channel> populatedChannels = inputChannels.stream().filter(Channel::isPresent).toList();

    checkState(
        populatedChannels.size() == inputChannels.size(),
        "Cannot create FK Channel from faceted input Channels");
    List<String> stationNames =
        populatedChannels.stream()
            .map(Channel::getData)
            .flatMap(Optional::stream)
            .map(Channel.Data::getStation)
            .map(Station::getName)
            .filter(stationName -> !stationName.equals(station.getName()))
            .distinct()
            .toList();

    checkState(
        stationNames.isEmpty(), "Cannot create FK Channel from Channels from multiple Stations");

    var baseChannel = populatedChannels.get(0);
    var data = baseChannel.getData().orElseThrow();

    List<Channel> configuredInputs =
        populatedChannels.stream().map(Channel::toEntityReference).toList();

    Map<ChannelProcessingMetadataType, Object> metadata =
        new EnumMap<>(ChannelProcessingMetadataType.class);
    metadata.putAll(metadata);
    metadata.put(ChannelProcessingMetadataType.CHANNEL_GROUP, "fk");

    var orientationType = data.getChannelOrientationType();

    Orientation orientation;

    if (orientationType == ChannelOrientationType.VERTICAL) {
      // once that change is made, the horizontal angle for this case should be an emtpy optional
      orientation = Orientation.from(Optional.of(Double.NaN), Optional.of(ZERO_DEGREES));
    } else if (orientationType == ChannelOrientationType.NORTH_SOUTH) {
      orientation = Orientation.from(Optional.of(ZERO_DEGREES), Optional.of(NINETY_DEGREES));
    } else if (orientationType == ChannelOrientationType.EAST_WEST) {
      orientation = Orientation.from(Optional.of(NINETY_DEGREES), Optional.of(NINETY_DEGREES));
    } else {
      orientation = Orientation.from(Optional.of(Double.NaN), Optional.of(Double.NaN));
    }

    Optional<Instant> possibleEffectiveAt =
        inputChannels.stream()
            .map(Channel::getEffectiveAt)
            .flatMap(Optional::stream)
            .max(Instant::compareTo);

    // Previous checks guarantee that all channels will have an effectiveAt
    Instant effectiveAt = possibleEffectiveAt.orElse(null);

    Optional<Instant> possibleEffectiveUntil =
        inputChannels.stream()
            .map(Channel::getEffectiveUntil)
            .flatMap(Optional::stream)
            .min(Instant::compareTo);

    var updatedData =
        data.toBuilder()
            .setStation(station.toEntityReference())
            .setNominalSampleRateHz(fkSpectraDefinition.getSampleRateHz())
            .setConfiguredInputs(configuredInputs)
            .setLocation(station.getLocation())
            .setUnits(Units.NANOMETERS_SQUARED_PER_SECOND)
            .setProcessingMetadata(metadata)
            .setOrientationAngles(orientation)
            .setEffectiveUntil(possibleEffectiveUntil)
            .setResponse(Optional.empty())
            .build();

    Channel derived =
        baseChannel.toBuilder().setEffectiveAt(effectiveAt).setData(updatedData).build();

    String name = ChannelNameUtilities.createName(derived);
    return derived.toBuilder().setName(name).build();
  }

  /**
   * Augments a {@link Channel} with information from fields in a {@link FilterDefinition}.
   *
   * @param inputChannel the non-null starting {@link Channel} with populated data
   * @param filterDefinition a non-null {@link FilterDefinition} to be applied to the starting
   *     {@link Channel}
   * @return a filtered derived (@link Channel}
   */
  public static Channel createFiltered(Channel inputChannel, FilterDefinition filterDefinition) {

    checkNotNull(inputChannel, "Cannot create a filtered channel from a null input channel");
    checkNotNull(
        filterDefinition, "Cannot create a filtered channel from a null filter definition");
    checkState(
        inputChannel.getData().isPresent(),
        "Cannot create a derived channel unless the input channel has data");

    var updatedDescription = createUpdatedFilteredDescription(inputChannel, filterDefinition);

    var undesignedFilterDefinition =
        FilterDefinition.from(
            filterDefinition.getName(),
            filterDefinition.getComments(),
            createUndesignedFilterDescription(filterDefinition.getFilterDescription()));
    var processingDefinitionFieldMap = FieldMapUtilities.toFieldMap(undesignedFilterDefinition);

    var updatedProcessingMetadata = updateProcessingMetadata(inputChannel, filterDefinition);

    // inputChannel is guaranteed to have data based on the precondition check
    var updatedData =
        inputChannel.getData().orElseThrow().toBuilder()
            .setConfiguredInputs(List.of(Channel.createVersionReference(inputChannel)))
            .setDescription(updatedDescription)
            .setProcessingDefinition(processingDefinitionFieldMap)
            .setProcessingMetadata(updatedProcessingMetadata)
            .setResponse(Optional.empty())
            .build();

    var updatedChannel = inputChannel.toBuilder().setData(updatedData).build();

    String attribute =
        "filter," + filterDefinition.getName().replace(Channel.COMPONENT_SEPARATOR, "|");
    String derivedChannelName =
        ChannelNameUtilities.appendProcessingAttribute(updatedChannel, attribute);

    var finalData = updatedData.toBuilder().setCanonicalName(derivedChannelName).build();

    return updatedChannel.toBuilder().setData(finalData).setName(derivedChannelName).build();
  }

  /**
   * Creates a derived, masked {@link Channel} by applying a {@link ProcessingMaskDefinition} to a
   * raw input {@link Channel}
   *
   * @param inputChannel the non-null raw {@link Channel} to be masked
   * @param processingMaskDefinition the non-null {@link ProcessingMaskDefinition} to be applied
   * @return the derived, masked {@link Channel}
   */
  public static Channel createMasked(
      Channel inputChannel, ProcessingMaskDefinition processingMaskDefinition) {

    checkNotNull(inputChannel, "Cannot create a masked channel from a null input channel");
    checkNotNull(
        processingMaskDefinition,
        "Cannot create a masked channel from a null processing mask definition");
    checkState(
        inputChannel.getData().isPresent(),
        "Cannot create a masked channel unless the input channel has data");

    var configuredInputs = List.of(Channel.createVersionReference(inputChannel));
    var updatedDescription =
        new StringBuilder(inputChannel.getDescription())
            .append(Channel.DESCRIPTION_SEPARATOR)
            .append("Masked samples removed.")
            .toString();
    var fieldMapPmd = FieldMapUtilities.toFieldMap(processingMaskDefinition);

    // inputChannel is guaranteed to have data based on the precondition check
    var updatedData =
        inputChannel.getData().orElseThrow().toBuilder()
            .setConfiguredInputs(configuredInputs)
            .setDescription(updatedDescription)
            .setProcessingDefinition(fieldMapPmd)
            .setResponse(Optional.empty())
            .build();

    var updatedChannel = inputChannel.toBuilder().setData(updatedData).build();

    String derivedChannelName =
        ChannelNameUtilities.appendProcessingAttribute(updatedChannel, "masked");

    var finalData = updatedData.toBuilder().setCanonicalName(derivedChannelName).build();

    return updatedChannel.toBuilder().setName(derivedChannelName).setData(finalData).build();
  }

  /**
   * Creates a derived, beamed {@link Channel} by applying a {@link BeamDefinition} to a list of
   * populated input {@link Channel}s
   *
   * @param inputChannels a non-null, non-empty list of populated input {@link Channel}s
   * @param beamDefinition the non-null {@link BeamDefinition} to be applied
   * @param assocRecordPair assoc record pair (record type and record id)
   * @return the derived, beamed {@link Channel}
   */
  public static Optional<Channel> createBeamed(
      List<Channel> inputChannels,
      BeamDefinition beamDefinition,
      Pair<TagName, Long> assocRecordPair) {
    checkNotNull(inputChannels, "Cannot create Beamed Channel from null input Channels");
    checkArgument(
        !inputChannels.isEmpty(), "Cannot create Beamed Channel from empty input Channels");
    checkNotNull(beamDefinition, "Cannot create a Beamed Channel from a null beam definition");
    checkState(inputChannels.size() > 1, "Cannot create Beamed Channel from a single channel");
    checkNotNull(assocRecordPair, "Cannot create Beamed Channel from null assoc record pair");

    List<Channel> populatedChannels = inputChannels.stream().filter(Channel::isPresent).toList();

    checkState(
        inputChannels.stream().allMatch(Channel::isPresent),
        "Cannot create Beamed Channel from faceted input Channels");

    var baseChannel = populatedChannels.get(0);
    var data = baseChannel.getData().orElseThrow();
    var stationName = data.getStation().getName();

    checkState(
        populatedChannels.stream()
            .map(Channel::getData)
            .flatMap(Optional::stream)
            .map(Channel.Data::getStation)
            .allMatch(station -> station.getName().equals(stationName)),
        "Cannot create Beamed Channel from Channels from multiple Stations");

    var updatedDescription =
        createUpdatedBeamedDescription(
            populatedChannels, beamDefinition, baseChannel.getStation().getName());

    var configuredInputs = List.of(Channel.createVersionReference(baseChannel));

    Map<ChannelProcessingMetadataType, Object> updateProcessingMetadata =
        updateProcessingMetadata(baseChannel, beamDefinition);

    var bridgedAssocRecordString =
        "/bridged," + assocRecordPair.getLeft() + ":" + assocRecordPair.getRight();
    updateProcessingMetadata.put(ChannelProcessingMetadataType.CHANNEL_GROUP, "beam");
    updateProcessingMetadata.put(ChannelProcessingMetadataType.BRIDGED, bridgedAssocRecordString);

    var processingDefinitionFieldMap = FieldMapUtilities.toFieldMap(beamDefinition);

    Optional<Instant> possibleEffectiveAt =
        inputChannels.stream()
            .map(Channel::getEffectiveAt)
            .flatMap(Optional::stream)
            .max(Instant::compareTo);

    Instant effectiveAt = possibleEffectiveAt.orElse(null);

    Optional<Instant> possibleEffectiveUntil =
        inputChannels.stream()
            .map(Channel::getEffectiveUntil)
            .flatMap(Optional::stream)
            .min(Instant::compareTo);

    var updatedData =
        data.toBuilder()
            .setNominalSampleRateHz(beamDefinition.getBeamParameters().getSampleRateHz())
            .setConfiguredInputs(configuredInputs)
            .setDescription(updatedDescription)
            .setProcessingMetadata(updateProcessingMetadata)
            .setProcessingDefinition(processingDefinitionFieldMap)
            .setOrientationAngles(beamDefinition.getBeamParameters().getOrientationAngles())
            .setEffectiveUntil(possibleEffectiveUntil)
            .setResponse(Optional.empty())
            .build();

    // create the beamed channel with updated name and data
    var beamed = baseChannel.toBuilder().setEffectiveAt(effectiveAt).setData(updatedData).build();
    var name = ChannelNameUtilities.createName(beamed);

    // update the final data with new canonical name
    var finalData = updatedData.toBuilder().setCanonicalName(name).build();

    Channel build = beamed.toBuilder().setName(name).setData(finalData).build();

    return Optional.of(build);
  }

  /**
   * Creates an undesigned {@link FilterDescription} from the provided {@link FilterDescription} by
   * copying all attributes except for the filter parameters.
   *
   * <p>Cascade filters have each of their component descriptions recursively converted to
   * undesigned descriptions.
   *
   * @param filterDefinition a non-null Linear or Cascade {@link FilterDefinition}
   * @return the undesigned {@link FilterDefintion}, or the original filterDefinition if it was of
   *     an unknown type
   */
  private static FilterDescription createUndesignedFilterDescription(
      FilterDescription filterDescription) {

    FilterDescription undesignedFilterDescription;

    if (filterDescription instanceof LinearFilterDescription lfd) {
      undesignedFilterDescription =
          LinearFilterDescription.from(
              lfd.getComments(),
              lfd.getResponse(),
              lfd.isCausal(),
              lfd.getFilterType(),
              lfd.getLowFrequencyHz(),
              lfd.getHighFrequencyHz(),
              lfd.getOrder(),
              lfd.isZeroPhase(),
              lfd.getPassBandType(),
              lfd.getLinearFilterType(),
              Optional.empty());
    } else if (filterDescription instanceof CascadeFilterDescription cfd) {
      var componentFilterDescriptions = cfd.getFilterDescriptions();
      List<FilterDescription> undesignedComponents = new ArrayList<>();
      for (var componentFD : componentFilterDescriptions) {
        undesignedComponents.add(createUndesignedFilterDescription(componentFD));
      }
      undesignedFilterDescription =
          CascadeFilterDescription.from(
              cfd.getComments(),
              cfd.getResponse(),
              ImmutableList.copyOf(undesignedComponents),
              Optional.empty());
    } else {
      // filterDescription is never null due to the Precondition check
      var className = filterDescription.getClass().getSimpleName();
      LOGGER.warn(
          "Encountered unknown FilterDescription type: '{}'. Description left unmodified.",
          className);
      undesignedFilterDescription = filterDescription;
    }
    return undesignedFilterDescription;
  }

  private static Map<ChannelProcessingMetadataType, Object> updateProcessingMetadata(
      Channel inputChannel, FilterDefinition filterDefinition) {

    var updatedMap = new EnumMap<>(inputChannel.getProcessingMetadata());

    updatedMap.put(
        ChannelProcessingMetadataType.FILTER_TYPE,
        filterDefinition.getFilterDescription().getFilterType());
    updatedMap.put(
        ChannelProcessingMetadataType.FILTER_CAUSALITY,
        filterDefinition.getFilterDescription().isCausal());

    return updatedMap;
  }

  private static String createUpdatedFilteredDescription(
      Channel inputChannel, FilterDefinition filterDefinition) {
    return new StringBuilder(inputChannel.getDescription())
        .append(Channel.DESCRIPTION_SEPARATOR)
        .append("Filtered using a ")
        .append(filterDefinition.getName())
        .append(" filter.")
        .toString();
  }

  private static String createUpdatedBeamedDescription(
      List<Channel> populatedChannels, BeamDefinition beamDefinition, String stationName) {
    var description = new StringBuilder();
    var beamDescription = beamDefinition.getBeamDescription();
    var beamParameters = beamDefinition.getBeamParameters();

    String id;
    var ehOptional = beamParameters.getEventHypothesis();
    var sdhOptional = beamParameters.getSignalDetectionHypothesis();
    if (ehOptional.isPresent()) {
      var eh = ehOptional.get();
      id = "event " + eh.getId().getEventId().toString();
    } else if (sdhOptional.isPresent()) {
      var sdh = sdhOptional.get();
      id = "signal detection hypothesis " + sdh.getId().toString();
    } else {
      id = "id is missing";
    }

    String location;
    var locOptional = beamParameters.getLocation();
    if (locOptional.isPresent()) {
      Location loc = locOptional.get();
      location = loc.toString();
    } else {
      location = "location is missing";
    }

    List<String> descriptions =
        populatedChannels.stream()
            .map(Channel::getData)
            .flatMap(Optional::stream)
            .map(Channel.Data::getDescription)
            .distinct()
            .toList();

    if (descriptions.size() == 1) {
      description.append(descriptions.get(0));
    } else {
      description.append(stationName);
    }

    description
        .append(Channel.DESCRIPTION_SEPARATOR)
        .append(beamDescription.getBeamType().getLabel())
        .append(" beamed for ")
        .append(id)
        .append(Channel.ATTRIBUTE_SEPARATOR)
        .append(" at location ")
        .append(Channel.COMPONENT_SEPARATOR)
        .append(location)
        .append(beamDescription.getPhase().getLabel())
        .append(Channel.ATTRIBUTE_SEPARATOR)
        .append("back azimuth ")
        .append(beamParameters.getReceiverToSourceAzimuthDeg().toString())
        .append("deg")
        .append(Channel.ATTRIBUTE_SEPARATOR)
        .append("slowness ")
        .append(beamParameters.getSlownessSecPerDeg().toString())
        .append("sec/deg")
        .append(Channel.ATTRIBUTE_SEPARATOR)
        .append(beamDescription.getBeamSummation().toString())
        .append(Channel.ATTRIBUTE_SEPARATOR)
        .append(beamDescription.isTwoDimensional());

    return description.toString();
  }

  private static Map<ChannelProcessingMetadataType, Object> updateProcessingMetadata(
      Channel inputChannel, BeamDefinition beamDefinition) {

    var beamDescription = beamDefinition.getBeamDescription();
    var beamParameters = beamDefinition.getBeamParameters();

    var updatedMap = new EnumMap<>(inputChannel.getProcessingMetadata());
    var channelType = beamSummationChannelTypeTranslation(beamDescription);

    updatedMap.put(
        ChannelProcessingMetadataType.STEERING_BACK_AZIMUTH,
        beamParameters.getReceiverToSourceAzimuthDeg());

    updatedMap.put(
        ChannelProcessingMetadataType.STEERING_SLOWNESS, beamParameters.getSlownessSecPerDeg());

    updatedMap.put(ChannelProcessingMetadataType.BEAM_SUMMATION, channelType);

    updatedMap.put(ChannelProcessingMetadataType.BEAM_PHASE, beamDescription.getPhase());

    updatedMap.put(ChannelProcessingMetadataType.BEAM_TYPE, beamDescription.getBeamType());

    var locOptional = beamParameters.getLocation();
    if (locOptional.isPresent()) {
      var loc = locOptional.get();
      updatedMap.put(ChannelProcessingMetadataType.BEAM_LOCATION, loc);
    }

    var ehOptional = beamParameters.getEventHypothesis();
    if (ehOptional.isPresent()) {
      var eh = ehOptional.get();
      updatedMap.put(ChannelProcessingMetadataType.BEAM_EVENT_HYPOTHESIS_ID, eh.getId());
    }

    var sdhOptional = beamParameters.getSignalDetectionHypothesis();
    if (sdhOptional.isPresent()) {
      var sdh = sdhOptional.get();
      updatedMap.put(
          ChannelProcessingMetadataType.BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID, sdh.getId());
    }

    return updatedMap;
  }

  private static ChannelType beamSummationChannelTypeTranslation(BeamDescription beamDescription) {
    ChannelType channelType;
    if (beamDescription.getBeamSummation() == BeamSummation.COHERENT) {
      channelType = ChannelType.B;
    } else {
      channelType = ChannelType.I;
    }
    return channelType;
  }
}
