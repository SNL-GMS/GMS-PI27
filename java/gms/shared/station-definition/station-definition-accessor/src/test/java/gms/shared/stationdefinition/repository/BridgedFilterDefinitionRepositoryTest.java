package gms.shared.stationdefinition.repository;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import gms.shared.stationdefinition.coi.filter.CascadeFilterDescription;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.dao.FilterDaoFixtures;
import gms.shared.stationdefinition.dao.FilterGroupDaoFixtures;
import gms.shared.stationdefinition.dao.css.FilterDao;
import gms.shared.stationdefinition.database.connector.FilterDatabaseConnector;
import gms.shared.stationdefinition.database.connector.FilterGroupDatabaseConnector;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedFilterDefinitionRepositoryTest {

  @Mock private FilterDatabaseConnector filterDatabaseConnector;

  @Mock private FilterGroupDatabaseConnector filterGroupDatabaseConnector;

  private BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  @BeforeEach
  void setUp() {
    bridgedFilterDefinitionRepository =
        new BridgedFilterDefinitionRepository(
            filterDatabaseConnector, filterGroupDatabaseConnector);
  }

  @Test
  void testLoadFilterDefinitions() {
    var filterDaos =
        List.of(
            FilterDaoFixtures.cascadeNonCausal,
            FilterDaoFixtures.linearButterworthBpCausal,
            FilterDaoFixtures.linearButterworthHpCausal);
    var filterIds = filterDaos.stream().map(FilterDao::getFilterId).collect(Collectors.toSet());

    when(filterDatabaseConnector.findFiltersByIds(filterIds)).thenReturn(filterDaos);
    when(filterGroupDatabaseConnector.findFilterGroupsByIds(filterIds))
        .thenReturn(
            List.of(
                FilterGroupDaoFixtures.cascadeNonCausal_LbBPcChild_seq1,
                FilterGroupDaoFixtures.cascadeNonCausal_LbBPncChild_seq2));

    var result = bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(filterIds);

    assertEquals(3, result.size());

    var cascadeNonCausalDesc =
        result.get(FilterDaoFixtures.cascadeNonCausal.getFilterId()).getFilterDescription();
    assertTrue(cascadeNonCausalDesc instanceof CascadeFilterDescription);
    assertFalse(cascadeNonCausalDesc.isCausal());

    var lbBpCausalDesc =
        result
            .get(FilterDaoFixtures.linearButterworthBpCausal.getFilterId())
            .getFilterDescription();

    assertAll(
        "Linear Butterworth BP Causal Description is as expected",
        () -> assertTrue(lbBpCausalDesc instanceof LinearFilterDescription),
        () -> assertEquals(FilterType.LINEAR, lbBpCausalDesc.getFilterType()),
        () ->
            assertTrue(
                lbBpCausalDesc
                    .getComments()
                    .map(
                        comments ->
                            comments.toUpperCase().contains(PassBandType.BAND_PASS.getValue()))
                    .orElseThrow()
                    .booleanValue()),
        () -> assertTrue(lbBpCausalDesc.isCausal()));

    var lbHpCausalDesc =
        result
            .get(FilterDaoFixtures.linearButterworthHpCausal.getFilterId())
            .getFilterDescription();

    assertAll(
        "Linear Butterworth HP Causal Description is as expected",
        () -> assertTrue(lbBpCausalDesc instanceof LinearFilterDescription),
        () -> assertEquals(FilterType.LINEAR, lbHpCausalDesc.getFilterType()),
        () ->
            assertTrue(
                lbHpCausalDesc
                    .getComments()
                    .map(
                        comments ->
                            comments.toUpperCase().contains(PassBandType.HIGH_PASS.getValue()))
                    .orElseThrow()
                    .booleanValue()),
        () -> assertTrue(lbHpCausalDesc.isCausal()));
  }

  @Test
  void testLoadFilterDefinitionsIgnoreDuplicates() {
    var filterDao = FilterDaoFixtures.cascadeCausal;
    var requestIds =
        List.of(filterDao.getFilterId(), filterDao.getFilterId(), filterDao.getFilterId());

    when(filterDatabaseConnector.findFiltersByIds(Set.copyOf(requestIds)))
        .thenReturn(List.of(filterDao));
    when(filterGroupDatabaseConnector.findFilterGroupsByIds(Set.copyOf(requestIds)))
        .thenReturn(
            List.of(
                FilterGroupDaoFixtures.cascadeCausal_LbBPcChild_seq1,
                FilterGroupDaoFixtures.cascadeCausal_LbHPcChild_seq2));

    var result = bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(requestIds);

    assertEquals(1, result.size());

    var filterDesc = result.get(filterDao.getFilterId()).getFilterDescription();
    assertTrue(filterDesc instanceof CascadeFilterDescription);
    assertTrue(filterDesc.isCausal());
  }

  @Test
  void testLoadFilterDefinitionsNoDefinitionForCascadeOfCascades() {
    var filterDaos =
        List.of(FilterDaoFixtures.cascadeOfCascades, FilterDaoFixtures.cascadeNonCausal);
    var filterIds = filterDaos.stream().map(FilterDao::getFilterId).collect(Collectors.toSet());

    when(filterDatabaseConnector.findFiltersByIds(filterIds)).thenReturn(filterDaos);
    when(filterGroupDatabaseConnector.findFilterGroupsByIds(filterIds))
        .thenReturn(
            List.of(
                FilterGroupDaoFixtures.cascadeOfCascades_cc_seq1,
                FilterGroupDaoFixtures.cascadeOfCascades_cnc_seq2,
                FilterGroupDaoFixtures.cascadeNonCausal_LbBPcChild_seq1,
                FilterGroupDaoFixtures.cascadeNonCausal_LbBPncChild_seq2));

    var result =
        assertDoesNotThrow(
            () -> bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(filterIds));

    assertEquals(1, result.size());

    assertNull(result.get(FilterDaoFixtures.cascadeOfCascades.getFilterId()));

    var cascadeNonCausalDesc =
        result.get(FilterDaoFixtures.cascadeNonCausal.getFilterId()).getFilterDescription();
    assertTrue(cascadeNonCausalDesc instanceof CascadeFilterDescription);
    assertFalse(cascadeNonCausalDesc.isCausal());
  }
}
