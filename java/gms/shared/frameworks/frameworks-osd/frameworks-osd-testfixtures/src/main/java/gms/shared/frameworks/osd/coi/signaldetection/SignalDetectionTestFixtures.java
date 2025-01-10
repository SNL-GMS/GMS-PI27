package gms.shared.frameworks.osd.coi.signaldetection;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.osd.coi.DoubleValue;
import gms.shared.frameworks.osd.coi.PhaseType;
import gms.shared.frameworks.osd.coi.Units;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelDataType;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/** Defines objects used in testing */
public class SignalDetectionTestFixtures {

  public static final ObjectMapper objMapper = CoiObjectMapperFactory.getJsonObjectMapper();

  // Processing Station Reference Test Fixtures
  public static final double LAT = 67.00459;
  public static final double LON = -103.00459;
  public static final double ELEV = 13.05;
  public static final double DEPTH = 6.899;
  public static final double VERTICAL_ANGLE = 3.4;
  public static final double HORIZONTAL_ANGLE = 5.7;
  public static final String DESCRIPTION = "";

  // Create a Calibration
  public static final double FACTOR = 1.2;
  public static final double FACTOR_ERROR = 0.112;
  public static final double PERIOD = 14.5;
  public static final long TIME_SHIFT = (long) 2.24;
  public static final DoubleValue CAL_FACTOR =
      DoubleValue.from(FACTOR, FACTOR_ERROR, Units.SECONDS);
  public static final Duration calTimeShift = Duration.ofSeconds(TIME_SHIFT);

  public static final Calibration calibration = Calibration.from(PERIOD, calTimeShift, CAL_FACTOR);

  // Create a Response

  // create an AmplitudePhaseResponse -> amplitudePhaseResponse
  public static final DoubleValue amplitude =
      DoubleValue.from(0.000014254, 0.0, Units.NANOMETERS_PER_COUNT);
  public static final DoubleValue phase = DoubleValue.from(350.140599, 0.0, Units.DEGREES);

  public static final AmplitudePhaseResponse amplitudePhaseResponse =
      AmplitudePhaseResponse.from(amplitude, phase);

  // create a FrequencyAmplitudePhase (fapResponse) using amplitudePhaseResponse created above
  public static final double FREQUENCY = 0.001000;
  public static final FrequencyAmplitudePhase FAP_RESPONSE =
      FrequencyAmplitudePhase.builder()
          .setFrequencies(new double[] {FREQUENCY})
          .setAmplitudeResponseUnits(Units.NANOMETERS_PER_COUNT)
          .setAmplitudeResponse(new double[] {0.000014254})
          .setAmplitudeResponseStdDev(new double[] {0.0})
          .setPhaseResponseUnits(Units.DEGREES)
          .setPhaseResponse(new double[] {350.140599})
          .setPhaseResponseStdDev(new double[] {0.0})
          .build();

  // create a FrequencyAmplitudePhase (fapResponse using TWO amplitudePhaseResponses created
  // above...
  public static final double FREQUENCY_2 = 0.001010;
  public static final FrequencyAmplitudePhase RESPONSE_BY_FREQUENCY_2 =
      FrequencyAmplitudePhase.builder()
          .setFrequencies(new double[] {FREQUENCY, FREQUENCY_2})
          .setAmplitudeResponseUnits(Units.NANOMETERS_PER_COUNT)
          .setAmplitudeResponse(new double[] {0.000014254, 0.000014685})
          .setAmplitudeResponseStdDev(new double[] {0.0, 0.0})
          .setPhaseResponseUnits(Units.DEGREES)
          .setPhaseResponse(new double[] {350.140599, 350.068990})
          .setPhaseResponseStdDev(new double[] {0.0, 0.0})
          .build();

  public static final UUID ID = UUID.fromString("cccaa77a-b6a4-478f-b3cd-5c934ee6b999");

  // Create a Channel
  public static final UUID CHANNEL_ID = UUID.fromString("d07aa77a-b6a4-478f-b3cd-5c934ee6b812");
  public static final String CHANNEL_NAME = "CHAN01";
  public static final ChannelDataType CHANNEL_DATA_TYPE = ChannelDataType.SEISMIC;
  public static final Channel CHANNEL = UtilsTestFixtures.CHANNEL;

  // create the response using fapResponse created above
  public static final Response RESPONSE = Response.from(CHANNEL_NAME, calibration, FAP_RESPONSE);

