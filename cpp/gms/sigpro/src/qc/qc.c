#include "qc.h"

void interpolate(ProcessingMask *mask, ProcessingWaveform *waveform, int fixThreshold, long taperStartSample, long taperEndSample)
{
    // Check if mask length is less than mask fix threshold
    if ((mask->endTime - mask->startTime) * waveform->sampleRateHz <= fixThreshold)
    {
        long prevGoodSample = taperStartSample - 1;
        long nextGoodSample = taperEndSample + 1;
        long interpolateSegmentLength = nextGoodSample - prevGoodSample + 1;
        double prevGoodValue = waveform->data[taperStartSample - 1];
        double nextGoodValue = waveform->data[taperEndSample + 1];
        double valueFraction = (nextGoodValue - prevGoodValue) / (double) (interpolateSegmentLength - 1);
        // Interpolate from the previous good value to the next
        double* interpolateSegment = &waveform->data[prevGoodSample];
        for (int i = 1; i < interpolateSegmentLength - 1; i++)
        {
            interpolateSegment[i] = prevGoodValue + valueFraction * i;
        }

        mask->isFixed = 1;
    }
    else 
    {
        // mask is bigger than fix threshold
        // mask this segment
        // - zero out this segment in waveform
        vectorInit(&waveform->data[taperStartSample], 1 + taperEndSample - taperStartSample, 0.0);
        mask->isFixed = 0;
    }
}

void applySingleMask(ProcessingMask mask, 
                     const ProcessingMaskDefinition *processingMaskDefinition, 
                     double waveformStartTime, 
                     double waveformEndTime, 
                     ProcessingWaveform *waveform, 
                     int* stopLooking, 
                     int allowInterpolation)
{
    long taperStartSample;
    long taperEndSample;

    // Handle masks overlapping waveformStartTime
    if (mask.startTime <= waveformStartTime)
    {
        if (mask.endTime < waveformEndTime)
        {
            taperStartSample = 0;
            taperEndSample = lround((mask.endTime - waveformStartTime) * waveform->sampleRateHz);
        } 
        else
        {
            // this mask covers the whole waveform
            taperStartSample = 0;
            taperEndSample = waveform->sampleCount;

            // if the whole waveform is masked, stop looking
            *stopLooking = 1;
        }

        // Mask this segment
        // - a mask overlapping waveformStartTime can't be fixed with interpolation
        // - zero out this segment in waveform
        vectorInit(&waveform->data[taperStartSample], 1 + taperEndSample - taperStartSample, 0.0);
        mask.isFixed = 0;
    }
    else if (mask.endTime >= waveformEndTime)
    {
        // Handle masks overlapping waveformEndTime
        taperStartSample = lround((mask.startTime - waveformStartTime) * waveform->sampleRateHz);
        taperEndSample = waveform->sampleCount;

        // Mask this segment
        // - a mask overlapping waveformEndTime can't be fixed with interpolation
        // - zero out this segmetn in waveform
        vectorInit(&waveform->data[taperStartSample], 1 + taperEndSample - taperStartSample, 0.0);
        mask.isFixed = 0;
    }
    else
    {
        // handle masks completely within waveform
        taperStartSample = lround((mask.startTime - waveformStartTime) * waveform->sampleRateHz);
        taperEndSample = lround((mask.endTime - waveformStartTime) * waveform->sampleRateHz);

        // Mask this segment
        // - check if it should be fixed (fix_type)
        // - if interpolation is requested and duration is under the threshold, fix the waveform segment
        // - otherwise zero out this segment in waveform

        // Check if fixing masked valeus by interpolation
        if (processingMaskDefinition->fixType == INTERPOLATE && allowInterpolation)
        {
            interpolate(&mask, waveform, processingMaskDefinition->fixThreshold, taperStartSample, taperEndSample);
        }
        else
        {
            // Else waveform should not be fixed
            // - mask by setting to zero
            vectorInit(&waveform->data[taperStartSample], 1 + taperEndSample - taperStartSample, 0.0);
            mask.isFixed = 0;
        }
    }
}

