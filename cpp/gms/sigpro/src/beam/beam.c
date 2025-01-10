#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "beam.h"
#include "common/vectorMath.h"
#include "common/utils.h"
#include "common/taper.h"
#include "qc/qc.h"
#include "filter/filter.h"
#include "common/missingInputChannels.h"

double calculateTravelTimeShift(double azimuth, double slowness, double northDisplacement, double eastDisplacement)
{
    double azimuthRad;
    double northSlowness;
    double eastSlowness;
    double timeShift;

    double slowness_km = slowness / KM_PER_DEGREE;
    azimuthRad = DTOR * azimuth;
    northSlowness = slowness_km * cos(azimuthRad);
    eastSlowness = slowness_km * sin(azimuthRad);

    timeShift = (northSlowness * northDisplacement) + (eastSlowness * eastDisplacement);
    return timeShift;
}

/*
 * Compute beam time shifts
 */
double calculateBeamShift(const BeamDefinition* beamDefinition, const ProcessingChannelSegment* channelSegment)
{
    // Handle all shift methods
    // TODO: The original code supports multiple shift methods, but the GMS COI does not have a way to configure this.
    return calculateTravelTimeShift(beamDefinition->receiverToSourceAzimuthDeg,
        beamDefinition->slownessSecPerDeg,
        channelSegment->northDisplacementKm,
        channelSegment->eastDisplacementKm);
}

/*
 * Compute beam time shifts
 */
double calculateBeamShiftWaveform(BeamDefinition beamDefinition, ProcessingWaveform waveform)
{
    double beamShift = 0.0;

    // Handle all shift methods
    // TODO: The original code supports multiple shift methods, but the GMS COI does not have a way to configure this.
    beamShift = calculateTravelTimeShift(beamDefinition.receiverToSourceAzimuthDeg, beamDefinition.slownessSecPerDeg, waveform.northDisplacementKm, waveform.eastDisplacementKm);

    return beamShift;
}

ProcessingWaveform waveformNew(double startTime, double endTime, double sampleRate, long numSamples, double* dataIn)
{
    ProcessingWaveform waveformOut;

    waveformOut.startTime = startTime;
    waveformOut.endTime = endTime;
    waveformOut.sampleRateHz = sampleRate;
    waveformOut.sampleCount = numSamples;
    waveformOut.data = dataIn;

    return waveformOut;
}

ProcessingWaveform* waveformInit(double startTime, double endTime, double sampleRate, long numSamples, double value)
{
    ProcessingWaveform* waveformOut;
    waveformOut = (ProcessingWaveform*)malloc(sizeof(ProcessingWaveform));
    if (!waveformOut)
    {
        return NULL;
    }

    waveformOut->startTime = startTime;
    waveformOut->endTime = endTime;
    waveformOut->sampleRateHz = sampleRate;
    waveformOut->sampleCount = numSamples;
    waveformOut->data = malloc(numSamples * sizeof(double));
    vectorInit(waveformOut->data, numSamples, value);

    return waveformOut;
}

double interpolateAndStack(ProcessingWaveform* beam, const ProcessingWaveform* element, double beamStartTime, double elementStartTime, int beamStartSamp, int elementStartSamp)
{
    // Stack with linear interpolation
    // For linear interpolation, first element sample must be before first beam sample
    // Check if beam starts before element, if so increment beam sample
    if (beamStartTime < elementStartTime)
    {
        beamStartSamp += 1;
        beamStartTime = beam->startTime + (beamStartSamp / beam->sampleRateHz);
    }

    // Calc samples that can be stacked - allow an extra element sample at the end for interpolation
    long stackSamples = min(beam->sampleCount - beamStartSamp, element->sampleCount - elementStartSamp - 1);
    double timeDiff = beamStartTime - elementStartTime;

    // Initialize for interpolation loop
    int beamSamp = beamStartSamp;
    double beamTime = beamStartTime;
    double beamSampTime = 1 / beam->sampleRateHz;
    int elemSamp = elementStartSamp;
    double elemTime = elementStartTime;
    double elemSampTime = 1 / element->sampleRateHz;

    // Stack
    // - calculate each element sample with linear interpolation
    // - add element sample to beam
    for (int i = beamStartSamp; i < stackSamples; ++i)
    {
        beamSamp += 1;
        beamTime += beamSampTime;
        elemSamp += 1;
        elemTime += elemSampTime;

        // interpolate from this element sample to the next
        timeDiff = beamTime - elemTime;
        double timeFraction = timeDiff / element->sampleRateHz;
        double valueDiff = element->data[elemSamp + 1] - element->data[elemSamp];
        double valueFraction = valueDiff * timeFraction;

        // add this interpolated sample;
        beam->data[i] += element->data[elemSamp] + valueFraction;
    }

    return timeDiff;
}

