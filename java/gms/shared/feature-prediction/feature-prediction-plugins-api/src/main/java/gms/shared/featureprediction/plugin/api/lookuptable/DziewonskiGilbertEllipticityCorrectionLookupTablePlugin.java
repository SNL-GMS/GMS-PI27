package gms.shared.featureprediction.plugin.api.lookuptable;

import gms.shared.stationdefinition.coi.utils.Units;
import java.util.List;
import org.apache.commons.lang3.tuple.Triple;

/**
 * Specializes {@link EarthModelDepthDistanceLookupTablePlugin} to provide access to depth,
 * distance, and {@link PhaseType} dependent travel time ellipticity correction values used by
 * {@link DziewonskiGilbertEllipticityCorrector}.
 */
public interface DziewonskiGilbertEllipticityCorrectionLookupTablePlugin
    extends EarthModelDepthDistanceLookupTablePlugin<
        Triple<List<List<Double>>, List<List<Double>>, List<List<Double>>>,
        Triple<Units, Units, Units>> {}
