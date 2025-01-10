package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import com.google.common.collect.ImmutableMap;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.relocation.locoo3d.logging.GmsSalsaLogger;
import gms.shared.event.analysis.relocation.locoo3d.utility.ConverterUtility;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationType;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.baseobjects.Receiver;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.baseobjects.globals.GMPGlobals;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.observation.Observation;
import gov.sandia.gmp.locoo3d.LocOOTask;
import gov.sandia.gmp.locoo3d.io.NativeInput;
import gov.sandia.gmp.util.containers.arraylist.ArrayListLong;
import gov.sandia.gmp.util.exceptions.GMPException;
import gov.sandia.gmp.util.globals.GMTFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Implementation of NativeInput that takes GMS COI Objects as inputs into LocOo3d. */
public class GmsInput extends NativeInput {

  private EventHypothesis eventHypothesis;

  /** Map from sourceid to LocationRestraint for use in GMSOutput. */
  private Map<Long, LocationRestraint> restraintsBySourceId;

  /** Map from observationid to SignalDetectionHypothesis for use in GMSOutput. */
  private Map<Long, SignalDetectionHypothesis> signalDetectionHypothesesByObservationId;

  /**
   * Map from Station to Receiver. This map is used during input of data so that multiple references
   * to the same Station don't generate many new Receiver objects.
   */
  private final Map<Station, Receiver> receiverByStation = new HashMap<>();

  /**
   * The correlation coefficients between pairs of observations. Each String is composed of station
   * name/phase/attribute where attribute is one of [ TT, AZ, SH ]. An example of an entry in this
   * map would be: <br>
   * ASAR/Pg/TT -> WRA/Pg/TT -> 0.5 <br>
   * Coefficient values must be in the range [ -1 to 1 ]
   */
  private Map<String, Map<String, Double>> correlationCoefficients;

  /** Need a source of values of type long that can be used as evid, sourceid and observationid. */
  private AtomicLong nextId;

  /**
   * Converts GMS COI Objects to LocOo3d Inputs
   *
   * @param properties defines LocOo3d and GMS interface properties
   * @throws Exception if there is an issue with the NativeInput constructor
   */
  public GmsInput(PropertiesPlusGMP properties) throws Exception {
    super(properties);

    var gmsSalsaLogger =
        new GmsSalsaLogger("NativeInputErrorLog", GmsSalsaLogger.LoggerLevel.ERROR);

    gmsSalsaLogger.setVerbosity(this.errorlog.getVerbosity());
    gmsSalsaLogger.setWriterOutputEnabled(errorlog.isWriterOutputEnabled());
    gmsSalsaLogger.setWriter(this.errorlog.getWriter());

    this.errorlog = gmsSalsaLogger;
  }

  public EventHypothesis getEventHypothesis() {
    return eventHypothesis;
  }

  public Map<Long, LocationRestraint> getRestraints() {
    return ImmutableMap.copyOf(restraintsBySourceId);
  }

  public Map<Long, SignalDetectionHypothesis> getSignalDetectionHypotheses() {
    return ImmutableMap.copyOf(signalDetectionHypothesesByObservationId);
  }

  public Map<Station, Receiver> getStationReceiverMap() {
    return ImmutableMap.copyOf(receiverByStation);
  }

  // TODO: Finish Refactoring:
  //   - Decide on how to handle checked exceptions thrown by Observation and Source
  //   - See if the Immutable maps in the setters can be created only once instead of every time the
  // setter is called.

