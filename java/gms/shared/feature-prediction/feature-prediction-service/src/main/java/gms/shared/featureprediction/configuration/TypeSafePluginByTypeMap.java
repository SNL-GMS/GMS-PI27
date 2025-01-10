package gms.shared.featureprediction.configuration;

import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This is meant to be a heterogeneous container, a-la Effective Java Generics item 33:
 * https://www.informit.com/articles/article.aspx?p=2861454&seqNum=8
 *
 * <p>The idea is to effectively hide the wildcard in the map, so that we are not returning types
 * with wildcards, which is a code smell that will be flagged by SonarQube.
 */
public class TypeSafePluginByTypeMap {
  private static final Logger logger = LoggerFactory.getLogger(TypeSafePluginByTypeMap.class);

  private final Map<FeaturePredictionType<?>, String> map;

  public TypeSafePluginByTypeMap(Map<FeaturePredictionType<?>, String> map) {
    this.map = map;
  }

  public String getPluginNameForFeatureMeasurement(
      FeaturePredictionType<?> featureMeasurementType) {
    if (!map.containsKey(featureMeasurementType)) {
      logger.error(
          "Plugin type map doesn't contain feature measurement type: {}",
          featureMeasurementType.getName());
    }
    return map.get(featureMeasurementType);
  }

  public Collection<String> getPluginNames() {
    return map.values();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    if (this.getClass() != o.getClass()) {
      return false;
    }
    TypeSafePluginByTypeMap that = (TypeSafePluginByTypeMap) o;
    return Objects.equals(map, that.map);
  }

  @Override
  public int hashCode() {
    return Objects.hash(map);
  }
}
