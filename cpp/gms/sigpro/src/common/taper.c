#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "taper.h"

#define TWO_PI 2.0 * M_PI
#define SQR(x) (x * x)

/*
 * Performs an in-place blackman taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 */
double blackmanTaper(double* data, long sampleCount)
{
    double factor = 0.0;
    double taperArea = 0.0;

    for (int i = 0; i < sampleCount; i++)
    {
        factor = (0.42 - 0.5 * cos(i * TWO_PI / (sampleCount - 1)) + 0.08 * cos(i * 2.0 * TWO_PI / (sampleCount - 1)));
        data[i] *= factor;
        taperArea += factor;
    }

    if (taperArea)
    {
        return sampleCount / taperArea;
    }
    else
    {
        return 1.0;
    }
}

/*
 * Performs an in-place cosine taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 *  startValue - the percentage of the data from the first sample to taper in the forward direction
 *  endValue - the percentage of the data from the last sample to taper in the reverse direction
 */
double cosineTaper(double data[], long sampleCount, double start, double end)
{
    double* dataCopy = (double*)malloc(sampleCount * sizeof(double));
    memmove(dataCopy, data, sampleCount * sizeof(double));

    start = start > 1.0 ? 1.0 : start;
    end = end > 1.0 ? 1.0 : end;

    int i1 = (int)(start * (double)sampleCount + 0.5);
    int i2 = (int)(end * (double)sampleCount + 0.5);

    double angle = M_PI / (double)i1;
    double taperArea = 0.0;
    int unitArea = 0;
    for (int i = 0; i < i1; i++)
    {
        double factor = (1.0 - cos(angle * (double)i)) * 0.5;
        data[i] = dataCopy[i] * factor;
        taperArea += factor;
        unitArea++;
    }

    angle = M_PI / (double)i2;
    for (int i = 0; i < i2; i++)
    {
        double factor = (1.0 - cos(angle * (double)i)) * 0.5;
        data[sampleCount - i - 1] = dataCopy[sampleCount - i - 1] * factor;
        taperArea += factor;
        unitArea++;
    }

    free(dataCopy);

    if (taperArea)
    {
        return (double)unitArea / taperArea;
    }
    else
    {
        return 1.0;
    }
}

/*
 * Performs an in-place hamming taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 */
double hammingTaper(double* data, long sampleCount)
{
    int m1 = sampleCount * 0.5 + 0.5;
    double angle = M_PI / (double)m1;
    double taperArea = 0.0;
    for (int i = 0; i < m1; i++)
    {
        int x_i = i + 1;
        double cs = (1.0 - cos(x_i * angle)) / 2.0;
        data[i] *= cs;
        taperArea += cs;
    }

    int m3 = m1;
    int m5 = sampleCount - m3;

    for (int i = m5; i < sampleCount; i++)
    {
        int x_i = i - sampleCount;
        double cs = (1.0 - cos(x_i * angle)) / 2.0;
        data[i] *= cs;
        taperArea += cs;
    }

    if (taperArea)
    {
        return (double)sampleCount / taperArea;
    }
    else
    {
        return 1.0;
    }
}

/*
 * Performs an in-place hanning taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 */
double hanningTaper(double* data, long sampleCount)
{
    return cosineTaper(data, sampleCount, 0.5, 0.5);
}

/*
 * Performs an in-place parzen taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 */
double parzenTaper(double* data, long sampleCount)
{
    double denominator = 0.5 * (sampleCount + 1);
    double halfSignal = 0.5 * sampleCount;
    double taperArea = 0.0;
    for (int i = 0; i < sampleCount; i++)
    {
        double factor = 1.0 - fabs((double)i - halfSignal) / denominator;
        data[i] *= factor;
        taperArea += factor;
    }

    if (taperArea)
    {
        return (double)sampleCount / taperArea;
    }
    else
    {
        return 1.0;
    }
}

/*
 * Performs an in-place welch taper on the provided data
 * Input variables:
 *  data - the data to taper
 *  sampleCount - the size of the data to taper
 */
double welchTaper(double* data, long sampleCount)
{
    double taperArea = 0.0;
    double numerator = 0.5 * (sampleCount - 1);
    double denominator = 0.5 * (sampleCount + 1);
    for (int i = 0; i < sampleCount; i++)
    {
        double factor = 1.0 - SQR((i - numerator) / denominator);
        data[i] = data[i] * factor;
        taperArea += factor;
    }

    if (taperArea)
    {
        return (double)sampleCount / taperArea;
    }
    else
    {
        return 1.0;
    }
}

void taperSingleMask(const ProcessingMask *mask, ProcessingWaveform *waveform, double waveformStartTime, double waveformEndTime, long taperLengthSamples)
{
    // TODO: How to handle drop through, which seems to mean if the masked region is short
    // enough, we don't worry about tapering around it
    long maskStartSample = (long)((mask->startTime - waveformStartTime) * waveform->sampleRateHz);
    long maskEndSample = (long)((mask->endTime - waveformStartTime) * waveform->sampleRateHz);
    if (mask->endTime < waveformEndTime)
    {
        // only taper after the mask if it ends before the waveform does
        long reverseTaperStartSample = maskEndSample + 1;
        long taperSegmentLength = taperLengthSamples;
        long taperSegmentEndSample = reverseTaperStartSample + taperSegmentLength;
        if (taperSegmentEndSample > waveform->sampleCount)
        {
            taperSegmentLength = waveform->sampleCount - reverseTaperStartSample;
        }

        cosineTaper(&waveform->data[reverseTaperStartSample], taperSegmentLength, 1.0, 0.0);
    }

    if (mask->startTime > waveformStartTime) {
        // only taper before the mask if it starts after the waveform does
        long forwardTaperStartSample = maskStartSample - taperLengthSamples;
        long taperSegmentLength = taperLengthSamples;
        if (forwardTaperStartSample < 0)
        {
            forwardTaperStartSample = 0;
            taperSegmentLength = maskStartSample;
        }

        cosineTaper(&waveform->data[forwardTaperStartSample], taperSegmentLength, 0.0, 1.0);
    }
}

