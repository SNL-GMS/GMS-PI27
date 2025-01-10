package gms.shared.featureprediction.framework;

/** */
public class ZeroFeaturePredictionsException extends RuntimeException {

  public ZeroFeaturePredictionsException() {
    super("No Feature prredictions were able to be calculated!");
  }
}