  // Create a Channel Segment
  public static final UUID PROCESSING_CHANNEL_1_ID =
      UUID.fromString("46947cc2-8c86-4fa1-a764-c9b9944614b7");
  public static final Instant SEGMENT_START = Instant.parse("1970-01-02T03:04:05.123Z");
  public static final Instant SEGMENT_END = SEGMENT_START.plusMillis(2000);
  public static final double SAMPLE_RATE = 2.0;
  protected static final double[] WAVEFORM_POINTS = new double[] {1.1, 2.2, 3.3, 4.4, 5.5};

  // Create a Location
  public static final Location LOCATION = Location.from(1.2, 3.4, 7.8, 5.6);

  // Create a RelativePosition
  public static final RelativePosition RELATIVE_POSITION = RelativePosition.from(1.2, 3.4, 5.6);

  // Create an FkSpectraDefinition
  private static final Duration WINDOW_LEAD = Duration.ofMinutes(3);
  private static final Duration WINDOW_LENGTH = Duration.ofMinutes(2);
  private static final double FK_SAMPLE_RATE = 1 / 60.0;

  private static final double LOW_FREQUENCY = 4.5;
  private static final double HIGH_FREQUENCY = 6.0;

  private static final boolean USE_CHANNEL_VERTICAL_OFFSETS = false;
  private static final boolean NORMALIZE_WAVEFORMS = false;
  private static final PhaseType PHASE_TYPE = PhaseType.P;

  private static final double EAST_SLOW_START = 5;
  private static final double EAST_SLOW_DELTA = 10;
  private static final int EAST_SLOW_COUNT = 25;
  private static final double NORTH_SLOW_START = 5;
  private static final double NORTH_SLOW_DELTA = 10;
  private static final int NORTH_SLOW_COUNT = 25;

  private static final double WAVEFORM_SAMPLE_RATE_HZ = 10.0;
  private static final double WAVEFORM_SAMPLE_RATE_TOLERANCE_HZ = 11.0;

  // Beam Definition Test Fixtures
  private static final double AZIMUTH = 37.5;
  private static final double SLOWNESS = 17.2;
  private static final double NOMINAL_SAMPLE_RATE = 40.0;
  private static final double SAMPLE_RATE_TOLERANCE = 2.0;

  private static final boolean COHERENT = true;
  private static final boolean SNAPPED_SAMPLING = true;
  private static final boolean TWO_DIMENSIONAL = true;

  public static final BeamDefinition BEAM_DEFINITION =
      BeamDefinition.builder()
          .setPhaseType(PHASE_TYPE)
          .setAzimuth(AZIMUTH)
          .setSlowness(SLOWNESS)
          .setCoherent(COHERENT)
          .setSnappedSampling(SNAPPED_SAMPLING)
          .setTwoDimensional(TWO_DIMENSIONAL)
          .setNominalWaveformSampleRate(NOMINAL_SAMPLE_RATE)
          .setWaveformSampleRateTolerance(SAMPLE_RATE_TOLERANCE)
          .setMinimumWaveformsForBeam(1)
          .build();

  public static final FkSpectraDefinition FK_SPECTRA_DEFINITION =
      FkSpectraDefinition.builder()
          .setWindowLead(WINDOW_LEAD)
          .setWindowLength(WINDOW_LENGTH)
          .setSampleRateHz(FK_SAMPLE_RATE)
          .setLowFrequencyHz(LOW_FREQUENCY)
          .setHighFrequencyHz(HIGH_FREQUENCY)
          .setUseChannelVerticalOffsets(USE_CHANNEL_VERTICAL_OFFSETS)
          .setNormalizeWaveforms(NORMALIZE_WAVEFORMS)
          .setPhaseType(PHASE_TYPE)
          .setSlowStartXSecPerKm(EAST_SLOW_START)
          .setSlowDeltaXSecPerKm(EAST_SLOW_DELTA)
          .setSlowCountX(EAST_SLOW_COUNT)
          .setSlowStartYSecPerKm(NORTH_SLOW_START)
          .setSlowDeltaYSecPerKm(NORTH_SLOW_DELTA)
          .setSlowCountY(NORTH_SLOW_COUNT)
          .setWaveformSampleRateHz(WAVEFORM_SAMPLE_RATE_HZ)
          .setWaveformSampleRateToleranceHz(WAVEFORM_SAMPLE_RATE_TOLERANCE_HZ)
          .setMinimumWaveformsForSpectra(2)
          .build();

  /*
  Explicit constructor
   */
  private SignalDetectionTestFixtures() {}
}
