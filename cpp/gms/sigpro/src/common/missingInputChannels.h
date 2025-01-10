#ifndef GMS_MISSING_INPUT_CHANNELS_H
#define GMS_MISSING_INPUT_CHANNELS_H

#include <stdlib.h>
#include <math.h>
#include <string.h>
#include "structs.h"

/*
 * Identifies the TimeRanges where the provided channel segment does not have any data in between the target start and end times. 
 * Populates the provided MissingInputChannelTimeRanges with the provided data. Returns 1 if the entire channel segment is excluded, 
 * 0 otherwise.
 * Input:
 *  channelSegment - the ProcessingChannelSegment containing the data the to find gaps
 *  targetTimeRange - the time range in which to find gaps
 *  sampleRateHz - the expected sample rate of the ProcessingWaveforms in the channel segment
 *  missingTimeRanges - the MissingInputChannelTimeRanges struct to populate with the results of this function.  Set to NULL if there are no missing
 *                      timeRanges
 */
int getMissingInputChannelsFor(ProcessingChannelSegment channelSegment,
                               TimeRange targetTimeRange, 
                               double sampleRateHz, 
                               MissingInputChannelTimeRanges* missingTimeRanges);

#endif