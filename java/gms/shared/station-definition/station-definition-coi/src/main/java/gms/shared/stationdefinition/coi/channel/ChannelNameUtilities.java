package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.auto.value.AutoValue;
import com.google.common.hash.Hashing;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.enums.ChannelType;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Pattern;
import javax.annotation.Nullable;

/** Helper operations used by {@link Channel.Builder} to create names for new {@link Channel}s. */
public final class ChannelNameUtilities {

  private static final String COHERENT = "coherent";
  private static final String INCOHERENT = "incoherent";
  private static final Pattern HASH_REGEX = Pattern.compile("^.*/[0-9a-fA-F]{64}$");

  /** Private constructor prevents instantiating instances of {@link ChannelNameUtilities}. */
  private ChannelNameUtilities() {}

  /**
   * Create a {@link Channel} name in the form:
   * [STATION].[GROUP].[BAND_CODE][INSTRUMENT_CODE][ORIENTATION_CODE]/[PROCESSING_ATTRIBUTES]/[CHANNEL_HASH]
   * using the Channel's properties.
   *
   * @param channel create a name for this {@link Channel} using the Channel properties, not null
   * @return String containing the Channel name, not empty, not null
   */
  public static String createName(Channel channel) {
    return createShortName(channel)
        + createAttributesForChannelName(channel.getProcessingMetadata())
        + Channel.COMPONENT_SEPARATOR
        + NameHash.builder(channel).build().getHash();
  }

  /**
   * Creates a new name for a {@link Channel} by appending an attribute to the
   * [PROCESSING_ATTRIBUTE] block and calculating the new hash.
   *
   * @param channel the non-null input {@link Channel}
   * @param attribute the attribute to be added, without a leading or trailing separator
   * @return the {@link Channel}'s new name with the newly added processing attribute and the new
   *     hash
   */
  public static String appendProcessingAttribute(Channel channel, String attribute) {

    String name = channel.getName();

    // Strip the existing hash, if it exists
    if (HASH_REGEX.matcher(name).matches()) {
      name = name.substring(0, name.lastIndexOf("/"));
    }

    return name
        + Channel.COMPONENT_SEPARATOR
        + attribute
        + Channel.COMPONENT_SEPARATOR
        + NameHash.builder(channel).build().getHash();
  }

  /**
   * Creates a Channel "short name" in the form:
   * [STATION].[GROUP].[BAND_CODE][INSTRUMENT_CODE][ORIENTATION_CODE]. The [ORIENTATION_CODE] is a
   * SEED / FDSN standard channel name (see {@link ChannelNameUtilities#getFdsnChannelName(Channel)}
   *
   * @param channel {@link Channel} that is fully specified but may not have the correct name, not
   *     null
   * @return Channel short name, not null
   */
  static String createShortName(Channel channel) {
    return createShortName(
        channel.getStation().getName(),
        lookupChannelGroup(channel.getProcessingMetadata()),
        getFdsnChannelName(channel));
  }

  /**
   * Creates a Channel "short name" in the form:
   * [STATION].[GROUP].[BAND_CODE][INSTRUMENT_CODE][ORIENTATION_CODE]. The [ORIENTATION_CODE] is a
   * SEED / FDSN standard channel name (see {@link ChannelNameUtilities#getFdsnChannelName(Channel)}
   *
   * @param station String containing a station name, not null
   * @param group String containing a channel group name, not null
   * @param fdsnChannelName String containing an FDSN channel name (see {@link
   *     ChannelNameUtilities#getFdsnChannelName(Channel)}, not null
   * @return Channel short name, not null
   */
  public static String createShortName(String station, String group, String fdsnChannelName) {
    return station + Channel.NAME_SEPARATOR + group + Channel.NAME_SEPARATOR + fdsnChannelName;
  }

  /**
   * Obtain the {@link ChannelProcessingMetadataType#CHANNEL_GROUP} String from the provided
   * metadata map.
   *
   * @param processingMetadata {@link ChannelProcessingMetadataType} to Object map, must contain an
   *     entry for CHANNEL_GROUP, not null
   * @return channel group String from the provided processingMetadata map, not null
   */
  private static String lookupChannelGroup(
      Map<ChannelProcessingMetadataType, Object> processingMetadata) {
    return (String) processingMetadata.get(ChannelProcessingMetadataType.CHANNEL_GROUP);
  }