double snapAndStack(ProcessingWaveform* beam, const ProcessingWaveform* element, double beamStartTime, double elementStartTime, int beamStartSamp, int elementStartSamp)
{
    // Stack with nearest sample (default)
    // For nearest sample interpolation, find the element sample nearest to the starting beam sample
    // This may be the element sample just earlier than or just later than the starting beam sample
    if (beamStartTime < elementStartTime)
    {
        // beam starts before element
        // check if next beam sample is nearer based on sample rate, if so increment beam sample
        if (elementStartTime - beamStartTime > 0.5 / beam->sampleRateHz)
        {
            // use the next beam sample
            beamStartSamp += 1;
            beamStartTime = beam->startTime = (beamStartSamp / beam->sampleRateHz);
        }
    }
    else
    {
        // element starts before beam
        // check if next element sample is nearer based on sample rate, if so increment element sample
        if (beamStartTime - elementStartTime > 0.5 / beam->sampleRateHz)
        {
            // use the next beam sample
            elementStartSamp += 1;
            elementStartTime = element->startTime + (elementStartSamp / element->sampleRateHz);
        }
    }

    // Calc samples that can be stacked 
    long stackSamples = min(beam->sampleCount - beamStartSamp, element->sampleCount - elementStartSamp);
    double timeDiff = beamStartTime - elementStartTime;

    // Stack -- add element vector to beam vector
    vectorAdd(&(beam->data[beamStartSamp]), &(element->data[elementStartSamp]), stackSamples);
    return timeDiff;
}

/*******************************************************************************
** beam_stack_element
**
**  Accumulate an element in a beam.
**
**  Find overlap of element with beam (may not be perfect match).
**  Use either linear interpolation between element samples
**  or snap to nearest sample (default).
**
**  Return time difference from beam sample to element sample.
*/
double beamStackElement(ProcessingWaveform* beam, const ProcessingWaveform* element, SAMPLING_TYPE samplingType, double sampleRateToleranceHz)
{
    long stackSamples;
    double timeDiff = 0.0;
    int beamStartSamp;
    double beamStartTime;
    int elementStartSamp;
    double elementStartTime;

    if (beam->data && element->data)
    {
        // If start times and sample rates are equal, just sum the data vectors
        if (equalWithinTolerance(element->sampleRateHz, beam->sampleRateHz, sampleRateToleranceHz) && equalWithinTolerance(element->startTime, beam->startTime, beam->sampleRateHz * 0.01))
        {
            timeDiff = 0;
            stackSamples = min(element->sampleCount, beam->sampleCount);
            vectorAdd(beam->data, element->data, stackSamples);
            return timeDiff;
        }

        // Find starting samples and times
        // If element starts before beam, beam determines start, find nearest earlier element sample
        // If element starts after beam, element determines start, find nearest earlier beam sample
        if (element->startTime < beam->startTime)
        {
            beamStartSamp = 0;
            beamStartTime = beam->startTime;

            // beam sets start
            // find nearest earlier element sample
            elementStartSamp = (int)round((beam->startTime - element->startTime) * element->sampleRateHz);
            elementStartTime = element->startTime + (elementStartSamp / element->sampleRateHz);
        }
        else
        {
            // beam starts before element
            elementStartSamp = 0;
            elementStartTime = element->startTime;

            // element sets start
            // find nearest earlier beam sample
            beamStartSamp = (int)round((element->startTime - beam->startTime) * element->sampleRateHz);
            beamStartTime = beam->startTime + (beamStartSamp / beam->sampleRateHz);
        }

        // Accumulate element to beam
        // Use either linear interpolation between element samples
        // or snap to nearest sample.
        if (samplingType == INTERPOLATED)
        {
            return interpolateAndStack(beam, element, beamStartTime, elementStartTime, beamStartSamp, elementStartSamp);
        }
        else
        {
            return snapAndStack(beam, element, beamStartTime, elementStartTime, beamStartSamp, elementStartSamp);
        }
    }
    // Return time difference from beam sample to element sample.
    return timeDiff;
}

void transformElement(BEAM_SUMMATION_TYPE beamSummation, double* procVector, long procNumSamples)
{
    if (beamSummation == INCOHERENT)
    {
        vectorAbs(procVector, procNumSamples);
    }
    else if (beamSummation == RMS)
    {
        vectorSquare(procVector, procNumSamples);
    }
}

