package gms.shared.signalfeaturemeasurement.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;
import com.google.common.base.Preconditions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.ArrayList;
import java.util.Collection;

/**
 * Value class that maps {@link AmplitudeMeasurementType}s to pairs of {@link Station}s and {@link
 * AmplitudeMeasurementConditioningTemplate}s
 */
@JsonSerialize(
    converter = AmplitudeMeasurementConditioningTemplateByStationByType.TableToJsonConverter.class)
@JsonDeserialize(
    converter = AmplitudeMeasurementConditioningTemplateByStationByType.JsonToTableConverter.class)
public record AmplitudeMeasurementConditioningTemplateByStationByType(
    Table<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate> table) {

  /**
   * Value class that maps {@link AmplitudeMeasurementType}s to pairs of {@link Station}s and {@link
   * AmplitudeMeasurementConditioningTemplate}s
   *
   * @param table a {@link Table} with rows of {@link AmplitudeMeasurementType}s, columns of
   *     entity-reference {@link Station}s, cell values of {@link
   *     AmplitudeMeasurementConditioningTemplate}s
   */
  public AmplitudeMeasurementConditioningTemplateByStationByType {
    Preconditions.checkNotNull(table);

    table
        .columnKeySet()
        .forEach(
            station ->
                Preconditions.checkState(
                    station.getEffectiveAt().isEmpty(),
                    "The station keys must be entity references"));
  }

  static class TableToJsonConverter
      extends StdConverter<
          AmplitudeMeasurementConditioningTemplateByStationByType,
          Collection<StationTemplatePairsByType>> {

    @Override
    public Collection<StationTemplatePairsByType> convert(
        AmplitudeMeasurementConditioningTemplateByStationByType myRecord) {
      Preconditions.checkNotNull(myRecord);

      var collection = new ArrayList<StationTemplatePairsByType>();
      myRecord
          .table
          .rowMap()
          .forEach(
              (var type, var amcTemplatesByStation) -> {
                var pairs = new ArrayList<StationTemplatePair>();

                amcTemplatesByStation.forEach(
                    (station, template) -> pairs.add(new StationTemplatePair(station, template)));

                collection.add(new StationTemplatePairsByType(type, pairs));
              });

      return collection;
    }
  }

  static class JsonToTableConverter
      extends StdConverter<
          Collection<StationTemplatePairsByType>,
          AmplitudeMeasurementConditioningTemplateByStationByType> {

    @Override
    public AmplitudeMeasurementConditioningTemplateByStationByType convert(
        Collection<StationTemplatePairsByType> collection) {
      Preconditions.checkNotNull(collection);

      Table<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate> table =
          HashBasedTable.create();

      collection.forEach(
          stationTemplatePairByType ->
              stationTemplatePairByType.conditioningTemplateByStation.forEach(
                  stationTemplatePair ->
                      table.put(
                          stationTemplatePairByType.amplitudeMeasurementType,
                          stationTemplatePair.station,
                          stationTemplatePair.conditioningTemplate)));

      return new AmplitudeMeasurementConditioningTemplateByStationByType(table);
    }
  }

  private record StationTemplatePairsByType(
      AmplitudeMeasurementType amplitudeMeasurementType,
      Collection<StationTemplatePair> conditioningTemplateByStation) {}

  private record StationTemplatePair(
      Station station, AmplitudeMeasurementConditioningTemplate conditioningTemplate) {}
}
