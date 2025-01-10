package gms.testtools.simulators.bridgeddatasourceanalysissimulator;

import static java.time.temporal.ChronoUnit.HOURS;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.DataSimulatorSpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BridgedDataSourceAnalysisDataSimulatorTest {

  private static final String STAGE_1 = "stage1";
  private static final String STAGE_2 = "stage2";
  private static final String STAGE_3 = "stage3";
  private static final String STAGE_4 = "stage4";
  private Set<String> stages = Set.of(STAGE_1, STAGE_2, STAGE_3, STAGE_4);

  // note: we cannot avoid using Instant.now() as this time is used by the application code being
  // tested
  private final Instant currentTime = Instant.now();
  private final Duration lengthOfSimulation = Duration.ofHours(3);
  private final Duration operationalTimePeriod = Duration.ofDays(5);
  private final Duration calibUpdateFrequency = Duration.ofHours(12);
  private final Instant seedDataStartTime = CssDaoAndCoiParameters.ONDATE;
  private final Instant seedDataEndTime = seedDataStartTime.plus(1, HOURS);
  private final Instant simulationStartTime = currentTime.minus(lengthOfSimulation);

  @Mock private WaveformDataSimulator waveformDataSimulator;
  @Mock private OriginDataSimulator originDataSimulator;
  @Mock private ArrivalDataSimulator arrivalDataSimulator;

  private BridgedDataSourceAnalysisDataSimulator analysisSimulator;
  private DataSimulatorSpec dataSimulatorSpec;

  public BridgedDataSourceAnalysisDataSimulatorTest() {}

  @BeforeEach
  public void setUp() {
    analysisSimulator =
        new BridgedDataSourceAnalysisDataSimulator(
            Set.of(STAGE_1, STAGE_2, STAGE_3, STAGE_4),
            waveformDataSimulator,
            originDataSimulator,
            arrivalDataSimulator);
    dataSimulatorSpec =
        DataSimulatorSpec.builder()
            .setSeedDataStartTime(seedDataStartTime)
            .setSeedDataEndTime(seedDataEndTime)
            .setOperationalTimePeriod(operationalTimePeriod)
            .setSimulationStartTime(simulationStartTime)
            .setCalibUpdateFrequency(calibUpdateFrequency)
            .build();
  }

  /** Test of initialize method, of class BridgedDataSourceAnalysisDataSimulator. */
  @Test
  public void testInitialize() {

    analysisSimulator.initialize(dataSimulatorSpec);

    verify(waveformDataSimulator, times(1))
        .preloadData(
            seedDataStartTime,
            seedDataEndTime,
            simulationStartTime,
            operationalTimePeriod,
            calibUpdateFrequency);

    // looping through the simulators 4 times...seed data is 1 hr and sim runtime is 3hr inclusive
    verify(waveformDataSimulator, times(4))
        .loadData(eq(""), eq(seedDataStartTime), eq(seedDataEndTime), any(), any());

    stages.forEach(
        stage -> {
          verify(originDataSimulator, times(4))
              .loadData(eq(stage), eq(seedDataStartTime), eq(seedDataEndTime), any(), any());
          verify(arrivalDataSimulator, times(4))
              .loadData(eq(stage), eq(seedDataStartTime), eq(seedDataEndTime), any(), any());
        });
  }

  /** Test of cleanup method, of class BridgedDataSourceAnalysisDataSimulator. */
  @Test
  public void testCleanup() {
    analysisSimulator.initialize(dataSimulatorSpec);
    assertDoesNotThrow(() -> analysisSimulator.cleanup());

    verify(waveformDataSimulator, times(1)).cleanup();
    verify(originDataSimulator, times(1)).cleanup();
    verify(arrivalDataSimulator, times(1)).cleanup();
  }
}