void shiftAndStackChannelSegment(const BeamDefinition* definition,
    const ProcessingChannelSegment* channelSegment,
    double elementShift,
    double modBeamStart,
    double modBeamEnd,
    ProcessingWaveform* beamWaveform,
    ProcessingWaveform* normWaveform,
    const ProcessingMaskDefinition* processingMaskDefinition)
{
    for (int w = 0; w < channelSegment->waveformCount; w++)
    {
        // only process waveforms within sample rate tolerance
        if (fabs(channelSegment->waveforms[w].sampleRateHz - definition->sampleRateHz) <= definition->sampleRateToleranceHz)
        {
            double shiftedElementStart = channelSegment->waveforms[w].startTime + elementShift;
            double shiftedElementEnd = shiftedElementStart + (channelSegment->waveforms[w].sampleRateHz * (double)channelSegment->waveforms[w].sampleCount);
            if (shiftedElementStart <= modBeamEnd && shiftedElementEnd >= modBeamStart)
            {
                // (4) Trim element time interval 
                //
                // Find time and sample numbers to trim shifted element to match modified beam interval
                //
                // - find first sample less than modified beam interval start
                // - limit element samples to number in modified beam interval or less
                // - proc element interval is from trimmed_start_samp to trimmed_end_samp

                // trim element start minimum to the first sample less than modified beam interval start

                // (5) Shift element for stacking and copy to processing waveform
                // ProcessingWaveform elementProcWaveform = trim(shiftedElementStart, shiftedElementEnd, modBeamStart, modBeamEnd, channelSegment->waveforms[w]);
                ProcessingWaveform elementProcWaveform = waveformNew(shiftedElementStart, shiftedElementEnd, channelSegment->waveforms[w].sampleRateHz, channelSegment->waveforms[w].sampleCount, channelSegment->waveforms[w].data);
                double procStartTime = elementProcWaveform.startTime;
                double procEndTime = elementProcWaveform.endTime;
                double procSampleRate = elementProcWaveform.sampleRateHz;
                long procNumSamples = elementProcWaveform.sampleCount;
                double* procVector = elementProcWaveform.data;

                ProcessingWaveform* elementNormWaveform = waveformInit(channelSegment->waveforms[w].startTime, channelSegment->waveforms[w].endTime, procSampleRate, channelSegment->waveforms[w].sampleCount, 1.0);

                // mask and taper sample norms
                qcFixZeroOnly(processingMaskDefinition, elementNormWaveform, channelSegment->waveforms[w].processingMaskCount, channelSegment->waveforms[w].maskedBy);

                elementNormWaveform->startTime = shiftedElementStart;
                elementNormWaveform->endTime = shiftedElementEnd;

                // handle this later.
                // if (maskTaperDefinition)
                // {
                //     qcTaper(&elementNormWaveform, maskTaperDefinition);
                // }


                // (6) Scale element by beam weight
                // TODO: implement in a future story

                // (7) Transform element (abs, square, fstat, dispersive)
                transformElement(definition->beamSummation, procVector, procNumSamples);
                // Note: coherent does not require any manipulations of the data prior to summation, 
                // hence it's not included here. However, the original code includes dispersive, which
                // is not accounted for in GMS enums

                // (8) Accumulate norm, beam, and power using interpolation method

                beamStackElement(normWaveform, elementNormWaveform, definition->samplingType, definition->sampleRateToleranceHz);
                beamStackElement(beamWaveform, &elementProcWaveform, definition->samplingType, definition->sampleRateToleranceHz);

                free(elementNormWaveform->data);
                free(elementNormWaveform);
            }
        }
    }
}

