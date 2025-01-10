#ifndef GMS_QC_H
#define GMS_QC_H

#include <stdlib.h>
#include <math.h>
#include "common/structs.h"
#include "common/vectorMath.h"

/*
 * Masks the provided channel segments according to the processing masks
 * Input Parameters:
 *  processingOperation: the PROCESSING_OPERATION being performed
 *  processingMaskDefinition: the processingMaskDefinition defining how to handle masks
 *  waveform: the waveform to which the masks will be applied
 * Return Value:
 *  the fraction of the data that was masked
 */
int qcFixChannelSegment(const ProcessingMaskDefinition *processingMaskDefinition,
                              ProcessingChannelSegment *channelSegment);

int qcFixZeroOnly(const ProcessingMaskDefinition *processingMaskDefinition, 
                         ProcessingWaveform *waveform,
                         int processingMaskCount,
                         ProcessingMask *processingMasks);

double qcMean(const ProcessingChannelSegment *channelSegment);

int qcDemean(const ProcessingChannelSegment *channelSegment);

#endif // GMS_QC_H