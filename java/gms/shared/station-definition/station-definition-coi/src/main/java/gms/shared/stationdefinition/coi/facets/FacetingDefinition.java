package gms.shared.stationdefinition.coi.facets;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Faceting definition class. This is a recursive structure where:
 *
 * <p>1. Each faceting definition defines a class with faceted attributes and a map of attribute
 * names to {@link FacetingDefinition }
 *
 * <p>2. Each {@link } has:
 *
 * <p>a. A boolean indicating whether the attribute should be a "reference-only" instance or a
 * populated instances.
 *
 * <p>b. If the attribute is a populated instance and it is also faceted, a {@link
 * FacetingDefinition} describing how to populate that instance.
 *
 * <p>This supports defining how to populate nested structures of faceted objects where each faceted
 * object has one or more faceted attributes.
 */
@AutoValue
@JsonSerialize(as = FacetingDefinition.class)
@JsonDeserialize(builder = AutoValue_FacetingDefinition.Builder.class)
public abstract class FacetingDefinition {

  public abstract boolean isPopulated();

  public abstract String getClassType();

  public abstract ImmutableMap<String, FacetingDefinition> getFacetingDefinitions();

  /**
   * Returns true if and only if the attributeName string exists in the FacetingDefinition
   * collection
   *
   * @param attributeName Name of the {@link FacetingDefinition} to verify existence
   * @return true if the attributeName exists, false otherwise
   */
  public boolean containsFacetingDefinitionName(String attributeName) {

    attributeName = Objects.requireNonNullElse(attributeName, "");
    if (getFacetingDefinitions() != null) {
      return getFacetingDefinitions().containsKey(attributeName);
    } else {
      return false;
    }
  }

  /**
   * Helper method retrieves a faceting definition by its attributeName if it exists.
   *
   * @param attributeName Name of the {@link FacetingDefinition} to retrieve
   * @return The {@link FacetingDefinition} or Optional.empty() if it doesn't exist
   */
  public Optional<FacetingDefinition> getFacetingDefinitionByName(String attributeName) {
    if (containsFacetingDefinitionName(attributeName)) {
      return Optional.ofNullable(getFacetingDefinitions().get(attributeName));
    } else {
      return Optional.empty();
    }
  }

  public static Builder builder() {
    return new AutoValue_FacetingDefinition.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setPopulated(boolean isPopulated);

    Builder setClassType(String classType);

    Builder setFacetingDefinitions(Map<String, FacetingDefinition> facetingDefinitions);

    ImmutableMap.Builder<String, FacetingDefinition> facetingDefinitionsBuilder();

    default Builder addFacetingDefinitions(String key, FacetingDefinition facetingDefinition) {
      facetingDefinitionsBuilder().put(key, facetingDefinition);
      return this;
    }

    FacetingDefinition autoBuild();

    default FacetingDefinition build() {
      var facetingDefinition = autoBuild();

      if (!facetingDefinition.isPopulated()) {
        checkState(facetingDefinition.getFacetingDefinitions().isEmpty());
      }

      return facetingDefinition;
    }
  }
}