void copyMissingInputChannels(MissingInputChannelTimeRanges* missingInputChannels,
    int channelSegmentCount,
    ProcessingChannelSegment* beam)
{
    int missingInputChannelsCount = 0;
    for (int i = 0; i < channelSegmentCount; i++)
    {
        if (missingInputChannels[i].timeRangeCount > 0)
        {
            missingInputChannelsCount++;
        }
    }

    beam->missingInputChannelCount = missingInputChannelsCount;

    if (missingInputChannelsCount == 0)
    {
        free(missingInputChannels);
        return;
    }

    beam->missingInputChannels = (MissingInputChannelTimeRanges*)malloc(missingInputChannelsCount * sizeof(MissingInputChannelTimeRanges));
    int missingInputNumber = 0;
    for (int i = 0; i < channelSegmentCount; i++)
    {
        if (missingInputChannels[i].timeRangeCount > 0)
        {
            if (missingInputChannels[i].channelName)
            {
                beam->missingInputChannels[missingInputNumber].channelName = malloc(strlen(missingInputChannels[i].channelName) + 1);
                strcpy(beam->missingInputChannels[missingInputNumber].channelName, missingInputChannels[i].channelName);
            }

            beam->missingInputChannels[missingInputNumber].timeRangeCount = missingInputChannels[i].timeRangeCount;
            beam->missingInputChannels[missingInputNumber].timeRanges = (TimeRange*)malloc(missingInputChannels[i].timeRangeCount * sizeof(TimeRange));
            for (int k = 0; k < beam->missingInputChannels[missingInputNumber].timeRangeCount; k++)
            {
                beam->missingInputChannels[missingInputNumber].timeRanges[k].startTime = missingInputChannels[i].timeRanges[k].startTime;
                beam->missingInputChannels[missingInputNumber].timeRanges[k].endTime = missingInputChannels[i].timeRanges[k].endTime;
            }

            free(missingInputChannels[i].timeRanges);
            missingInputChannels[i].timeRanges = (TimeRange*) NULL;
            missingInputNumber++;
        }
    }

    free(missingInputChannels);

}

void convertToChannelSegment(const BeamDefinition *definition, 
                             double beamStartTime,
                             long beamSamples, 
                             ProcessingWaveform beamWaveform, 
                             ProcessingWaveform normWaveform, 
                             ProcessingChannelSegment *beam)
{
    // Determine where we have continuous segments of beam, and divide
    int inGap = 0;
    beam->waveformCount = 0;

    int numSegments = 0;
    for (int i = 0; i < beamSamples; i++)
    {
        if (!inGap && normWaveform.data[i] < definition->minWaveformsToBeam)
        {
            // we've found the end of a good block of data
            numSegments++;
            inGap = 1;
        }
        else if (inGap && normWaveform.data[i] >= definition->minWaveformsToBeam)
        {
            // we were in a gap, but we found the start of a good block of data 
            inGap = 0;
        }
    }

    if (!inGap)
    {
        numSegments++;
    }

    beam->waveformCount = numSegments;
    if (numSegments > 0)
    {
        beam->waveforms = (ProcessingWaveform*) malloc(numSegments * sizeof(ProcessingWaveform));
    }

    int blockStartSample = 0;
    inGap = 0;    
    int currentWaveform = 0;
    for (int i = 0; i < beamSamples; i++)
    {
        if (inGap && normWaveform.data[i] >= definition->minWaveformsToBeam)
        {
            blockStartSample = i;
            inGap = 0;
            beamWaveform.data[i] /= normWaveform.data[i];
        }
        else if (!inGap && normWaveform.data[i] < definition->minWaveformsToBeam)
        {
            inGap = 1;
            if (blockStartSample < i)
            {
                double blockStartTime = beamStartTime + (blockStartSample / definition->sampleRateHz);
                double blockEndTime = beamStartTime + ((i - 1) / definition->sampleRateHz);
                long blockSampleCount = i - blockStartSample;

                beam->waveforms[currentWaveform].startTime = blockStartTime;
                beam->waveforms[currentWaveform].endTime = blockEndTime;
                beam->waveforms[currentWaveform].sampleCount = blockSampleCount;
                beam->waveforms[currentWaveform].sampleRateHz = definition->sampleRateHz;

                double* waveformData = (double*) malloc (blockSampleCount * sizeof(double));
                memcpy(waveformData, &beamWaveform.data[blockStartSample], blockSampleCount * sizeof(double));
                beam->waveforms[currentWaveform].data = waveformData;

                currentWaveform++;
            }
            else
            {
                // there's a gap at the beginning of the beam
                blockStartSample++;
            }
        }
        else if (!inGap)
        {
            beamWaveform.data[i] /= normWaveform.data[i];
        }
    }

    if (!inGap)
    {
        double blockStartTime = beamStartTime + (blockStartSample / definition->sampleRateHz);
        double blockEndTime = beamStartTime + (((double) beamSamples) / definition->sampleRateHz);
        long blockSampleCount = beamSamples - blockStartSample;

        beam->waveforms[currentWaveform].startTime = blockStartTime;
        beam->waveforms[currentWaveform].endTime = blockEndTime;
        beam->waveforms[currentWaveform].sampleCount = blockSampleCount;
        beam->waveforms[currentWaveform].sampleRateHz = definition->sampleRateHz;

        double* waveformData = (double*) malloc (blockSampleCount * sizeof(double));
        memcpy(waveformData, &beamWaveform.data[blockStartSample], blockSampleCount * sizeof(double));
        beam->waveforms[currentWaveform].data = waveformData;
        currentWaveform++;
    }

    beam->waveformCount = currentWaveform;
}