  /**
   * Obtains a 3-character SEED / FDSN standard channel name in the form [BAND CODE][INSTRUMENT
   * CODE][ORIENTATION CODE] from the provided {@link Channel}.
   *
   * @param channel {@link Channel}, not null
   * @return String with a 3-character SEED / FDSN standard channel name
   */
  public static String getFdsnChannelName(Channel channel) {
    return new String(
        new char[] {
          channel.getChannelBandType().getCode(),
          channel.getChannelInstrumentType().getCode(),
          channel.getChannelOrientationCode(),
        });
  }

  /**
   * Create processing operation specific Channel name attributes from a {@link
   * ChannelProcessingMetadataType} to object map. Creates attributes for as many processing
   * operations (e.g. beaming, filtering, FK, etc.) as possible, but only creates attributes for a
   * processing operation if all of the necessary metadata fields appear in the map. Attributes for
   * processing operations appear in no particular order but the ordering is consistent between
   * calls. The output attribute string is empty if the metadata does not contain sufficient entries
   * to create an attribute string for any processing operation. If the attribute string is not
   * empty then it begins with {@link Channel#COMPONENT_SEPARATOR} and each subsequent portion of
   * the attribute string is also separated by a {@link Channel#COMPONENT_SEPARATOR} character.
   *
   * @param metadata processing metadata map of {@link ChannelProcessingMetadataType} to object, not
   *     null
   * @return String containing the processing operation attributes for a Channel name, potentially
   *     empty but not null
   */
  static String createAttributesForChannelName(
      Map<ChannelProcessingMetadataType, Object> metadata) {

    return createFilterAttributeForChannelName(metadata)
        + createBeamAttributeForChannelName(metadata)
        + createSteerAttributeForChannelName(metadata);
  }

  /**
   * Create the filter specific Channel name attribute from a {@link ChannelProcessingMetadataType}
   * to object map if the map contains metadata for a filtered channel. Returns an empty string if
   * the metadata map does not contain filter metadata. If the attribute string is not empty then it
   * begins with {@link Channel#COMPONENT_SEPARATOR}.
   *
   * @param metadata processing metadata map of {@link ChannelProcessingMetadataType} to object, not
   *     null
   * @return String containing the filter specific attributes for a Channel name, potentially empty
   *     but not null
   */
  static String createFilterAttributeForChannelName(
      Map<ChannelProcessingMetadataType, Object> metadata) {

    final Set<ChannelProcessingMetadataType> required =
        Set.of(
            ChannelProcessingMetadataType.FILTER_TYPE,
            ChannelProcessingMetadataType.FILTER_PASS_BAND_TYPE,
            ChannelProcessingMetadataType.FILTER_LOW_FREQUENCY_HZ,
            ChannelProcessingMetadataType.FILTER_HIGH_FREQUENCY_HZ);

    if (metadata.keySet().containsAll(required)) {
      return (Channel.COMPONENT_SEPARATOR
              + "filter"
              + Channel.ATTRIBUTE_SEPARATOR
              + metadata.get(ChannelProcessingMetadataType.FILTER_TYPE)
              + Channel.ATTRIBUTE_SEPARATOR
              + metadata.get(ChannelProcessingMetadataType.FILTER_PASS_BAND_TYPE)
              + "_"
              + String.format(
                  "%.2f", metadata.get(ChannelProcessingMetadataType.FILTER_LOW_FREQUENCY_HZ))
              + "hz_"
              + String.format(
                  "%.2f", metadata.get(ChannelProcessingMetadataType.FILTER_HIGH_FREQUENCY_HZ))
              + "hz")
          .toLowerCase(Locale.ENGLISH);
    }

    return "";
  }

