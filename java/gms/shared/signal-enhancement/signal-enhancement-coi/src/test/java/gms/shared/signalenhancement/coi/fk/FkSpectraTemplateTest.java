package gms.shared.signalenhancement.coi.fk;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.fk.FkFrequencyRange;
import gms.shared.stationdefinition.coi.fk.FkSpectraParameters;
import gms.shared.stationdefinition.coi.fk.FkUncertaintyOption;
import gms.shared.stationdefinition.coi.fk.FkWaveformSampleRate;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.fk.SlownessGrid;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class FkSpectraTemplateTest {

  @Test
  void testFkSpectraTemplateSerialization() {
    var fkWindow = new FkWindow(Duration.ofSeconds(1), Duration.ZERO);
    var station = UtilsTestFixtures.ASAR_FACET_STATION.toEntityReference();
    var phaseType = PhaseType.P;
    var channels = List.of(UtilsTestFixtures.CHANNEL.toEntityReference());
    var fkSpectraParameters =
        new FkSpectraParameters(
            phaseType,
            Optional.of(UtilsTestFixtures.FILTER_DEFINITION),
            new SlownessGrid(8.883, 10),
            TaperFunction.BLACKMAN,
            fkWindow,
            new FkFrequencyRange(3.3, 4.2),
            FkUncertaintyOption.EMPIRICAL,
            new FkWaveformSampleRate(4.9, 9.9737),
            Duration.ofSeconds(1),
            0,
            1,
            false,
            true,
            5);

    var fkSpectraTemplate =
        new FkSpectraTemplate(fkWindow, station, phaseType, channels, fkSpectraParameters);

    JsonTestUtilities.assertSerializes(fkSpectraTemplate, FkSpectraTemplate.class);

    var rebuiltTemplate = fkSpectraTemplate.toBuilder().setPhaseType(PhaseType.S).build();

    JsonTestUtilities.assertSerializes(rebuiltTemplate, FkSpectraTemplate.class);
  }
}
