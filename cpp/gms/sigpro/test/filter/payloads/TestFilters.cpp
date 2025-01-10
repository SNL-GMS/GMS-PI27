#include "TestFilters.hh"

IirFilterDescription TestFilters::buildLowPassDesignedFilter()
{
    IirFilterParameters iirParameters;
    iirParameters.sampleRateHz = 40.0;
    iirParameters.sampleRateToleranceHz = 0.0;
    iirParameters.groupDelaySec = 0.0;
    iirParameters.sosCoefficientsSize = 3;
    iirParameters.sosNumeratorCoefficients = (double*) malloc(3 * sizeof(double));
    iirParameters.sosNumeratorCoefficients[0] = 0.193599605930034;
    iirParameters.sosNumeratorCoefficients[1] = 0.387199211860068;
    iirParameters.sosNumeratorCoefficients[2] = 0.193599605930034;
    iirParameters.sosDenominatorCoefficients = (double*) malloc(3 * sizeof(double));
    iirParameters.sosDenominatorCoefficients[0] = 1.0;
    iirParameters.sosDenominatorCoefficients[1] = 0.387199211860068;
    iirParameters.sosDenominatorCoefficients[2] = -0.612800788139932;


    IirFilterDescription description;
    description.lowFrequencyHz = 0.5;
    description.highFrequencyHz = 3.0;
    description.order = 1;
    description.zeroPhase = 0;
    description.causal = 1;
    description.bandType = LOW_PASS;
    description.parameters = iirParameters;

    return description;
}

IirFilterDescription TestFilters::buildLowPassFilter()
{
    IirFilterParameters iirParameters;
    iirParameters.sampleRateHz = 40.0;
    iirParameters.sampleRateToleranceHz = 0.0;
    iirParameters.groupDelaySec = 0.0;
    iirParameters.sosCoefficientsSize = MAX_SOS;
    iirParameters.sosNumeratorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));
    iirParameters.sosDenominatorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));

    IirFilterDescription description;
    description.lowFrequencyHz = 0.5;
    description.highFrequencyHz = 3.0;
    description.order = 1;
    description.zeroPhase = 0;
    description.causal = 1;
    description.bandType = LOW_PASS;
    description.parameters = iirParameters;

    return description;
};

FilterDefinition TestFilters::buildDesignedLowPassFilterDefinition()
{
    IirFilterDescription linearDescription = buildLowPassDesignedFilter();

    NonCascadeFilterDescription nonCascadeDescription;
    nonCascadeDescription.iirFilterDescription = linearDescription;

    FilterDescription description;
    description.nonCascadeFilterDescription = nonCascadeDescription;

    FilterDefinition definition;
    definition.causal = 1;
    definition.filterType = IIR_BUTTERWORTH;
    definition.isDesigned = 1;
    definition.filterDescription = description;

    return definition;

}

FilterDefinition TestFilters::buildLowPassFilterDefinition()
{
    IirFilterDescription linearDescription = buildLowPassFilter();

    NonCascadeFilterDescription nonCascadeDescription;
    nonCascadeDescription.iirFilterDescription = linearDescription;    

    FilterDescription description;
    description.nonCascadeFilterDescription = nonCascadeDescription;

    FilterDefinition definition;
    definition.causal = 1;
    definition.filterType = IIR_BUTTERWORTH;
    definition.isDesigned = 0;
    definition.filterDescription = description;

    return definition;
}