  /**
   * Takes the GMS COI inputs and converts them to Salsa3d objects for use by LocOo3d
   *
   * @param eventHypothesis the input {@link EventHypothesis}
   * @param eventRelocationDefinition the input {@link EventRelocationDefinition}
   * @param locationRestraints the input collection of {@link LocationRestraint}s
   * @throws Salsa3dException if there is an issue within LocOo3d creating the source or observation
   */
  public void acceptCoi(
      EventHypothesis eventHypothesis,
      EventRelocationDefinition eventRelocationDefinition,
      Collection<LocationRestraint> locationRestraints)
      throws GMPException, Salsa3dException {

    restraintsBySourceId = new HashMap<>();

    signalDetectionHypothesesByObservationId = new HashMap<>();

    this.eventHypothesis = eventHypothesis;

    // reset the id counter.  We will use the same id counter for all sourceIds, and observationIds.
    this.nextId = new AtomicLong(1L);

    // if a master event was specified, convert it to a locoo source and store it.
    var masterEventHypothesisOptional =
        Optional.ofNullable(eventRelocationDefinition.masterEventCorrectionDefinition())
            .map(MasterEventCorrectionDefinition::masterEventHypothesis);

    // Its not simple to use lambdas with things that throw general checked exceptions, so doing
    // this the old fashioned way with isPresent.
    if (masterEventHypothesisOptional.isPresent()) {
      var source =
          convertEventToSource(masterEventHypothesisOptional.get(), eventRelocationDefinition);
      try {
        setMasterEventCorrections(source, "");
      } catch (Exception e) {
        throw new Salsa3dException("Error setting Master Event Corrections", e);
      }
    }

    // convert the event hypothesis into a locoo source
    var baseSource = convertEventToSource(eventHypothesis, eventRelocationDefinition);

    baseSource.setEvid(nextId.incrementAndGet());

    sources = new LinkedHashMap<>();

    locationRestraints.stream()
        .distinct()
        .map(
            (LocationRestraint locationRestraint) -> {
              var src =
                  locationRestraints.size() == 1
                      ? baseSource
                      : cloneSourceWithRuntimeException(baseSource);
              return addLocationRestraintToSource(locationRestraint, src);
            })
        .forEach(source -> sources.put(source.getSourceId(), source));
  }

  /**
   * This method is called by LocOO to retrieve input data. Applications should not call this.
   * Queries the data and retrieves batches of solutionIds that will be processed in parallel
   *
   * @return the list of Task Source Ids as a a 2D ragged array of longs; the first index spans the
   *     batches and the second spans the solutionIds in each batch
   */
  @Override
  public ArrayList<ArrayListLong> readTaskSourceIds() {

    // return the sourceid of each source is a separate batch (one sourceid per batch).
    var batches = new ArrayList<ArrayListLong>();
    for (Source source : sources.values()) {
      var batch = new ArrayListLong(1);
      batch.add(source.getSourceId());
      batches.add(batch);
    }
    return batches;
  }

  /**
   * This method is called by LocOO to retrieve input data. Applications should not call this. Given
   * a list of EventHypothesisIDs, retrieve a LocOOTask that includes those sources. The data
   * includes the sources as well as the associated observations and receivers.
   *
   * @param sourceIds a batch of eventHypothesis ids that are to be relocated in one LocOOTask
   * @return the {@link LocOOTask} for the input sourceIds
   */
  @Override
  public LocOOTask getLocOOTask(ArrayListLong sourceIds) {

    var srcs = new ArrayList<Source>(sourceIds.size());

    for (var i = 0; i < sourceIds.size(); ++i) {
      srcs.add(sources.get(sourceIds.get(i)));
    }

    // instantiate a LocOOTask with the set of sources.
    return new LocOOTask(getProperties(), srcs, masterEventCorrections);
  }

