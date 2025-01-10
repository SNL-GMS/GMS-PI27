package gms.shared.featureprediction.plugin.api.correction.elevation.mediumvelocity;

import gms.shared.featureprediction.plugin.api.lookuptable.EarthModelLocationDependentPlugin;
import gms.shared.stationdefinition.coi.utils.Units;
import org.springframework.stereotype.Service;

/**
 * Specializes {@link EarthModelLocationDependentPlugin} for plugins providing {@link PhaseType} and
 * {@link Location} dependent medium velocity and medium velocity standard deviation.
 */
@Service
public interface MediumVelocityEarthModelPlugin
    extends EarthModelLocationDependentPlugin<Double, Units> {}