  /**
   * Create the beam specific Channel name attribute from a {@link ChannelProcessingMetadataType} to
   * object map if the map contains metadata for a beam channel. Returns an empty string if the
   * metadata map does not contain beam metadata. If the attribute string is not empty then it
   * begins with {@link Channel#COMPONENT_SEPARATOR}.
   *
   * @param metadata processing metadata map of {@link ChannelProcessingMetadataType} to object, not
   *     null
   * @return String containing the beam specific attributes for a Channel name, potentially empty
   *     but not null
   */
  static String createBeamAttributeForChannelName(
      Map<ChannelProcessingMetadataType, Object> metadata) {

    if (metadata.keySet().contains(ChannelProcessingMetadataType.BEAM_SUMMATION)
        && metadata.keySet().contains(ChannelProcessingMetadataType.BEAM_TYPE)) {
      return (Channel.COMPONENT_SEPARATOR
              + "beam"
              + Channel.ATTRIBUTE_SEPARATOR
              + getBeamType(metadata.get(ChannelProcessingMetadataType.BEAM_TYPE))
              + Channel.ATTRIBUTE_SEPARATOR
              + getBeamCoherent(metadata.get(ChannelProcessingMetadataType.BEAM_SUMMATION)))
          .toLowerCase(Locale.ENGLISH);
    }

    return "";
  }

  private static String getBeamCoherent(Object channelType) {

    if (channelType.getClass().equals(ChannelType.class)) {

      if (channelType == ChannelType.B) {
        return COHERENT;
      }
      return INCOHERENT;
    }
    return INCOHERENT;
  }

  private static String getBeamType(Object beamType) {

    if (beamType.getClass().equals(BeamType.class)) {

      return beamType.toString();
    }

    return "";
  }

  /**
   * Create the steering (e.g. as done in beaming and rotation) specific Channel name attribute from
   * a {@link ChannelProcessingMetadataType} to object map if the map contains metadata for a
   * steered channel. Returns an empty string if the metadata map does not contain steering
   * metadata. If the attribute string is not empty then it begins with {@link
   * Channel#COMPONENT_SEPARATOR}.
   *
   * @param metadata processing metadata map of {@link ChannelProcessingMetadataType} to object, not
   *     null
   * @return String containing the beam specific attributes for a Channel name, potentially empty
   *     but not null
   */
  static String createSteerAttributeForChannelName(
      Map<ChannelProcessingMetadataType, Object> metadata) {

    final Set<ChannelProcessingMetadataType> required =
        EnumSet.of(
            ChannelProcessingMetadataType.STEERING_BACK_AZIMUTH,
            ChannelProcessingMetadataType.STEERING_SLOWNESS);

    if (metadata.keySet().containsAll(required)) {
      return String.format(
          Locale.ENGLISH,
          "%ssteer%saz_%.3fdeg%sslow_%.3fs_per_deg",
          Channel.COMPONENT_SEPARATOR,
          Channel.ATTRIBUTE_SEPARATOR,
          metadata.get(ChannelProcessingMetadataType.STEERING_BACK_AZIMUTH),
          Channel.ATTRIBUTE_SEPARATOR,
          metadata.get(ChannelProcessingMetadataType.STEERING_SLOWNESS));
    }

    return "";
  }

  /**
   * Computes a {@link Channel} hash using fields from the Channel. The getter operations are public
   * so Jackson can discover them for serialization.
   */
  @AutoValue
  abstract static class NameHash {

    public abstract List<Object> getProcessingDefinition();

    public abstract List<Object> getProcessingMetadata();

    public abstract List<Channel> getConfiguredInputs();

    public abstract ChannelDataType getChannelDataType();

    public abstract ChannelBandType getChannelBandType();

    public abstract String getDescription();

    public abstract ChannelInstrumentType getChannelInstrumentType();

    public abstract ChannelOrientationType getChannelOrientationType();

    public abstract char getChannelOrientationCode();

    public abstract double getNominalSampleRateHz();

    public abstract Optional<Orientation> getOrientationAngles();

    public abstract Location getLocation();

    public abstract String getStation();

    @Nullable public abstract UUID getResponse();

    public abstract Units getUnits();

