#include "missingInputChannels.h"


int getMissingInputChannelsFor(ProcessingChannelSegment channelSegment,
    TimeRange targetTimeRange,
    double sampleRateHz,
    MissingInputChannelTimeRanges* missingTimeRanges)
{
    if (channelSegment.endTime <= targetTimeRange.startTime || channelSegment.startTime >= targetTimeRange.endTime)
    {
        missingTimeRanges->timeRangeCount = 1;
        missingTimeRanges->timeRanges = (TimeRange*)malloc(sizeof(TimeRange));
        missingTimeRanges->timeRanges[0].startTime = targetTimeRange.startTime;
        missingTimeRanges->timeRanges[0].endTime = targetTimeRange.endTime;
        return 1;
    }

    double samplePeriod = 1 / sampleRateHz;
    double previousEndTime = targetTimeRange.startTime - samplePeriod;

    int gapCount = 0;
    int *gapStartWaveform = (int*) malloc((channelSegment.waveformCount + 2) * sizeof(int));
    int *gapEndWaveform = (int*) malloc((channelSegment.waveformCount + 2) * sizeof(int));  
    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        ProcessingWaveform waveform = channelSegment.waveforms[i];
        if (waveform.endTime >= targetTimeRange.startTime &&
            waveform.startTime <= targetTimeRange.endTime &&
            previousEndTime + samplePeriod < waveform.startTime)
        {
            gapStartWaveform[gapCount] = i - 1;
            gapEndWaveform[gapCount] = i;
            gapCount++;
        }

        previousEndTime = waveform.endTime;
    }

    if (previousEndTime < targetTimeRange.endTime)
    {
        gapStartWaveform[gapCount] = channelSegment.waveformCount - 1;
        gapEndWaveform[gapCount] = channelSegment.waveformCount;
        gapCount++;
    }

    missingTimeRanges->timeRangeCount = gapCount;
    if (gapCount == 0)
    {
        missingTimeRanges->timeRanges = (TimeRange*) NULL;
        free(gapStartWaveform);
        free(gapEndWaveform);
        return 0;
    }

    if (channelSegment.channelName)
    {
        missingTimeRanges->channelName = malloc(strlen(channelSegment.channelName) + 1);
        strcpy(missingTimeRanges->channelName, channelSegment.channelName);
        missingTimeRanges->timeRanges = (TimeRange*) malloc(gapCount * sizeof(TimeRange));
    }

    int unused = 0;
    for (int i = 0; i < gapCount; i++)
    {
        double gapStart;
        double gapEnd;
        if (gapStartWaveform[i] < 0)
        {
            gapStart = targetTimeRange.startTime;
        }
        else
        {
            gapStart = channelSegment.waveforms[gapStartWaveform[i]].endTime + samplePeriod;
        }

        if (gapEndWaveform[i] >= channelSegment.waveformCount)
        {
            gapEnd = targetTimeRange.endTime;
        }
        else
        {
            gapEnd = channelSegment.waveforms[gapEndWaveform[i]].startTime - samplePeriod;
        }

        if (gapEnd < gapStart)
        {
            gapEnd = gapStart;   
        }

        if (gapStart <= targetTimeRange.startTime && gapEnd >= targetTimeRange.endTime)
        {
            unused = 1;
        }

        missingTimeRanges->timeRanges[i].startTime = gapStart;
        missingTimeRanges->timeRanges[i].endTime = gapEnd;
    }

    free(gapStartWaveform);
    free(gapEndWaveform);

    return unused;
}