/*
 * Assumptions:
 *   1) There is only 1 channel segment per channel
 */
int beamChannelSegment(const BeamDefinition* definition,
    int channelSegmentCount,
    const ProcessingChannelSegment* channelSegments,
    double beamStartTime,
    double beamEndTime,
    const double* mediumVelocity,
    const ProcessingMaskDefinition* processingMaskDefinition,
    const TaperDefinition* maskTaperDefinition,
    ProcessingChannelSegment* beam)
{

    /*************************************************
     ** (A) Check beam definition
     ** - first just check if any beam elements exist
     ** - check if valid beam definition time interval
     */
    if (channelSegmentCount <= definition->minWaveformsToBeam || !channelSegments)
    {
        return INSUFFICIENT_DATA;
    }

    if (beamEndTime <= beamStartTime)
    {
        return INVALID_BOUNDS;
    }

    /*************************************************
     ** (B) Create output structure
     */
    MissingInputChannelTimeRanges* missingInputChannels = (MissingInputChannelTimeRanges*)malloc(channelSegmentCount * sizeof(MissingInputChannelTimeRanges));

    // Create output missing input channels structure
    for (int elem = 0; elem < channelSegmentCount; ++elem)
    {
        missingInputChannels[elem].channelName = channelSegments[elem].channelName;
        missingInputChannels[elem].timeRangeCount = 0;
        missingInputChannels[elem].timeRanges = (TimeRange*)NULL;
    }

    double beamSampleRate = definition->sampleRateHz;

    double modBeamStart = beamStartTime;
    double modBeamEnd = beamEndTime;

    long modBeamSamples = (long)((modBeamEnd - modBeamStart) * beamSampleRate) + 1;

    // create working beam vectors
    double* beamVector = (double*)calloc(modBeamSamples, sizeof(double));
    double* normVector = (double*)calloc(modBeamSamples, sizeof(double));

    ProcessingWaveform normWaveform = waveformNew(beamStartTime, beamEndTime, definition->sampleRateHz, modBeamSamples, normVector);
    ProcessingWaveform beamWaveform = waveformNew(beamStartTime, beamEndTime, definition->sampleRateHz, modBeamSamples, beamVector);

    normWaveform.maskedBy = beamWaveform.maskedBy; // TODO: should we properly copy this?

    /***************************************************************************************************
     ** (F) LOOP OVER ELEMENTS
     **
     ** Process each element and accumulate beam and element norm:
     **
     **   (1) Compute element time shift (aka "beam delay")
     **   (2) Compute shifted element time interval and check if overlap with beam interval
     **   (3) Check if element is used
     **   (4) Trim element time interval
     **   (5) Shift element for stacking and copy to processing waveform
     **   (6) Scale element by beam weight
     **   (7) Transform element (abs, square, fstat, dispersive)
     **   (8) Rotate element
     **   (9) Accumulate norm, beam, and power using interpolation method
     */

    TimeRange beamTimeRange;
    beamTimeRange.startTime = beamStartTime;
    beamTimeRange.endTime = beamEndTime;

    for (int elem = 0; elem < channelSegmentCount; elem++)
    {
        ProcessingChannelSegment channelSegment = channelSegments[elem];

        // (1) Compute element time shift (aka "beam delay")
        double elementShift = calculateBeamShift(definition, &channelSegment);

        // (2) Compute shifted element time interval and check if overlap with beam interval
        int unused = getMissingInputChannelsFor(channelSegment,
            beamTimeRange,
            definition->sampleRateHz,
            &missingInputChannels[elem]);

        // (3) Check if element is used
        //
        // if not, skip element
        if (!unused)
        {
            shiftAndStackChannelSegment(definition, &channelSegments[elem], elementShift, beamStartTime, beamEndTime, &beamWaveform, &normWaveform, processingMaskDefinition);
        }
    }

    convertToChannelSegment(definition, beamStartTime, modBeamSamples, beamWaveform, normWaveform, beam);

    copyMissingInputChannels(missingInputChannels, channelSegmentCount, beam);

    free(beamVector);
    free(normVector);

    if (beam->waveformCount > 0)
    {
        beam->startTime = beam->waveforms[0].startTime;
        beam->endTime = beam->waveforms[beam->waveformCount - 1].endTime;
    }
    else
    {
        // everything was masked out, or did not have enough waveforms to beam
        return INSUFFICIENT_DATA;
    }

    return SUCCESS;
}

