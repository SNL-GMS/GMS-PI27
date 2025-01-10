package gms.shared.featureprediction.plugin.prediction;

class EarthModelMissingPhaseTypeException extends RuntimeException {

  public EarthModelMissingPhaseTypeException() {
    super("Earth model missing phase types");
  }
}
