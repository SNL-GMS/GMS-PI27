package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import static gms.shared.event.coi.EventTestFixtures.EVENT_UUID;
import static gms.shared.event.coi.EventTestFixtures.HYPOTHESIS_UUID;
import static gms.shared.event.coi.EventTestFixtures.LOCATION_UUID;

import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.relocation.locoo3d.utility.ConverterUtility;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.RestraintType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.baseobjects.Receiver;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.baseobjects.globals.GMPGlobals;
import gov.sandia.gmp.baseobjects.observation.Observation;
import gov.sandia.gmp.locoo3d.LocOOTask;
import gov.sandia.gmp.util.exceptions.GMPException;
import gov.sandia.gmp.util.globals.GMTFormat;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class GmsInputTest {

  private static final double TOLERANCE = 10e-12;

  // Independently set MILLISECOND_FACTOR beside what is defined elsewhere (ConverterUtility).
  // The test should have its own idea of what this should be, which hopefully the defininition
  // in ConverterUtility "got right".
  private static final double MILLISECOND_FACTOR = 1000.0;

  @Test
  void testRelocate() throws Exception {
    var baseEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            EVENT_UUID,
            HYPOTHESIS_UUID,
            LOCATION_UUID,
            3.3,
            // Need a value other than 0 to test the conversion between millisecond long and
            // fractional-second double
            Instant.EPOCH.plusSeconds(2024),
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());

    var slownessFm1 = SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT;

    // The units in this test fixture constant are wrong - need to be SECONDS_PER_DEGREE.
    slownessFm1 =
        slownessFm1.toBuilder()
            .setMeasurementValue(
                NumericMeasurementValue.from(
                    slownessFm1.getMeasurementValue().getReferenceTime(),
                    DoubleValue.from(
                        slownessFm1.getMeasurementValue().getMeasuredValue().getValue(),
                        slownessFm1.getMeasurementValue().getMeasuredValue().getStandardDeviation(),
                        Units.SECONDS_PER_DEGREE)))
            .build();

    var featureMeasurements =
        Set.of(
            slownessFm1,
            SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT);

    var baseSdh1 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh1 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(1000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    var baseSdh2 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh2 =
        baseSdh2.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(2000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    var associatedSdhs = Set.of(baseSdh1, baseSdh2);
    var assoicatedSdhEnitityReferences =
        associatedSdhs.stream().map(sdh -> sdh.toEntityReference()).toList();

    var eventHypothesis =
        baseEventHypothesis.toBuilder()
            .setData(
                baseEventHypothesis.getData().get().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(assoicatedSdhEnitityReferences)
                    .setPreferredLocationSolution(
                        baseEventHypothesis
                            .getData()
                            .get()
                            .getPreferredLocationSolution()
                            .get()
                            .toEntityReference())
                    .build())
            .build();

    var sdhDefiningMap =
        associatedSdhs.stream()
            .map(
                sdh ->
                    Map.entry(
                        sdh,
                        new DefiningFeatureByFeatureMeasurementType(
                            Map.of(
                                FeatureMeasurementTypes.ARRIVAL_TIME,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.SLOWNESS,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                                    new DefiningFeatureDefinition(true, false, true)))))
            .collect(Collectors.toMap(Entry::getKey, Entry::getValue));

    var eventRelocationDefinition = new EventRelocationDefinition(sdhDefiningMap, null);

    var locationRestraintsMap =
        Map.of(
            EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION,
            GMPGlobals.DEPTH,
            LocationRestraint.builder()
                .setLongitudeRestraintDegrees(100.0)
                .setLatitudeRestraintDegrees(89.0)
                .setPositionRestraintType(RestraintType.FIXED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.LAT,
            LocationRestraint.builder()
                .setTimeRestraint(Instant.EPOCH.plusSeconds(1045))
                .setTimeRestraintType(RestraintType.FIXED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.TIME);

    var properties = new PropertiesPlusGMP();

    properties.put("dataLoaderInputType", "application");
    properties.put("dataLoaderInputFormat", "gms");

    var gmsInput = new GmsInput(properties);
    gmsInput.acceptCoi(eventHypothesis, eventRelocationDefinition, locationRestraintsMap.keySet());

    var taskSourceIdsListOfList = gmsInput.readTaskSourceIds();

    var tasks =
        taskSourceIdsListOfList.stream()
            .map(
                taskList -> {
                  try {
                    return gmsInput.getLocOOTask(taskList);
                  } catch (Exception e) {
                    throw new RuntimeException(e);
                  }
                })
            .toList();

    Assertions.assertTrue(!tasks.isEmpty());

    var sources = tasks.stream().map(LocOOTask::getSources).flatMap(Collection::stream).toList();

    Assertions.assertEquals(locationRestraintsMap.size(), sources.size());

    locationRestraintsMap.forEach(
        (k, value) -> {
          var sourceWithRestraint =
              sources.stream().filter(source -> source.getFixed()[value]).findFirst();

          if (sourceWithRestraint.isEmpty()) {
            sourceWithRestraint.getClass();
          }

          Assertions.assertTrue(sourceWithRestraint.isPresent());

          assertSourceHasLocationRestraint(sourceWithRestraint.get(), k);
        });

    sources.forEach(
        source -> {
          assertSourceHasCorrectLocation(
              source, baseEventHypothesis.getData().get().getPreferredLocationSolution().get());
          Assertions.assertEquals(associatedSdhs.size(), source.getObservations().size());
        });

    // Unit test sanity check; want more than 1 SDH.
    Assertions.assertTrue(associatedSdhs.size() > 1);

    sources.forEach(
        source -> Assertions.assertEquals(associatedSdhs.size(), source.getObservations().size()));

    // Both Sdhs have he same station, just use the first.
    var station = baseSdh1.getStation();

    sources.forEach(
        source ->
            source
                .getObservations()
                .forEach((k, observation) -> assertObservationHasStation(observation, station)));
  }

  private void assertSourceHasCorrectLocation(
      Source source, LocationSolution preferredLocationSolution) {
    var data = preferredLocationSolution.getData().get();
    var location = data.getLocation();
    if (!source.getFixed()[GMPGlobals.LAT]) {
      Assertions.assertEquals(location.getLatitudeDegrees(), source.getLatDegrees(), TOLERANCE);
      Assertions.assertEquals(location.getLatitudeDegrees(), source.getLatDegrees(), TOLERANCE);
    }
    if (!source.getFixed()[GMPGlobals.DEPTH]) {
      Assertions.assertEquals(location.getDepthKm(), source.getDepth(), TOLERANCE);
    }
    if (!source.getFixed()[GMPGlobals.TIME]) {
      Assertions.assertEquals(
          location.getTime().toEpochMilli() / MILLISECOND_FACTOR, source.getTime(), TOLERANCE);
    }
  }

  private void assertObservationHasStation(Observation observation, Station station) {
    var effectiveAt = station.getEffectiveAt().get();
    var effectiveUntil = station.getEffectiveUntil().get();

    try {
      var reciever =
          new Receiver(
              station.getName(),
              GMTFormat.getJDate(effectiveAt.toEpochMilli() / ConverterUtility.MILLISECOND_FACTOR),
              GMTFormat.getJDate(
                  (effectiveUntil.toEpochMilli() - 1.0) / ConverterUtility.MILLISECOND_FACTOR),
              station.getLocation().getLatitudeDegrees(),
              station.getLocation().getLongitudeDegrees(),
              -station.getLocation().getDepthKm(),
              station.getDescription(),
              (station.getType() == StationType.SEISMIC_ARRAY ? "ar" : "ss"),
              "-",
              0.,
              0.);

      Assertions.assertEquals(reciever, observation.getReceiver());
    } catch (GMPException e) {
      throw new RuntimeException(e);
    }
  }

  private void assertSourceHasLocationRestraint(
      Source source, LocationRestraint locationRestraint) {
    var restraintBooleans = source.getFixed();
    // Both booleans need to be the same
    Assertions.assertEquals(restraintBooleans[GMPGlobals.LON], restraintBooleans[GMPGlobals.LAT]);
    if (locationRestraint.getPositionRestraintType() == RestraintType.FIXED) {
      Assertions.assertTrue(restraintBooleans[GMPGlobals.LAT]);
      Assertions.assertEquals(
          locationRestraint.getLatitudeRestraintDegrees().get(), source.getLatDegrees(), TOLERANCE);
      Assertions.assertEquals(
          locationRestraint.getLongitudeRestraintDegrees().get(),
          source.getLonDegrees(),
          TOLERANCE);
    }

    if (locationRestraint.getDepthRestraintType() == RestraintType.FIXED) {
      Assertions.assertTrue(restraintBooleans[GMPGlobals.DEPTH]);
      Assertions.assertSame(RestraintType.FIXED, locationRestraint.getDepthRestraintType());
      Assertions.assertEquals(
          locationRestraint.getDepthRestraintKm().get(), source.getDepth(), TOLERANCE);
    }

    if (locationRestraint.getTimeRestraintType() == RestraintType.FIXED) {
      Assertions.assertTrue(restraintBooleans[GMPGlobals.TIME]);
      Assertions.assertEquals(
          locationRestraint.getTimeRestraint().get().toEpochMilli() / MILLISECOND_FACTOR,
          source.getTime());
    }
  }
}
