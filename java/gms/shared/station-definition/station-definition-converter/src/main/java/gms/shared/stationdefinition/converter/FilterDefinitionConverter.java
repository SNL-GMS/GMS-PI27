package gms.shared.stationdefinition.converter;

import static com.google.common.base.Preconditions.checkArgument;
import static java.util.stream.Collectors.toList;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.filter.CascadeFilterDescription;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.FilterDescription;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.converter.util.ParsedFilterString;
import gms.shared.stationdefinition.dao.css.FilterDao;
import gms.shared.stationdefinition.dao.css.FilterGroupDao;
import gms.shared.stationdefinition.dao.css.FilterGroupKey;
import gms.shared.stationdefinition.dao.util.FilterDataNode;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Holds all logic required to convert Filter data from persistence into standard COI format */
public final class FilterDefinitionConverter {

  private static final Logger LOGGER = LoggerFactory.getLogger(FilterDefinitionConverter.class);

  private FilterDefinitionConverter() {
    // Hide implicit public constructor
  }

  /**
   * Converts a collection of Filter data from persistence into a FilterDefinition.
   *
   * @param filterDataNode a collection of Filter data from persistence
   * @return A FilterDefinition representing the input data, or an empty Optional if there were
   *     exceptions in the conversion process
   */
  public static Optional<FilterDefinition> convert(FilterDataNode filterDataNode) {
    Preconditions.checkNotNull(filterDataNode);
    try {
      return Optional.of(tryConvert(filterDataNode));
    } catch (IllegalArgumentException e) {
      LOGGER.warn("Failed to convert FilterDefinition from filter tree", e);
      return Optional.empty();
    }
  }

  /**
   * Converts a collection of Filter data from persistence into a FilterDefinition.
   *
   * @param filterDataNode a collection of Filter data from persistence
   * @return A FilterDefinition representing the input data
   * @throws IllegalArgumentException if there were any inconsistencies in the input data that
   *     prevented a FilterDefinition from being created
   */
  public static FilterDefinition tryConvert(FilterDataNode filterDataNode) {
    Preconditions.checkArgument(
        filterDataNode.getFilterGroup().isEmpty(),
        "Top filter record for definition conversion must not be associated with a parent filter");

    var filterDao = filterDataNode.getFilterRecord();
    var comments =
        String.format("Bridged from FILTER record with filterid=%d", filterDao.getFilterId());

    Pair<String, FilterDescription> nameAndDescription = parseNameAndDescription(filterDataNode);

    return FilterDefinition.from(
        nameAndDescription.getLeft(), Optional.of(comments), nameAndDescription.getRight());
  }

