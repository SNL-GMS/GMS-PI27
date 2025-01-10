package gms.shared.event.analysis;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;

/** Value class that stores a {@link FeaturePredictorPlugin}-EarthModel plugin pair */
public record EventRelocationPredictorDefinition(String predictor, String earthModel) {

  /**
   * Value class that stores a {@link FeaturePredictorPlugin}-EarthModel plugin pair
   *
   * @param predictor the non-null, non-blank name of a {@link FeaturePredictorPlugin}
   * @param earthModel the non-null, non-blank name of an earth model plugin
   */
  public EventRelocationPredictorDefinition {
    Preconditions.checkArgument(!predictor.isBlank(), "predictor cannot be blank");
    Preconditions.checkArgument(!earthModel.isBlank(), "earthModel cannot be blank");
  }

  public static EventRelocationPredictorDefinition.Builder builder() {
    return new AutoBuilder_EventRelocationPredictorDefinition_Builder();
  }

  public static EventRelocationPredictorDefinition.Builder builder(
      EventRelocationPredictorDefinition erpd) {
    return new AutoBuilder_EventRelocationPredictorDefinition_Builder(erpd);
  }

  public EventRelocationPredictorDefinition.Builder toBuilder() {
    return new AutoBuilder_EventRelocationPredictorDefinition_Builder(this);
  }

  @AutoBuilder
  public interface Builder {

    /** The name of a {@link FeaturePredictorPlugin} */
    Builder setPredictor(String predictor);

    /** The name of an earth model plugin */
    Builder setEarthModel(String earthModel);

    EventRelocationPredictorDefinition build();
  }
}