int qcFixHelper(const ProcessingMaskDefinition *processingMaskDefinition, ProcessingWaveform *waveform, int interpolate, int processingMaskCount, ProcessingMask *masks)
{
    // Remove time shift so mask times line up with waveform times
    double waveformStartTime = waveform->startTime;
    double waveformEndTime = waveform->endTime ;

    int stopLooking = 0;
    int* sampleMasked = (int*) calloc(waveform->sampleCount, waveform->sampleCount * sizeof(int));
    for (int m = 0; m < processingMaskCount && stopLooking == 0; m++)
    {
        ProcessingMask mask = masks[m];
        mask.isFixed = 0;
        if (mask.startTime < waveformEndTime && mask.endTime > waveformStartTime)
        {
            applySingleMask(mask, processingMaskDefinition, waveformStartTime, waveformEndTime, waveform, &stopLooking, interpolate);
        }
    }

    free(sampleMasked);
    return SUCCESS;
}

int applySingleMaskToWaveform(ProcessingMask *mask, 
                              const ProcessingMaskDefinition *processingMaskDefinition, 
                              ProcessingWaveform *waveform, 
                              int allowInterpolation)
{
    long taperStartSample;
    long taperEndSample;

    int stopLooking = 0;
    // Handle masks overlapping waveformStartTime
    if (mask->startTime <= waveform->startTime)
    {
        if (mask->endTime < waveform->endTime)
        {
            taperStartSample = 0;
            taperEndSample = 1 + lround((mask->endTime - waveform->startTime) * waveform->sampleRateHz);
        } 
        else
        {
            // this mask covers the whole waveform
            taperStartSample = 0;
            taperEndSample = waveform->sampleCount;

            // if the whole waveform is masked, stop looking
            stopLooking = 1;
        }

        // Mask this segment
        // - a mask overlapping waveformStartTime can't be fixed with interpolation
        // - zero out this segment in waveform
        vectorInit(&waveform->data[taperStartSample], taperEndSample - taperStartSample, 0.0);
        mask->isFixed = 0;
    }
    else if (mask->endTime >= waveform->endTime)
    {
        // Handle masks overlapping waveformEndTime
        taperStartSample = lround((mask->startTime - waveform->startTime) * waveform->sampleRateHz);
        taperEndSample = waveform->sampleCount;

        // Mask this segment
        // - a mask overlapping waveformEndTime can't be fixed with interpolation
        // - zero out this segmetn in waveform
        vectorInit(&waveform->data[taperStartSample], taperEndSample - taperStartSample, 0.0);
        mask->isFixed = 0;
    }
    else
    {
        // handle masks completely within waveform
        taperStartSample = lround((mask->startTime - waveform->startTime) * waveform->sampleRateHz);
        taperEndSample = lround((mask->endTime - waveform->startTime) * waveform->sampleRateHz);

        // Mask this segment
        // - check if it should be fixed (fix_type)
        // - if interpolation is requested and duration is under the threshold, fix the waveform segment
        // - otherwise zero out this segment in waveform

        // Check if fixing masked valeus by interpolation
        if (processingMaskDefinition->fixType == INTERPOLATE && allowInterpolation)
        {
            interpolate(mask, waveform, processingMaskDefinition->fixThreshold, taperStartSample, taperEndSample);
        }
        else
        {
            // Else waveform should not be fixed
            // - mask by setting to zero
            vectorInit(&(waveform->data[taperStartSample]), 1 + taperEndSample - taperStartSample, 0.0);
            mask->isFixed = 0;
        }
    }

    return stopLooking;
}

int isChannelFullyMasked(const int* waveformFullyMasked, long waveformCount)
{
    int fullyMasked = 0;
    for (int i = 0; i < waveformCount; i++)
    {
        fullyMasked &= waveformFullyMasked[i];
    }

    return fullyMasked;
}

void addMaskToWaveform(ProcessingMask mask, ProcessingChannelSegment* channelSegment, int waveformIndex, int expectedMasksPerWaveform)
{
    if (channelSegment->waveforms[waveformIndex].processingMaskCount >= expectedMasksPerWaveform)
    {
        int currentSize = channelSegment->waveforms[waveformIndex].processingMaskCount / expectedMasksPerWaveform;
        if (channelSegment->waveforms[waveformIndex].processingMaskCount + 1 > currentSize * expectedMasksPerWaveform)
        {
            channelSegment->waveforms[waveformIndex].maskedBy = (ProcessingMask*) realloc(channelSegment->waveforms[waveformIndex].maskedBy, (currentSize + 1) * expectedMasksPerWaveform * sizeof(ProcessingMask));
        }
    }

    channelSegment->waveforms[waveformIndex].maskedBy[channelSegment->waveforms[waveformIndex].processingMaskCount].startTime = mask.startTime;
    channelSegment->waveforms[waveformIndex].maskedBy[channelSegment->waveforms[waveformIndex].processingMaskCount].endTime = mask.endTime;
    channelSegment->waveforms[waveformIndex].maskedBy[channelSegment->waveforms[waveformIndex].processingMaskCount].isFixed = mask.isFixed;
    channelSegment->waveforms[waveformIndex].processingMaskCount++;
}

