#ifndef GMS_TAPER_H
#define GMS_TAPER_H

#include "enums.h"
#include "structs.h"

/*
 * Taper the processing masks in the provided waveform according to the taperDefinition
 * Input variables:
 *  processingOperation - the operation being performed, and for whcih the waveforms 
 *                        processingMasks were applied
 *  waveform - the ProcessingWaveform containing the data and processing masks to taper
 *  taperDefinition - the TaperDefinition defining how many samples to taper, and using 
 *                    which function.
 * timeShift - the timeshift applied to the waveform
 */
extern int qcTaper(ProcessingWaveform *waveform, const TaperDefinition *taperDefinition);

extern int qcTaperChannelSegment(const TaperDefinition *taperDefinition, ProcessingChannelSegment *channelSegment);

extern int endpointTaper(ProcessingWaveform *waveform, const TaperDefinition *taperDefinition, TAPER_DIRECTION direction);

extern int endpointTaperChannelSegment(const TaperDefinition *taperDefinition, ProcessingChannelSegment *channelSegment, TAPER_DIRECTION direction);

#endif // GMS_TAPER_HChannelSegment