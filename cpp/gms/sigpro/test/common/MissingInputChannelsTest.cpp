#include "MissingInputChannelsTest.hh"

TEST_F(MissingInputChannelsTest, NO_GAPS_SINGLE_WAVEFORM_TEST)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 0.5;
    waveform.endTime = 3.5;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = 0.5;
    channelSegment.endTime = 3.5;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = &waveform;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr; 

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);

    ASSERT_EQ(unused, 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 0);
}

TEST_F(MissingInputChannelsTest, CHANNEL_SEGMENT_BEFORE_TARGET_RANGE)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 0.0;
    waveform.endTime = 1.0;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = 0.0;
    channelSegment.endTime = 1.0;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = &waveform;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);
    
    ASSERT_EQ(unused, 1);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, targetTimeRange.startTime);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, targetTimeRange.endTime);

    free(timeRanges.timeRanges);
}

TEST_F(MissingInputChannelsTest, CHANNEL_SEGMENT_AFTER_TARGET_RANGE)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 3.0;
    waveform.endTime = 4.0;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = 3.0;
    channelSegment.endTime = 4.0;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = &waveform;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);
    
    ASSERT_EQ(unused, 1);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, targetTimeRange.startTime);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, targetTimeRange.endTime);

    free(timeRanges.timeRanges);
}

TEST_F(MissingInputChannelsTest, GAP_MID_TARGET_RANGE)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 0.0;
    waveform.endTime = 2.0;
    waveform.sampleRateHz = 40.0;

    ProcessingWaveform waveform2;
    waveform2.startTime = 2.5;
    waveform2.endTime = 4.0;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.startTime = 0.0;
    channelSegment.endTime = 4.0;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[0] = waveform;
    channelSegment.waveforms[1] = waveform2;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);
    
    ASSERT_EQ(unused, 0);
    ASSERT_EQ(strcmp(timeRanges.channelName, channelSegment.channelName), 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, 2.025);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, 2.475);

    free(channelSegment.waveforms);
    free(timeRanges.timeRanges);
}

TEST_F(MissingInputChannelsTest, GAP_OVERLAPS_START_TEST)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 1.5;
    waveform.endTime = 4.0;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.startTime = 1.5;
    channelSegment.endTime = 4.0;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = &waveform;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);
    
    ASSERT_EQ(unused, 0);
    ASSERT_EQ(strcmp(timeRanges.channelName, channelSegment.channelName), 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, 1.0);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, 1.475);

    free(timeRanges.timeRanges);
}

TEST_F(MissingInputChannelsTest, GAP_OVERLAPS_END_TEST)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform;
    waveform.startTime = 0.0;
    waveform.endTime = 2.5;
    waveform.sampleRateHz = 40.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.startTime = 0.0;
    channelSegment.endTime = 2.5;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = &waveform;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            sampleRateHz, 
                                            &timeRanges);
    
    ASSERT_EQ(unused, 0);
    ASSERT_EQ(strcmp(timeRanges.channelName, channelSegment.channelName), 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, 2.525);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, 3.0);

    free(timeRanges.timeRanges);
}

TEST_F(MissingInputChannelsTest, MULTIPLE_WAVEFORMS_NO_GAP_TEST)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform1;
    waveform1.startTime = 0.0;
    waveform1.endTime = 2.0;
    
    ProcessingWaveform waveform2;
    waveform2.startTime = 2.025;
    waveform2.endTime = 4.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = 0.0;
    channelSegment.endTime = 4.0;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[0] = waveform1;
    channelSegment.waveforms[1] = waveform2;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            40.0, 
                                            &timeRanges);

    ASSERT_EQ(unused, 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 0);

    free(channelSegment.waveforms);
}

TEST_F(MissingInputChannelsTest, SUB_SAMPLE_GAP_TEST)
{
    TimeRange targetTimeRange;
    targetTimeRange.startTime = 1.0;
    targetTimeRange.endTime = 3.0;

    ProcessingWaveform waveform1;
    waveform1.startTime = 0.0;
    waveform1.endTime = 2.0;
    
    ProcessingWaveform waveform2;
    waveform2.startTime = 2.026;
    waveform2.endTime = 4.0;

    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.startTime = 0.0;
    channelSegment.endTime = 4.0;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[0] = waveform1;
    channelSegment.waveforms[1] = waveform2;

    MissingInputChannelTimeRanges timeRanges;
    timeRanges.timeRangeCount = 0;
    timeRanges.timeRanges = (TimeRange*) nullptr;

    int unused = getMissingInputChannelsFor(channelSegment, 
                                            targetTimeRange, 
                                            40.0, 
                                            &timeRanges);

    ASSERT_EQ(unused, 0);
    ASSERT_EQ(strcmp(timeRanges.channelName, channelSegment.channelName), 0);
    ASSERT_EQ(timeRanges.timeRangeCount, 1);
    ASSERT_EQ(timeRanges.timeRanges[0].startTime, 2.025);
    ASSERT_EQ(timeRanges.timeRanges[0].endTime, 2.025);

    free(timeRanges.timeRanges);
    free(channelSegment.waveforms);
}