    static Builder builder(Channel channel) {
      return new AutoValue_ChannelNameUtilities_NameHash.Builder()
          .setProcessingDefinition(channel.getProcessingDefinition())
          .setConfiguredInputs(channel.getConfiguredInputs())
          .setChannelDataType(channel.getChannelDataType())
          .setChannelBandType(channel.getChannelBandType())
          .setDescription(channel.getDescription())
          .setChannelInstrumentType(channel.getChannelInstrumentType())
          .setChannelOrientationType(channel.getChannelOrientationType())
          .setChannelOrientationCode(channel.getChannelOrientationCode())
          .setNominalSampleRateHz(channel.getNominalSampleRateHz())
          .setOrientationAngles(channel.getOrientationAngles())
          .setProcessingMetadata(channel.getProcessingMetadata())
          .setLocation(channel.getLocation())
          .setStation(channel.getStation())
          .setResponse(channel.getResponse().orElse(null))
          .setUnits(channel.getUnits());
    }

    /**
     * Obtains a String representation of a type-3 {@link UUID} for this NameHash. The UUID is
     * computed as follows:
     *
     * <p>1. Create a JSON serialization of the NameHash fields:
     *
     * <p>a. Serialize fields in this order: [sortedProcessingDefinition, sortedConfiguredInputs,
     * channelDataType, channelBandType, channelInstrumentType, channelOrientationType,
     * channelOrientationCode, nominalSampleRateHz, orientationAngles]
     *
     * <p>b. processingDefinition is sorted alphabetically by key and configuredInputs is sorted
     * alphabetically.
     *
     * <p>c. The JSON does not use any whitespace or newline characters to separate keys, values,
     * formatting characters, etc.
     *
     * <p>2. Write the JSON string to a UTF-8 byte array
     *
     * <p>3. Compute the type-3 UUID from the byte array
     *
     * @return {@link UUID} formatted string computed from the NameHash contents.
     */
    String getHash() {

      var simpleModule = new SimpleModule();
      simpleModule.addSerializer(Double.class, new DoubleSerializerWithoutTrailingZeros());
      simpleModule.addSerializer(double.class, new DoubleSerializerWithoutTrailingZeros());
      simpleModule.addSerializer(Instant.class, new MillisecondInstantSerializer());

      var jsonMapper = ObjectMappers.buildJsonMapper();
      jsonMapper.registerModule(simpleModule);

      try {
        final var json = jsonMapper.writeValueAsString(this);
        return Hashing.sha256().hashString(json, StandardCharsets.UTF_8).toString();
      } catch (JsonProcessingException e) {
        throw new IllegalStateException("Could not create unique id for Channel name", e);
      }
    }

    @AutoValue.Builder
    interface Builder {

      default Builder setProcessingDefinition(Map<String, Object> processingDefinition) {

        var sortedList = new TreeMap<>(processingDefinition).entrySet().stream().toList();
        return setProcessingDefinition(sortedList);
      }

      Builder setProcessingDefinition(List<Entry<String, Object>> processingDefinition);

      default Builder setProcessingMetadata(
          Map<ChannelProcessingMetadataType, Object> processingMetaData) {

        var sortedList = new TreeMap<>(processingMetaData).entrySet().stream().toList();
        return setProcessingMetadata(sortedList);
      }

      Builder setProcessingMetadata(
          List<Entry<ChannelProcessingMetadataType, Object>> processingMetaData);

      Builder setConfiguredInputs(List<Channel> configuredInputs);

      List<Channel> getConfiguredInputs();

      Builder setChannelDataType(ChannelDataType channelDataType);

      Builder setChannelBandType(ChannelBandType channelBandType);

      Builder setDescription(String channelDescription);

      Builder setChannelInstrumentType(ChannelInstrumentType channelInstrumentType);

      Builder setChannelOrientationType(ChannelOrientationType channelOrientationType);

      Builder setChannelOrientationCode(char channelOrientationCode);

      Builder setNominalSampleRateHz(double nominalSampleRateHz);

      Builder setOrientationAngles(Optional<Orientation> orientationAngles);

      Builder setLocation(Location location);

      default Builder setStation(Station station) {
        return setStation(station.getName());
      }

      Builder setStation(String stationName);

      default Builder setResponse(@Nullable Response response) {

        if (response != null) {
          return setResponse(response.getId());
        }

        return setResponse((UUID) null);
      }

      Builder setResponse(@Nullable UUID responseId);

      Builder setUnits(Units unit);

      NameHash autoBuild();

      default NameHash build() {

        setConfiguredInputs(getConfiguredInputs().stream().sorted().toList());
        return autoBuild();
      }
    }
  }
}