FilterDefinition TestFilters::buildDesignedCascadeFilterDefinition()
{
    IirFilterParameters lpCausalParameters;
    lpCausalParameters.sampleRateHz = 40.0;
    lpCausalParameters.sampleRateToleranceHz = 0.0;
    lpCausalParameters.groupDelaySec = 0.0;
    lpCausalParameters.sosCoefficientsSize = 12;

    lpCausalParameters.sosNumeratorCoefficients = (double*) malloc(12 * sizeof(double));
    lpCausalParameters.sosNumeratorCoefficients[0] = 0.193599605930034;
    lpCausalParameters.sosNumeratorCoefficients[1] = 0.387199211860068;
    lpCausalParameters.sosNumeratorCoefficients[2] = 0.193599605930034;
    lpCausalParameters.sosNumeratorCoefficients[3] = 0.049496484722126;
    lpCausalParameters.sosNumeratorCoefficients[4] = 0.098992969444252;
    lpCausalParameters.sosNumeratorCoefficients[5] = 0.049496484722126;
    lpCausalParameters.sosNumeratorCoefficients[6] = 0.042474088413335;
    lpCausalParameters.sosNumeratorCoefficients[7] = 0.084948176826669;
    lpCausalParameters.sosNumeratorCoefficients[8] = 0.042474088413335;
    lpCausalParameters.sosNumeratorCoefficients[9] = 0.038676740290285;
    lpCausalParameters.sosNumeratorCoefficients[10] = 0.077353480580571;
    lpCausalParameters.sosNumeratorCoefficients[11] = 0.038676740290285;

    lpCausalParameters.sosDenominatorCoefficients = (double*) malloc(12 * sizeof(double));
    lpCausalParameters.sosDenominatorCoefficients[0] = 1.0;
    lpCausalParameters.sosDenominatorCoefficients[1] = 0.387199211860068;
    lpCausalParameters.sosDenominatorCoefficients[2] = -0.612800788139932;
    lpCausalParameters.sosDenominatorCoefficients[3] = 1.0;
    lpCausalParameters.sosDenominatorCoefficients[4] = -1.618507547663606;
    lpCausalParameters.sosDenominatorCoefficients[5] = 0.816493486552111;
    lpCausalParameters.sosDenominatorCoefficients[6] = 1.0;
    lpCausalParameters.sosDenominatorCoefficients[7] = -1.38887909036463;
    lpCausalParameters.sosDenominatorCoefficients[8] = 0.558775444017968;
    lpCausalParameters.sosDenominatorCoefficients[9] = 1.0;
    lpCausalParameters.sosDenominatorCoefficients[10] = -1.264707916739562;
    lpCausalParameters.sosDenominatorCoefficients[11] = 0.419414877900703;

    IirFilterDescription lpCausal;
    lpCausal.lowFrequencyHz = 0.5;
    lpCausal.highFrequencyHz = 3.0;
    lpCausal.order = 7;
    lpCausal.zeroPhase = 0;
    lpCausal.causal = 1;
    lpCausal.bandType = LOW_PASS;
    lpCausal.parameters = lpCausalParameters;

    NonCascadeFilterDescription lpNonCascade;
    lpNonCascade.iirFilterDescription = lpCausal;

    IirFilterParameters hpNonCausalParameters2;
    hpNonCausalParameters2.sampleRateHz = 40.0;
    hpNonCausalParameters2.sampleRateToleranceHz = 0.0;
    hpNonCausalParameters2.groupDelaySec = 0.0;
    hpNonCausalParameters2.sosCoefficientsSize = 3;
    
    hpNonCausalParameters2.sosNumeratorCoefficients = (double*) malloc(3 * sizeof(double));
    hpNonCausalParameters2.sosNumeratorCoefficients[0] = 0.962195245829104;
    hpNonCausalParameters2.sosNumeratorCoefficients[1] = 0.0; 
    hpNonCausalParameters2.sosNumeratorCoefficients[2] = -0.962195245829104;

    hpNonCausalParameters2.sosDenominatorCoefficients = (double*) malloc(3 * sizeof(double));
    hpNonCausalParameters2.sosDenominatorCoefficients[0] = 1.0;
    hpNonCausalParameters2.sosDenominatorCoefficients[1] = 0.075609508341793;
    hpNonCausalParameters2.sosDenominatorCoefficients[2] = -0.924390491658207;

    IirFilterDescription hpNonCausal;
    hpNonCausal.lowFrequencyHz = 0.5;
    hpNonCausal.highFrequencyHz = 3.0;
    hpNonCausal.order = 1;
    hpNonCausal.zeroPhase = 1;
    hpNonCausal.causal = 0;
    hpNonCausal.bandType = HIGH_PASS;
    hpNonCausal.parameters = hpNonCausalParameters2;

    NonCascadeFilterDescription hpNonCascade;
    hpNonCascade.iirFilterDescription = hpNonCausal;

    CascadeFilterParameters cascadeParameters;
    cascadeParameters.sampleRateHz = 40.0;
    cascadeParameters.sampleRateToleranceHz = 0.0;
    cascadeParameters.groupDelaySec = 0.0;

    CascadeFilterDescription cascadeDescription;
    cascadeDescription.parameters = cascadeParameters;
    cascadeDescription.filterDescriptionCount = 2;
    cascadeDescription.filterDescriptions = (NonCascadeFilterDescription*) malloc(2 * sizeof(NonCascadeFilterDescription));
    cascadeDescription.filterDescriptions[0] = lpNonCascade;
    cascadeDescription.filterDescriptions[1] = hpNonCascade;

    FilterDescription description;
    description.cascadeFilterDescription = cascadeDescription;

    FilterDefinition definition;
    definition.causal = 0;
    definition.filterType = CASCADE;
    definition.isDesigned = 1;
    definition.filterDescription = description;

    return definition;
}

