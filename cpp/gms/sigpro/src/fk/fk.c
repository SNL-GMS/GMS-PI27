#include "fk.h"
#include "common/enums.h"

int computeFk(FkSpectraDefinition* definition, ProcessingWaveform waveforms[], int waveformCount, double startTime, double endTime, FkSpectra* spectra){
    return INSUFFICIENT_DATA;
}

int computeFkChannelSegment(FkSpectraDefinition *definition, 
                     int channelSegmentCount, 
                     ProcessingChannelSegment *channelSegments,
                     double detectionTime,
                     double startTime, 
                     double endTime,
                     FkSpectra *spectra, 
                     MissingInputChannelTimeRanges *missingInputChannels)
{
    return INSUFFICIENT_DATA;
}