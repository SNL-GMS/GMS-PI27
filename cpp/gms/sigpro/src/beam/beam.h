#ifndef GMS_BEAM_H
#define GMS_BEAM_H

#include "common/enums.h"
#include "common/structs.h"
#include "enums.h"
#include "structs.h"

#define DTOR    (M_PI / 180.0)
#define RTOD    (180.0 / M_PI)
#define KM_PER_DEGREE 111.3

/*
 * Computes a beam for the provided data
 *
 * Input parameters:
 *  definition - the BeamDefinition providing the configuration parameters for the calculation
 *  waveforms - the waveforms to beam
 *  waveformCount - the number of waveforms in the waveforms array
 *  beamStartTime - the desired start time of the beam
 *  beamEndTime - the desired end time of the beam
 *  mediumVelocity - the medium velocity to use for the beaming algorithm
 *  taperDefinition - the taper definition to use with the processing masks
 * Output parameters:
 *  beam - the calculated beam for the data
 * 
 * Beamforming is used to reduce the noise in waveform data prior to applying other signal processing techniques.
 * This is accomplished by shifting the waveforms measured by different channels within an array station, summing
 * the shifted data together, and averaging it.  
 * 
 * Recall the formula for calculating a beam:
 * 
 *          N - 1
 *          -----|
 *          \
 *        1  \
 * b(t) = _   \     w_i (t + p * r_i)
 *        N   /         
 *           /
 *          /
 *          -----|
 *          i = 0
 *      where 
 *              N is the number of waveforms
 *              w(t) is the waveform
 *              t is the timeseries data
 *              p is the slowness
 *              r is the relative position of the channel to the beam point
 */
extern int beamChannelSegment(const BeamDefinition *definition, 
                int channelSegmentCount, 
                const ProcessingChannelSegment *channelSegments,
                double beamStartTime, 
                double beamEndTime, 
                const double *mediumVelocity, 
                const ProcessingMaskDefinition *processingMaskDefinition, 
                const TaperDefinition *maskTaperDefinition, 
                ProcessingChannelSegment *beam);

#endif // GMS_BEAM_H