int qcFixChannelSegmentHelper(const ProcessingMaskDefinition *processingMaskDefinition, 
                              ProcessingChannelSegment *channelSegment, 
                              int allowInterpolation)
{
    if (channelSegment->processingMaskCount == 0 || channelSegment->waveformCount == 0)
    {
        return SUCCESS;
    }

    int *waveformFullyMasked = (int*) calloc(channelSegment->waveformCount, sizeof(int));
    int channelSegmentFullyMasked = 0;
    int expectedMasksPerWaveform = channelSegment->processingMaskCount / channelSegment->waveformCount;
    if (expectedMasksPerWaveform == 0)
    {
        expectedMasksPerWaveform = 1;
    }

    for (int i = 0; i < channelSegment->waveformCount; i++) 
    {
        channelSegment->waveforms[i].maskedBy = (ProcessingMask*) malloc(expectedMasksPerWaveform * sizeof(ProcessingMask));
    }

    for (int i = 0; i < channelSegment->processingMaskCount && !channelSegmentFullyMasked; i++)
    {
        ProcessingMask mask = channelSegment->masksToApply[i];
        for (int j = 0; j < channelSegment->waveformCount && !channelSegmentFullyMasked; j++)
        {
            if (!waveformFullyMasked[j] && mask.endTime >= channelSegment->waveforms[j].startTime && mask.startTime <= channelSegment->waveforms[j].endTime)
            {   
                int fullyMasked = applySingleMaskToWaveform(&mask, processingMaskDefinition, &channelSegment->waveforms[j] , allowInterpolation);
                waveformFullyMasked[j] |= fullyMasked;
                channelSegmentFullyMasked = isChannelFullyMasked(waveformFullyMasked, channelSegment->waveformCount);
                addMaskToWaveform(mask, channelSegment, j, expectedMasksPerWaveform);
            }
        }
    }

    // cleanup any overallocated memory
    for (int i = 0; i < channelSegment->waveformCount; i++)
    {
        if (channelSegment->waveforms[i].processingMaskCount > 0)
        {
            channelSegment->waveforms[i].maskedBy = (ProcessingMask*) realloc(channelSegment->waveforms[i].maskedBy, channelSegment->waveforms[i].processingMaskCount * sizeof(ProcessingMask));
        }
        else
        {
            free(channelSegment->waveforms[i].maskedBy);
            channelSegment->waveforms[i].maskedBy = (ProcessingMask*) NULL;
        }
    }

    free(waveformFullyMasked);

    return SUCCESS;
}

int qcFixChannelSegment(const ProcessingMaskDefinition *processingMaskDefinition,
                        ProcessingChannelSegment *channelSegment)
{
    return qcFixChannelSegmentHelper(processingMaskDefinition, channelSegment, 1);
}

int qcFixZeroOnly(const ProcessingMaskDefinition *processingMaskDefinition, 
                         ProcessingWaveform *waveform,
                         int processingMaskCount,
                         ProcessingMask *processingMasks)
{
    return qcFixHelper(processingMaskDefinition, waveform, 0, processingMaskCount, processingMasks);
}

int compareMasks(const void *mask1, const void *mask2)
{
    long startTime1 = lround(((const ProcessingMask*) mask1)->startTime * 1000);
    long endTime1 = lround(((const ProcessingMask*) mask1)->endTime * 1000);
    long startTime2 = lround(((const ProcessingMask*) mask2)->startTime * 1000);
    long endTime2 = lround(((const ProcessingMask*) mask2)->endTime * 1000);

    if (startTime1 == startTime2)
    {
        return (int) (endTime1 - endTime2);
    }
    else
    {
        return (int) (startTime1 - startTime2);
    }
}