  /**
   * Translate GMS EventHypothesis to LocOO3D Native format (Source/Observation/Receiver).
   *
   * @param eventHypothesis
   * @param eventRelocationDefinition
   * @return the converted {@link Source}
   * @throws GMPException if the Source is not created correctly
   * @throws Salsa3dException if an error is found when checking the Master Event Observations or
   *     creating an Observation
   */
  protected Source convertEventToSource(
      EventHypothesis eventHypothesis, EventRelocationDefinition eventRelocationDefinition)
      throws GMPException, Salsa3dException {

    var eventHypothesisData =
        eventHypothesis
            .getData()
            .orElseThrow(() -> new IllegalStateException("EventHypothesis must be populated"));

    var preferredLocationSolutionEntityReference =
        eventHypothesisData
            .getPreferredLocationSolution()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "EventHypothesis must have a preferredLocationSolution"));

    var preferredLocationSolution =
        eventHypothesisData.getLocationSolutions().stream()
            .filter(
                locationSolution ->
                    locationSolution
                        .getId()
                        .equals(preferredLocationSolutionEntityReference.getId()))
            .findFirst()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "EventHypothesis must contain the preferredLocationSolution in the set of"
                            + " LocationSolutions"));

    var eventLocation =
        preferredLocationSolution
            .getData()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "EventHypothesis must contain the fully populated preferredLocationSolution"
                            + " in the set of LocationSolutions"))
            .getLocation();

    // Instantiate a new locoo Source object with latitude, longitude, depth and origin time of
    // eventHypothesis
    var source =
        new Source(
            eventLocation.getLatitudeDegrees(),
            eventLocation.getLongitudeDegrees(),
            eventLocation.getDepthKm(),
            eventLocation.getTime().getEpochSecond(),
            true);

    // if correlationCoefficients have been set with call to setCorrelationCoefficients(), then
    // those coefficients are passed into the source and correlated observations option will be in
    // effect.
    source.setCorrelationCoefficients(correlationCoefficients);

    var definingFeatureDefinitionMap = eventRelocationDefinition.definingFeatureDefinitionMap();

    // now process the signal detections.
    eventRelocationDefinition.definingFeatureDefinitionMap().keySet().stream()
        .map(
            (SignalDetectionHypothesis signalDetectionHypothesis) -> {
              try {
                // Each signalDetectionHypothesis can generate one locoo Observation object.
                var definingByFeatureMeasurmentType =
                    definingFeatureDefinitionMap.get(signalDetectionHypothesis);
                return createObservationFromSdh(
                    signalDetectionHypothesis, definingByFeatureMeasurmentType, source);
              } catch (GMPException e) {
                throw new Salsa3dException("Error creating observation", e);
              }
            })
        // add the observation to the collection of observations in the source
        .forEach(source::addObservation);

    try {
      checkMasterEventObservations(source);
    } catch (Exception e) {
      throw new Salsa3dException("Error found when checking Master Event Observations", e);
    }

    return source;
  }

  private Source addLocationRestraintToSource(LocationRestraint locationRestraint, Source src) {
    src.setSourceId(nextId.incrementAndGet());

    // save the location restraint for use in GMSOutput.
    restraintsBySourceId.put(src.getSourceId(), locationRestraint);

    var fixed = new boolean[] {false, false, false, false};

    // TODO: Name this back to getEpicenterRestraintType
    if (locationRestraint.getPositionRestraintType() == RestraintType.FIXED) {
      fixed[GMPGlobals.LAT] = fixed[GMPGlobals.LON] = true;
      // if both lat and lon were specified then set source lat, lon to those values
      // otherwise lat and lon will be fixed to the current lat and lon of the source
      src.setLatLon(
          locationRestraint
              .getLatitudeRestraintDegrees()
              .orElseThrow(
                  () ->
                      new IllegalStateException(
                          "latitudeRestraintDegrees must be present if epicenter is fixed")),
          locationRestraint
              .getLongitudeRestraintDegrees()
              .orElseThrow(
                  () ->
                      new IllegalStateException(
                          "longitudeRestraintDegrees must be present if epicenter is fixed")),
          true);
    }
    if (locationRestraint.getDepthRestraintType() == RestraintType.FIXED) {
      fixed[GMPGlobals.DEPTH] = true;
      src.setDepth(
          locationRestraint
              .getDepthRestraintKm()
              .orElseThrow(
                  () ->
                      new IllegalStateException(
                          "depthRestraintKm must be present if depth is fixed")));
    }
    if (locationRestraint.getTimeRestraintType() == RestraintType.FIXED) {
      fixed[GMPGlobals.TIME] = true;
      src.setTime(
          locationRestraint
                  .getTimeRestraint()
                  .orElseThrow(
                      () ->
                          new IllegalStateException(
                              "LocationRestraint with FIXED time must have a time restraint"
                                  + " value"))
                  .toEpochMilli()
              / ConverterUtility.MILLISECOND_FACTOR);
    }

    src.setFixed(fixed);

    return src;
  }

  private Observation createObservationFromSdh(
      SignalDetectionHypothesis signalDetectionHypothesis,
      DefiningFeatureByFeatureMeasurementType definingFeatureByFeatureMeasurementType,
      Source source)
      throws Salsa3dException, GMPException {

    var observation = new Observation();

    observation.setRequestedAttributes(EnumSet.noneOf(GeoAttributes.class));

    // give the observation a unique observationid
    observation.setObservationId(nextId.incrementAndGet());

    // establish relationship from this observation to the current source.
    try {
      observation.setSource(source);
    } catch (Exception e) {
      throw new Salsa3dException("Error adding source to observation", e);
    }

    // save link from observation to signalDetectionHypothesis for use in GMSOutput
    signalDetectionHypothesesByObservationId.put(
        observation.getObservationId(), signalDetectionHypothesis);

    var featureMeasurements = signalDetectionHypothesis.getFeatureMeasurements();

    featureMeasurements.forEach(
        fm ->
            ConverterUtility.addFeatureMeasurementToObservation(
                fm, definingFeatureByFeatureMeasurementType, observation));

    // set master event corrections for this sta-phase, it there are any.
    if (observation.getReceiver() != null && observation.getPhase() != null) {
      observation.setMasterEventCorrections(
          masterEventCorrections.get(
              observation.getReceiver().getSta() + "/" + observation.getPhase()));
    }

    // only keep observations with valid phase and arrival time.
    if (observation.getPhase() != null
        && !ConverterUtility.isNaValue(observation.getArrivalTime())) {
      // extract the Station object where the SignalDetectionHypothesis was observed and translate
      // it into a Receiver
      var station = signalDetectionHypothesis.getStation();

      var effectiveAt =
          station
              .getEffectiveAt()
              .orElseThrow(() -> new IllegalStateException("Station needs an effevtiveAt date"));

      var effectiveUntil =
          station
              .getEffectiveUntil()
              .orElseThrow(() -> new IllegalStateException("Station needs an effectiveUntil date"));

      var receiver = receiverByStation.get(station);
      if (receiver == null) {
        receiver =
            new Receiver(
                station.getName(),
                GMTFormat.getJDate(
                    effectiveAt.toEpochMilli() / ConverterUtility.MILLISECOND_FACTOR),
                GMTFormat.getJDate(
                    (effectiveUntil.toEpochMilli() - 1.0) / ConverterUtility.MILLISECOND_FACTOR),
                station.getLocation().getLatitudeDegrees(),
                station.getLocation().getLongitudeDegrees(),
                station.getLocation().getElevationKm() - station.getLocation().getDepthKm(),
                station.getDescription(),
                (station.getType() == StationType.SEISMIC_ARRAY ? "ar" : "ss"),
                "-",
                0.,
                0.);
        receiverByStation.put(station, receiver);
      }
      try {
        observation.setReceiver(receiver);
      } catch (Exception e) {
        throw new Salsa3dException("Error adding receiver to observation", e);
      }
    }
    return observation;
  }

  private static Source cloneSourceWithRuntimeException(Source source) {
    try {
      return (Source) source.clone();
    } catch (CloneNotSupportedException e) {
      throw new Salsa3dCloneNotSupportedException(e);
    }
  }

  private static class Salsa3dCloneNotSupportedException extends RuntimeException {
    public Salsa3dCloneNotSupportedException(Throwable cause) {
      super(cause);
    }
  }
}
