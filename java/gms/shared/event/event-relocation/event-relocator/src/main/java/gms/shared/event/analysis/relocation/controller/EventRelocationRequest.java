package gms.shared.event.analysis.relocation.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.coi.EventHypothesis;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;

/** Value object for a request to the event relocation endpoint */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventRelocationRequest(
    @JsonDeserialize(converter = JsonToErdbehConverter.class)
        @JsonSerialize(converter = ErdbhToJsonConverter.class)
        Map<EventHypothesis, EventRelocationDefinition> eventRelocationDefinitionByEventHypothesis,
    Map<PhaseType, List<EventRelocationPredictorDefinition>>
        eventRelocationPredictorDefinitionByPhaseType,
    EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

  // TODO: Thought I needed two of these, so made it generic. Keeping here for now incase this can
  // be taken out and used more generally.
  abstract static class JsonToMapConverter<K, V, P> extends StdConverter<Set<P>, Map<K, V>> {

    abstract Map.Entry<K, V> pairToEntry(P pair);

    @Override
    public Map<K, V> convert(Set<P> pairs) {
      return pairs.stream()
          .map(this::pairToEntry)
          .collect(Collectors.toMap(Entry::getKey, Entry::getValue));
    }
  }

  static record EventHypothesisDefinitionPair(
      EventHypothesis eventHypothesis, EventRelocationDefinition eventRelocationDefinition) {}

  static class JsonToErdbehConverter
      extends JsonToMapConverter<
          EventHypothesis, EventRelocationDefinition, EventHypothesisDefinitionPair> {
    @Override
    Map.Entry<EventHypothesis, EventRelocationDefinition> pairToEntry(
        EventHypothesisDefinitionPair pair) {
      return Map.entry(pair.eventHypothesis, pair.eventRelocationDefinition);
    }
  }

  // TODO: Thought I needed two of these, so made it generic. Keeping here for now incase this can
  // be taken out and used more generally.
  abstract static class MapToJsonConverter<K, V, P> extends StdConverter<Map<K, V>, Set<P>> {

    abstract P combinePair(K k, V value);

    public Set<P> convert(Map<K, V> map) {
      return map.entrySet().stream()
          .map(entry -> combinePair(entry.getKey(), entry.getValue()))
          .collect(Collectors.toSet());
    }
  }

  static class ErdbhToJsonConverter
      extends MapToJsonConverter<
          EventHypothesis, EventRelocationDefinition, EventHypothesisDefinitionPair> {

    @Override
    EventHypothesisDefinitionPair combinePair(
        EventHypothesis eventHypothesis, EventRelocationDefinition eventRelocationDefinition) {
      return new EventHypothesisDefinitionPair(eventHypothesis, eventRelocationDefinition);
    }
  }
}