int qcTaper(ProcessingWaveform *waveform, const TaperDefinition *taperDefinition)
{
    double waveformStartTime = waveform->startTime;
    double waveformEndTime = waveformStartTime + (double)waveform->sampleCount / waveform->sampleRateHz;

    int taperLengthSamples = (int) (taperDefinition->taperLength * waveform->sampleRateHz);

    for (int i = 0; i < waveform->processingMaskCount; i++)
    {
        ProcessingMask mask = waveform->maskedBy[i];
        if (!mask.isFixed && mask.startTime <= waveformEndTime && mask.endTime > waveformStartTime)
        {
            // the inplace transform where we catch the fully overlapping mask after the first 
            // only works if the taper functions are strictly scaling values, not shifting as well.
            // I think this is true. 
            if (mask.startTime <= waveformStartTime && mask.endTime >= waveformEndTime)
            {
                // the entire waveform is masked (i.e., zero'd out, so tapering has no effect,
                // and there's nothing to taper anyway)  
                return SUCCESS;
            }

            taperSingleMask(&mask, waveform, waveformStartTime, waveformEndTime, taperLengthSamples);
        }
    }

    return SUCCESS;
}

void taperWaveformForSingleMask(const ProcessingMask *mask, ProcessingWaveform *waveform, const TaperDefinition *taperDefinition)
{
    int taperLengthSamples = (int) (taperDefinition->taperLength * waveform->sampleRateHz);

    // TODO: How to handle drop through, which seems to mean if the masked region is short
    // enough, we don't worry about tapering around it
    long maskStartSample = (long)((mask->startTime - waveform->startTime) * waveform->sampleRateHz);
    long maskEndSample = (long)((mask->endTime - waveform->startTime) * waveform->sampleRateHz);


    if (mask->endTime < waveform->endTime)
    {
        // only taper after the mask if it ends before the waveform does
        long reverseTaperStartSample = maskEndSample + 1;
        long taperSegmentLength = taperLengthSamples;
        long taperSegmentEndSample = reverseTaperStartSample + taperSegmentLength;
        if (taperSegmentEndSample > waveform->sampleCount)
        {
            taperSegmentLength = waveform->sampleCount - reverseTaperStartSample;
        }

        // TODO: Determine when we should actually use the other taper functions
        cosineTaper(&waveform->data[reverseTaperStartSample], taperSegmentLength, 1.0, 0.0);
    }

    if (mask->startTime > waveform->startTime) {
        // only taper before the mask if it starts after the waveform does
        long forwardTaperStartSample = maskStartSample - taperLengthSamples;
        long taperSegmentLength = taperLengthSamples;
        if (forwardTaperStartSample < 0)
        {
            forwardTaperStartSample = 0;
            taperSegmentLength = maskStartSample;
        }

        cosineTaper(&waveform->data[forwardTaperStartSample], taperSegmentLength, 0.0, 1.0);
    }
}

int qcTaperChannelSegment(const TaperDefinition *taperDefinition, ProcessingChannelSegment *channelSegment)
{
    if (channelSegment->processingMaskCount == 0 || channelSegment->waveformCount == 0)
    {
        return SUCCESS;
    }

    for (int i = 0; i < channelSegment->processingMaskCount; i++)
    {
        ProcessingMask mask = channelSegment->masksToApply[i];
        for (int j = 0; j < channelSegment->waveformCount; j++)
        {
            ProcessingWaveform waveform = channelSegment->waveforms[j];
            if (mask.startTime <= waveform.endTime && mask.endTime >= waveform.startTime)
            {
                taperWaveformForSingleMask(&mask, &waveform, taperDefinition);
            }
        }
    }

    return SUCCESS;
}

int endpointTaper(ProcessingWaveform *waveform, const TaperDefinition *taperDefinition, TAPER_DIRECTION direction)
{
    long taperSamples = (long) (taperDefinition->taperLength * waveform->sampleRateHz);

    if (taperSamples > waveform->sampleCount / 2)
    {
        taperSamples = waveform->sampleCount / 2;
    }

    for (int i = 0; i < taperSamples; i++)
    {
        double taperWeight = 0.5 - 0.5 * cos(M_PI * i / (double) taperSamples);
        if (direction == FORWARD || direction == BOTH)
        {
           waveform->data[i] = taperWeight * waveform->data[i];
        }
        
        if (direction == REVERSE || direction == BOTH) {
            long reverseTaperIndex = waveform->sampleCount - i;
            waveform->data[reverseTaperIndex] = taperWeight * waveform->data[reverseTaperIndex];
        }
    }

    return SUCCESS;
}

int endpointTaperChannelSegment(const TaperDefinition *taperDefinition, ProcessingChannelSegment *channelSegment, TAPER_DIRECTION direction)
{
    if (channelSegment->waveformCount == 0)
    {
        return SUCCESS;
    }

    for (int i = 0; i < channelSegment->waveformCount; i++) 
    {
        endpointTaper(&channelSegment->waveforms[i], taperDefinition, direction);
    }

    return SUCCESS;
}