void updateMaskSamples(long *startSample, long *endSample, int currentMask, int maskCount, const ProcessingMask *masks, const ProcessingWaveform *waveform)
{
    if (currentMask < maskCount && masks[currentMask].startTime <= waveform->endTime && masks[currentMask].endTime >= waveform->startTime)
    {
        *startSample = lround((masks[currentMask].startTime - waveform->startTime) * waveform->sampleRateHz);
        *endSample = lround((masks[currentMask].endTime - waveform->startTime) * waveform->sampleRateHz); 
    }
    else
    {
        *startSample = waveform->sampleCount;
        *endSample = -1;
    }
}

double qcMean(const ProcessingChannelSegment *channelSegment)
{
    int zeroMaskCount = 0;
    for (int i = 0; i < channelSegment->processingMaskCount; i++)
    {
        if (!channelSegment->masksToApply[i].isFixed)
        {
            zeroMaskCount++;
        }
    }

    ProcessingMask *zeroMasks = (ProcessingMask*) NULL;
    if (zeroMaskCount > 0)
    {
        zeroMasks = (ProcessingMask*) malloc(zeroMaskCount * sizeof(ProcessingMask));
        for (int i = 0, j = 0; i < channelSegment->processingMaskCount && j < zeroMaskCount; i++)
        {
            if (!channelSegment->masksToApply[i].isFixed)
            {
                zeroMasks[j] = channelSegment->masksToApply[i];
                j++;
            }
        }   

        qsort(zeroMasks, zeroMaskCount, sizeof(ProcessingMask), compareMasks);
    }

    double sum = 0;
    long count = 0;
    long maskStartSample = -1;
    long maskEndSample = -1;

    for (int i = 0, m = 0; i < channelSegment->waveformCount; i++)
    {
        ProcessingWaveform waveform = channelSegment->waveforms[i];
        updateMaskSamples(&maskStartSample, &maskEndSample, m, zeroMaskCount, zeroMasks, &waveform);

        for (int j = 0; j < waveform.sampleCount; j++)
        {
            if (j < maskStartSample)
            {
                sum += waveform.data[j];
                count++;
            }   

            if (j == maskEndSample)
            {
                m++;
                updateMaskSamples(&maskStartSample, &maskEndSample, m, zeroMaskCount, zeroMasks, &waveform);
            }
        }
    }

    double mean = sum / (double) count;

    if (zeroMasks)
    {
        free(zeroMasks);
    }

    return mean;
}

int qcDemean(const ProcessingChannelSegment *channelSegment)
{
    double mean = qcMean(channelSegment);

    int zeroMaskCount = 0;
    for (int i = 0; i < channelSegment->processingMaskCount; i++)
    {
        if (!channelSegment->masksToApply[i].isFixed)
        {
            zeroMaskCount++;
        }
    }

    ProcessingMask *zeroMasks = (ProcessingMask*) NULL;
    if (zeroMaskCount > 0)
    {
        zeroMasks = (ProcessingMask*) malloc(zeroMaskCount * sizeof(ProcessingMask));
        for (int i = 0, j = 0; i < channelSegment->processingMaskCount && j < zeroMaskCount; i++)
        {
            if (!channelSegment->masksToApply[i].isFixed)
            {
                zeroMasks[j] = channelSegment->masksToApply[i];
                j++;
            }
        }   

        qsort(zeroMasks, zeroMaskCount, sizeof(ProcessingMask), compareMasks);
    }

    long maskStartSample = -1;
    long maskEndSample = -1;

    for (int i = 0, m = 0; i < channelSegment->waveformCount; i++)
    {
        ProcessingWaveform waveform = channelSegment->waveforms[i];
        updateMaskSamples(&maskStartSample, &maskEndSample, m, zeroMaskCount, zeroMasks, &waveform);

        for (int j = 0; j < waveform.sampleCount; j++)
        {
            if (j < maskStartSample)
            {
                waveform.data[j] -= mean;
            }   

            if (j == maskEndSample)
            {
                m++;
                updateMaskSamples(&maskStartSample, &maskEndSample, m, zeroMaskCount, zeroMasks, &waveform);
            }
        }
    }

    if (zeroMasks)
    {
        free(zeroMasks);
    }

    return SUCCESS;
}