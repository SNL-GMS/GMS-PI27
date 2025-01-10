package gms.shared.stationdefinition.repository;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.converter.FilterDefinitionConverter;
import gms.shared.stationdefinition.dao.css.FilterGroupDao;
import gms.shared.stationdefinition.dao.util.FilterDataNode;
import gms.shared.stationdefinition.database.connector.FilterDatabaseConnector;
import gms.shared.stationdefinition.database.connector.FilterGroupDatabaseConnector;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** StationDefinitionRepositoryBridged utility methods */
@Component
public class BridgedFilterDefinitionRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(BridgedFilterDefinitionRepository.class);
  private final FilterDatabaseConnector filterDatabaseConnector;
  private final FilterGroupDatabaseConnector filterGroupDatabaseConnector;

  @Autowired
  public BridgedFilterDefinitionRepository(
      FilterDatabaseConnector filterDatabaseConnector,
      FilterGroupDatabaseConnector filterGroupDatabaseConnector) {
    this.filterDatabaseConnector = filterDatabaseConnector;
    this.filterGroupDatabaseConnector = filterGroupDatabaseConnector;
  }

  public Map<Long, FilterDefinition> loadFilterDefinitionsForFilterIds(Collection<Long> filterIds) {

    Preconditions.checkNotNull(filterIds, "The FilterIds cannot be null");

    filterIds = filterIds.stream().collect(Collectors.toSet());

    var filterDaos = filterDatabaseConnector.findFiltersByIds(filterIds);

    var filterGroupDaosByParentFilterId =
        filterGroupDatabaseConnector.findFilterGroupsByIds(filterIds).stream()
            .collect(Collectors.groupingBy(fdao -> fdao.getFilterGroupKey().getParentFilterId()));

    return filterDaos.stream()
        .map(
            parentFilterDao ->
                FilterDataNode.builder()
                    .setFilterRecord(parentFilterDao)
                    .setChildFilters(
                        Optional.ofNullable(
                                filterGroupDaosByParentFilterId.get(parentFilterDao.getFilterId()))
                            .map(
                                groups ->
                                    groups.stream()
                                        .map(BridgedFilterDefinitionRepository::buildChildNode)
                                        .flatMap(Optional::stream)
                                        .toList()))
                    .build())
        .map(
            node ->
                FilterDefinitionConverter.convert(node)
                    .map(def -> Map.entry(node.getFilterRecord().getFilterId(), def)))
        .flatMap(Optional::stream)
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }

  private static Optional<FilterDataNode> buildChildNode(FilterGroupDao filterGroup) {
    var childFilterRecord = filterGroup.getFilterGroupKey().getChildFilterDao();

    if (childFilterRecord.getCompoundFilter() == 'y') {
      LOGGER.warn(
          "Compound child filter records of parent compound filters not currently supported"
              + " (Cascade of cascades). Parent {} Child {}",
          filterGroup.getFilterGroupKey().getParentFilterId(),
          childFilterRecord.getFilterId());
      return Optional.empty();
    } else {
      return Optional.of(
          FilterDataNode.builder()
              .setFilterRecord(childFilterRecord)
              .setFilterGroup(filterGroup)
              .build());
    }
  }
}