  private static Pair<String, FilterDescription> parseNameAndDescription(
      FilterDataNode filterDataNode) {

    String name;
    FilterDescription description;

    var filterDao = filterDataNode.getFilterRecord();
    var filterType =
        convertFilterType(filterDao.getFilterMethod())
            .or(() -> convertFilterType(filterDao.getFilterString()))
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        String.format(
                            "Cannot convert to any FilterType from filterMethod %s or filterString"
                                + " %s",
                            filterDao.getFilterMethod(), filterDao.getFilterString())));

    validateFilterType(filterType, filterDao);

    if (filterType == FilterType.LINEAR) {
      var filterString = ParsedFilterString.create(filterDao.getFilterString());
      name = buildLinearName(filterString);

      var descriptionComments =
          buildDescriptionComments(
              name, filterDataNode.getFilterGroup().map(FilterGroupDao::getFilterGroupKey));

      description = convertLinearFilterDescription(descriptionComments, filterString);
    } else {
      name =
          Arrays.stream(StringUtils.normalizeSpace(filterDao.getFilterString()).strip().split("/"))
              .map(StringUtils::normalizeSpace)
              .map(ParsedFilterString::create)
              .map(FilterDefinitionConverter::buildLinearName)
              .collect(Collectors.joining(" / "));

      var descriptionComments =
          buildDescriptionComments(
              name, filterDataNode.getFilterGroup().map(FilterGroupDao::getFilterGroupKey));

      description = convertCascadeFilterDescription(filterDataNode, descriptionComments);
    }

    return Pair.of(name, description);
  }

  private static Optional<FilterType> convertFilterType(String typeString) {
    return switch (typeString) {
      case "A" -> Optional.of(FilterType.AUTOREGRESSIVE);
      case "B" -> Optional.of(FilterType.LINEAR);
      case "C" -> Optional.of(FilterType.CASCADE);
      case "PM" -> Optional.of(FilterType.PHASE_MATCH);
      default -> Optional.empty();
    };
  }

  private static void validateFilterType(FilterType filterType, FilterDao filterDao) {
    var isCascade = filterType == FilterType.CASCADE;
    var isCompound = filterDao.getCompoundFilter() == 'y';
    checkArgument(
        !isCascade ^ isCompound,
        "Invalid Filter Dao: Only Cascade filters should have compound type set to 'y'");
  }

  private static LinearFilterDescription convertLinearFilterDescription(
      String comments, ParsedFilterString filterString) {

    var builder =
        LinearFilterDescription.builder()
            .setComments(comments)
            .setFilterType(FilterType.LINEAR)
            .setLinearFilterType(LinearFilterType.IIR_BUTTERWORTH)
            .setPassBandType(filterString.getPassBandType())
            .setOrder(filterString.getOrder())
            .setCausal(filterString.isCausal())
            .setZeroPhase(!filterString.isCausal());

    if (filterString.getLowFrequencyHz() > 0.0) {
      builder.setLowFrequencyHz(filterString.getLowFrequencyHz());
    }

    if (filterString.getHighFrequencyHz() > 0.0) {
      builder.setHighFrequencyHz(filterString.getHighFrequencyHz());
    }

    return builder.build();
  }

  private static FilterDescription convertCascadeFilterDescription(
      FilterDataNode filterDataNode, String comments) {

    var filterGroup = filterDataNode.getFilterGroup();

    if (filterGroup.isPresent()) {
      var errFormat =
          String.format(
              "Filter records demonstrating \"cascade of cascades\" behavior currently not"
                  + " supported. Parent: %d, Child: %d",
              filterGroup.get().getFilterGroupKey().getParentFilterId(),
              filterGroup.get().getFilterGroupKey().getChildFilterDao().getFilterId());
      throw new IllegalArgumentException(errFormat);
    }

    var childFilters =
        filterDataNode
            .getChildFilters()
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        String.format(
                            "Compound filter record %d must have associated child filters",
                            filterDataNode.getFilterRecord().getFilterId())));

    if (childFilters.size() > 1) {
      var filterDescriptions =
          childFilters.stream()
              .map(
                  childFdNode ->
                      Pair.of(
                          childFdNode
                              .getFilterGroup()
                              .orElseThrow(
                                  () ->
                                      new IllegalArgumentException(
                                          String.format(
                                              "Child filter record %d of compound filter record %d"
                                                  + " is missing its filter group record"
                                                  + " associating it with its parent",
                                              childFdNode.getFilterRecord().getFilterId(),
                                              filterDataNode.getFilterRecord().getFilterId())))
                              .getFilterGroupKey()
                              .getChildSequence(),
                          parseNameAndDescription(childFdNode).getRight()))
              .collect(
                  Collectors.collectingAndThen(
                      toList(),
                      sequencedDescriptions ->
                          sortAndExtractDescriptions(
                              filterDataNode.getFilterRecord().getFilterId(),
                              sequencedDescriptions)));

      return CascadeFilterDescription.from(
          Optional.of(comments), Optional.empty(), filterDescriptions, Optional.empty());
    } else if (!childFilters.isEmpty()) {
      return parseNameAndDescription(
              childFilters.get(0).toBuilder().setFilterGroup(Optional.empty()).build())
          .getRight();
    } else {
      throw new IllegalArgumentException(
          String.format(
              "Compound filter record %d is associated with an empty list of child filters",
              filterDataNode.getFilterRecord().getFilterId()));
    }
  }

  private static ImmutableList<FilterDescription> sortAndExtractDescriptions(
      long parentFilterId, List<Pair<Long, FilterDescription>> sequencedDescriptions) {
    sequencedDescriptions.sort(Comparator.comparing(Pair::getLeft));

    var orderedSequence = sequencedDescriptions.stream().map(Pair::getLeft).toList();

    var isContiguous =
        IntStream.range(0, orderedSequence.size()).allMatch(i -> i + 1 == orderedSequence.get(i));

    if (!isContiguous) {
      throw new IllegalArgumentException(
          String.format(
              "All child filter records for compound filter %d must have their sequences be"
                  + " contiguous and increasing, starting at 1",
              parentFilterId));
    }
    return sequencedDescriptions.stream()
        .map(Pair::getRight)
        .collect(Collectors.collectingAndThen(toList(), ImmutableList::copyOf));
  }

  private static String buildLinearName(ParsedFilterString filterString) {
    var name =
        String.format(
            "%f-%f %d %s",
            filterString.getLowFrequencyHz(),
            filterString.getHighFrequencyHz(),
            filterString.getOrder(),
            filterString.getPassBandType().getValue());

    if (filterString.isCausal()) {
      name += " zero-phase";
    } else {
      name += " non-causal";
    }

    return name;
  }

  private static String buildDescriptionComments(
      String name, Optional<FilterGroupKey> filterGroupKey) {
    var comments = name;

    var cascadeComment =
        filterGroupKey
            .map(
                fgk ->
                    String.format(
                        "; Bridged from filter cascade element w/ parent_filterid=%s,"
                            + " child_filterid=%s, child_sequence=%d",
                        fgk.getParentFilterId(),
                        fgk.getChildFilterDao().getFilterId(),
                        fgk.getChildSequence()))
            .orElse("");

    return comments.concat(cascadeComment);
  }
}
