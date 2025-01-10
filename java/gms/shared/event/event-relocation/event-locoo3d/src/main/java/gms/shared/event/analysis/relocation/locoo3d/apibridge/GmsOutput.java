package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.relocation.locoo3d.logging.GmsSalsaLogger;
import gms.shared.event.analysis.relocation.locoo3d.utility.GmsOutputConverter;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.LocationUncertainty;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.locoo3d.LocOOTaskResult;
import gov.sandia.gmp.locoo3d.io.NativeInput;
import gov.sandia.gmp.locoo3d.io.NativeOutput;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Implementation of NativeOutput that outputs GMS COI from LocOo3d */
public class GmsOutput extends NativeOutput {

  // Super class already has a field named "logger"
  private static final Logger GMS_LOGGER = LoggerFactory.getLogger(GmsOutput.class);

  private final GmsOutputConverter gmsOutputConverter;

  /**
   * Converts LocOo3d Output to GMS COI Objects
   *
   * @param properties defines LocOo3d and GMS interface properties
   * @param dInput contains the original {@link EventHypothesis}(es) and {@link
   *     SignalDetectionHypothesis}(es)
   * @throws Exception if there is an issue with the NativeOutput constructor
   */
  public GmsOutput(PropertiesPlusGMP properties, NativeInput dInput) throws Exception {
    super(properties, dInput);

    // base class does not need to store the output sources (native format) returned in
    // locooTaskResults.
    super.outputSources = null;

    // if dataInput is an instance of GMSInput, get a reference to it, otherwise construct a new
    // GMSInput()
    GmsInput dataInput = (dInput instanceof GmsInput di) ? di : new GmsInput(properties);

    this.gmsOutputConverter = new GmsOutputConverter(dataInput);

    var gmsSalsaLogger =
        new GmsSalsaLogger("NativeOutputErrorLog", GmsSalsaLogger.LoggerLevel.ERROR);

    gmsSalsaLogger.setVerbosity(this.errorlog.getVerbosity());
    gmsSalsaLogger.setWriterOutputEnabled(errorlog.isWriterOutputEnabled());
    gmsSalsaLogger.setWriter(this.errorlog.getWriter());

    this.errorlog = gmsSalsaLogger;
  }

  /**
   * Sets the parameters to modify the HyperEllipse for each {@link LocationUncertainty}
   *
   * @param ellipseParameters contains the modifications to the LocOo3d HyperEllipse for each {@link
   *     LocationUncertainty}
   */
  public void setEllipseParameters(Collection<LocationUncertaintyDefinition> ellipseParameters) {
    gmsOutputConverter.setEllipseParameters(ellipseParameters);
  }

  /**
   * Populates the outputLocationSolutions map
   *
   * @param results the LocOo3d output
   * @throws IllegalArgumentException if the underlying HyperEllipse does not have an Ellipse or
   *     Ellipsoid
   * @throws Salsa3dException if there is an error with the super class's writeTaskResult
   */
  @Override
  public void writeTaskResult(LocOOTaskResult results)
      throws IllegalArgumentException, Salsa3dException {

    try {
      super.writeTaskResult(results);
    } catch (Exception e) {
      throw new Salsa3dException("Error performing super.writeTaskResult()", e);
    }

    results.getSources().values().stream()
        .forEach(
            (Source source) -> {
              gmsOutputConverter.addSourceToMap(source);
              if (!source.isValid()) {
                GMS_LOGGER.warn("Results contain an invalid source: {}", source.getErrorMessage());
              }
            });
  }

  /**
   * Retrieve a copy of the output location solutions. It may be wise to clear this collection after
   * retrieval in order to avoid retrieving the same solutions multiple times. Caller has to do
   * that.
   *
   * @return an immutable copy of outputLocationSolutions
   */
  public Map<UUID, LocationSolution> getOutputLocationSolutions() {
    return gmsOutputConverter.getOutputLocationSolutions();
  }

  /**
   * Clears the output location solutions map, so that the caller can avoid retrieving the same
   * solutions multiple times.
   */
  public void clearOutputLocationSolutions() {
    gmsOutputConverter.clearOutputLocationSolutions();
  }

  @Override
  public void close() {
    // perform any processing necessary after all EventHypotheses have been processed.
  }
}
