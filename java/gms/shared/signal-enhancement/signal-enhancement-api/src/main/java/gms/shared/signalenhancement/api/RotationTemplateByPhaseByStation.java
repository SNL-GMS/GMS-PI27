package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;
import com.google.common.base.Preconditions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

/**
 * Value class that maps {@link Station}s to pairs of {@link PhaseType}s and {@link
 * RotationTemplate}s
 */
@JsonSerialize(converter = RotationTemplateByPhaseByStation.TableToJsonConverter.class)
@JsonDeserialize(converter = RotationTemplateByPhaseByStation.JsonToTableConverter.class)
public record RotationTemplateByPhaseByStation(Table<Station, PhaseType, RotationTemplate> table) {

  /**
   * Value class that maps {@link Station}s to pairs of {@link PhaseType}s and {@link
   * RotationTemplate}s
   *
   * @param table a {@link Table} with rows of entity-reference {@link Station}s, columns of {@link
   *     PhaseType}s, cell values of {@link RotationTemplate}s
   */
  public RotationTemplateByPhaseByStation {
    Preconditions.checkNotNull(table);

    table
        .rowKeySet()
        .forEach(
            station ->
                Preconditions.checkState(
                    station.getEffectiveAt().isEmpty(),
                    "The station keys must be entity references"));
  }

  static class TableToJsonConverter
      extends StdConverter<
          RotationTemplateByPhaseByStation, Collection<RotationTemplateMapByStation>> {

    @Override
    public Collection<RotationTemplateMapByStation> convert(
        RotationTemplateByPhaseByStation myRecord) {
      Preconditions.checkNotNull(myRecord);

      var collection = new ArrayList<RotationTemplateMapByStation>();
      myRecord
          .table
          .rowMap()
          .forEach(
              (station, rotationTemplatesByPhase) ->
                  collection.add(
                      new RotationTemplateMapByStation(station, rotationTemplatesByPhase)));

      return collection;
    }
  }

  static class JsonToTableConverter
      extends StdConverter<
          Collection<RotationTemplateMapByStation>, RotationTemplateByPhaseByStation> {

    @Override
    public RotationTemplateByPhaseByStation convert(
        Collection<RotationTemplateMapByStation> collection) {
      Preconditions.checkNotNull(collection);

      Table<Station, PhaseType, RotationTemplate> table = HashBasedTable.create();
      collection.forEach(
          pair ->
              pair.rotationTemplatesByPhase.forEach(
                  (phaseType, rotationTemplate) ->
                      table.put(pair.station, phaseType, rotationTemplate)));
      return new RotationTemplateByPhaseByStation(table);
    }
  }

  private record RotationTemplateMapByStation(
      Station station, Map<PhaseType, RotationTemplate> rotationTemplatesByPhase) {}
}