FilterDefinition TestFilters::buildCascadeFilterDefinition()
{
    IirFilterParameters lpCausalParameters;
    lpCausalParameters.sampleRateHz = 40.0;
    lpCausalParameters.sampleRateToleranceHz = 0.0;
    lpCausalParameters.groupDelaySec = 0.0;
    lpCausalParameters.sosCoefficientsSize = MAX_SOS;
    lpCausalParameters.sosNumeratorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));
    lpCausalParameters.sosDenominatorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));

    IirFilterDescription lpCausal;
    lpCausal.lowFrequencyHz = 0.5;
    lpCausal.highFrequencyHz = 3.0;
    lpCausal.order = 7;
    lpCausal.zeroPhase = 0;
    lpCausal.causal = 1;
    lpCausal.bandType = LOW_PASS;
    lpCausal.parameters = lpCausalParameters;

    NonCascadeFilterDescription lpNonCascade;
    lpNonCascade.iirFilterDescription = lpCausal;

    IirFilterParameters hpNonCausalParameters;
    hpNonCausalParameters.sampleRateHz = 40.0;
    hpNonCausalParameters.sampleRateToleranceHz = 0.0;
    hpNonCausalParameters.groupDelaySec = 0.0;
    hpNonCausalParameters.sosCoefficientsSize = MAX_SOS;
    hpNonCausalParameters.sosNumeratorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));
    hpNonCausalParameters.sosDenominatorCoefficients = (double*) calloc(MAX_SOS, MAX_SOS * sizeof(double));

    IirFilterDescription hpNonCausal;
    hpNonCausal.lowFrequencyHz = 0.5;
    hpNonCausal.highFrequencyHz = 3.0;
    hpNonCausal.order = 1;
    hpNonCausal.zeroPhase = 1;
    hpNonCausal.causal = 0;
    hpNonCausal.bandType = HIGH_PASS;
    hpNonCausal.parameters = hpNonCausalParameters;

    NonCascadeFilterDescription hpNonCascade;
    hpNonCascade.iirFilterDescription = hpNonCausal;

    CascadeFilterParameters cascadeParameters;
    cascadeParameters.sampleRateHz = 40.0;
    cascadeParameters.sampleRateToleranceHz = 0.0;
    cascadeParameters.groupDelaySec = 0.0;

    CascadeFilterDescription cascadeDescription;
    cascadeDescription.parameters = cascadeParameters;
    cascadeDescription.filterDescriptionCount = 2;
    cascadeDescription.filterDescriptions = (NonCascadeFilterDescription*) malloc(2 * sizeof(NonCascadeFilterDescription));
    cascadeDescription.filterDescriptions[0] = lpNonCascade;
    cascadeDescription.filterDescriptions[1] = hpNonCascade;

    FilterDescription description;
    description.cascadeFilterDescription = cascadeDescription;

    FilterDefinition definition;
    definition.causal = 0;
    definition.filterType = CASCADE;
    definition.isDesigned = 0;
    definition.filterDescription = description;

    return definition;
}
