package gms.shared.signalenhancement.api;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategoryAndType;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.coi.qc.TaperDefinition;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class ProcessingMaskDefinitionByPhaseByChannelTest {

  @Test
  void testSerializationEmpty() {

    var map1 = ProcessingMaskDefinitionByPhaseByChannel.create(new ArrayList<>());
    JsonTestUtilities.assertSerializes(map1, ProcessingMaskDefinitionByPhaseByChannel.class);
  }

  @Test
  void testSerializationChannelEmptyDefinition() {

    var map1 = ProcessingMaskDefinitionByPhaseByChannel.create(new ArrayList<>()); // TODO
    JsonTestUtilities.assertSerializes(map1, ProcessingMaskDefinitionByPhaseByChannel.class);
  }

  @Test
  void testSerializationComplete() {

    var processingMaskDefinition =
        new ProcessingMaskDefinition(
            Duration.ofMinutes(8),
            ProcessingOperation.ROTATION,
            Set.of(
                QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY),
                QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
            new TaperDefinition(4, TaperFunction.BLACKMAN));

    var phaseMap1 =
        Map.of(
            PhaseType.Pg, List.of(processingMaskDefinition),
            PhaseType.PnPn, List.of(processingMaskDefinition));

    var channel1 = ChannelSegmentTestFixtures.getTestChannelE1();
    var a = List.of(ProcessingMaskPhaseChannelItem.create(channel1, phaseMap1));

    var map1 = ProcessingMaskDefinitionByPhaseByChannel.create(a);
    JsonTestUtilities.assertSerializes(map1, ProcessingMaskDefinitionByPhaseByChannel.class);
  }

  @Test
  @Disabled("Disabled so it doesn't run in the pipeline. Re-enable locally to generate dump")
  void testDumpProcessingMaskDefinitionByPhaseByChannel() throws IOException {

    var taperDef = new TaperDefinition(4, TaperFunction.BLACKMAN);

    var processingMaskDefinition1 =
        new ProcessingMaskDefinition(
            Duration.ofMinutes(0),
            ProcessingOperation.ROTATION,
            Set.of(QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
            taperDef);

    var processingMaskDefinition2 =
        new ProcessingMaskDefinition(
            Duration.ofMinutes(0),
            ProcessingOperation.ROTATION,
            Set.of(
                QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY)),
            taperDef);

    var phaseMap1 = Map.of(PhaseType.P, List.of(processingMaskDefinition1));

    var phaseMap2 =
        Map.of(
            PhaseType.P, List.of(processingMaskDefinition1, processingMaskDefinition2),
            PhaseType.S, List.of(processingMaskDefinition2));

    var channel1 = ChannelSegmentTestFixtures.getTestChannelE1();
    var channel2 = ChannelSegmentTestFixtures.getTestChannelS4();

    var a =
        List.of(
            ProcessingMaskPhaseChannelItem.create(channel1, phaseMap1),
            ProcessingMaskPhaseChannelItem.create(channel2, phaseMap2));

    var phaseChannelObject = ProcessingMaskDefinitionByPhaseByChannel.create(a);
    try (FileOutputStream outputStream =
        new FileOutputStream("build/ProcessingMaskDefinitionByPhaseByChannelExample.json")) {
      assertDoesNotThrow(
          () ->
              outputStream.write(
                  ObjectMappers.jsonWriter()
                      .withDefaultPrettyPrinter()
                      .writeValueAsBytes(phaseChannelObject)));
    }
  }
}
