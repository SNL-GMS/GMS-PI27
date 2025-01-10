#include "QcChannelSegmentTest.hh"

ProcessingChannelSegment QcChannelSegmentTest::buildSingleWaveformChannelSegment()
{
    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));

    channelSegment.masksToApply[0].processingOperation = EVENT_BEAM;
    channelSegment.masksToApply[0].startTime = 1.5;
    channelSegment.masksToApply[0].endTime = 1.725;
    channelSegment.masksToApply[0].isFixed = 0;

    channelSegment.northDisplacementKm = 0.0;
    channelSegment.eastDisplacementKm = 0.0;
    channelSegment.verticalDisplacementKm = 0.0;
    channelSegment.startTime = 1.0;
    channelSegment.endTime = 11.0;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = 40.0;
    channelSegment.waveforms[0].startTime = 1.0;
    channelSegment.waveforms[0].endTime = 11.0 - (1 / 40.0);
    channelSegment.waveforms[0].sampleCount = 10 * 40;
    channelSegment.waveforms[0].processingMaskCount = 0;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) nullptr;
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));
 
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i % 10 == 0)
        {
            channelSegment.waveforms[0].data[i] = 10.0;
        }
        else
        {
            channelSegment.waveforms[0].data[i] = 1.0;
        }
    }

    return channelSegment;
}

ProcessingMaskDefinition QcChannelSegmentTest::buildZeroDefinition()
{
    ProcessingMaskDefinition definition;
    definition.fixType = ZERO;
    definition.fixThreshold = 10;

    return definition;
}

ProcessingMaskDefinition QcChannelSegmentTest::buildInterpolateDefinition()
{
    ProcessingMaskDefinition definition;
    definition.fixType = INTERPOLATE;
    definition.fixThreshold = 10;

    return definition;
}

TEST_F(QcChannelSegmentTest, ZERO_MASK_NO_OVERLAP_TEST)
{
    ProcessingMaskDefinition definition = buildZeroDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 12.0;
    channelSegment.masksToApply[0].endTime = 13.0;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i % 10 == 0)
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
        }
    }

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 0);

    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, START_OVERLAP_TEST)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 0.0;
    channelSegment.masksToApply[0].endTime = 2.0;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i > 40)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            printf("i = %d\n", i);
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 0.0);
    ASSERT_EQ(actualMask.endTime, 2.0);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, MASK_ENTIRE_WAVEFORM_TEST)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 0.0;
    channelSegment.masksToApply[0].endTime = 12.0;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 0.0);
    ASSERT_EQ(actualMask.endTime, 12.0);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, END_OVERLAP_TEST)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 10.0;
    channelSegment.masksToApply[0].endTime = 12.0;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 360)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else 
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 10.0);
    ASSERT_EQ(actualMask.endTime, 12.0);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, INTERPOLATE_INSIDE_WAVEFORM_TEST)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if ((i < 203 || i > 209) && i % 10 == 0)
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
        }
        else if (i >= 203 && i <= 209)
        {
            ASSERT_DOUBLE_EQ(channelSegment.waveforms[0].data[i], 1 + ((i % 10) - 2) * 1.125);
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 1);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, INTERPOLATE_INSIDE_WAVEFORM_OVER_THRESHOLD)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.5;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 203 || i > 220)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.5);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, ZERO_INSIDE_WAVEFORM_TEST)
{
    ProcessingMaskDefinition definition = buildZeroDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 203 || i > 209)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, ZERO_TWO_MASKS_NO_OVERLAP_TWO_VALID)
{
    ProcessingMaskDefinition definition = buildZeroDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;   

    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));

    ProcessingMask mask2;
    mask2.processingOperation = EVENT_BEAM;
    mask2.startTime = 4.025;
    mask2.endTime = 5.025;
    channelSegment.masksToApply[1] = mask2;
    channelSegment.processingMaskCount = 2;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);
    
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 121 || (i > 161 && i < 203) || i > 209)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else 
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 2);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 0);

    actualMask = channelSegment.waveforms[0].maskedBy[1];
    ASSERT_EQ(actualMask.startTime, 4.025);
    ASSERT_EQ(actualMask.endTime, 5.025);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, ZERO_TWO_MASKS_OVERLAP_TWO_VALID)
{
    ProcessingMaskDefinition definition = buildZeroDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;   

    ProcessingMask mask2;
    mask2.processingOperation = EVENT_BEAM;
    mask2.startTime = 5.5;
    mask2.endTime = 6.1;
    channelSegment.masksToApply[1] = mask2;
    channelSegment.processingMaskCount = 2;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);
    
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if ((i < 180 || i > 209))
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 2);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 0);

    actualMask = channelSegment.waveforms[0].maskedBy[1];
    ASSERT_EQ(actualMask.startTime, 5.5);
    ASSERT_EQ(actualMask.endTime, 6.1);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, INTERPOLATE_TWO_MASKS_NO_OVERLAP_TWO_VALID)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;   

    ProcessingMask mask2;
    mask2.processingOperation = EVENT_BEAM;
    mask2.startTime = 4.075;
    mask2.endTime = 4.225;
    channelSegment.masksToApply[1] = mask2;
    channelSegment.processingMaskCount = 2;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);
    
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if ((i < 123 || (i >= 129 && i < 203) || i > 209) && i % 10 == 0)
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
        }
        else if ((i >= 123 && i <= 129) || (i >= 203 && i <= 209))
        {
            ASSERT_DOUBLE_EQ(channelSegment.waveforms[0].data[i], 1 + ((i % 10) - 2) * 1.125);
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 2);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 1);

    actualMask = channelSegment.waveforms[0].maskedBy[1];
    ASSERT_EQ(actualMask.startTime, 4.075);
    ASSERT_EQ(actualMask.endTime, 4.225);
    ASSERT_EQ(actualMask.isFixed, 1);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, INTERPOLATE_TWO_MASKS_OVERLAP_TWO_VALID)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;   

    channelSegment.masksToApply[1].processingOperation = EVENT_BEAM;
    channelSegment.masksToApply[1].startTime = 6.0; 
    channelSegment.masksToApply[1].endTime = 6.1;
    channelSegment.processingMaskCount = 2;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);
    
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if ((i < 200 || i > 209) && i % 10 == 0)
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
        }
        else if (i >= 200 && i <= 204)
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 1 + ((i - 9) % 10) * 0.5625);
        }
        else if (i >= 205 && i <= 209)
        {
            ASSERT_DOUBLE_EQ(channelSegment.waveforms[0].data[i], 1 + ((i % 10) - 2) * 1.125);
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
        }
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 2);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 1);

    actualMask = channelSegment.waveforms[0].maskedBy[1];
    ASSERT_EQ(actualMask.startTime, 6.0);
    ASSERT_EQ(actualMask.endTime, 6.1);
    ASSERT_EQ(actualMask.isFixed, 1);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, TWO_MASKS_FULL_WAVEFORM_COVERAGE)
{
    ProcessingMaskDefinition definition = buildInterpolateDefinition();

    ProcessingChannelSegment channelSegment = buildSingleWaveformChannelSegment();
    channelSegment.masksToApply = (ProcessingMask*) realloc(channelSegment.masksToApply, 2 * sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 6.075;
    channelSegment.masksToApply[0].endTime = 6.225;   

    channelSegment.masksToApply[1].processingOperation = EVENT_BEAM;
    channelSegment.masksToApply[1].startTime = 0.0; 
    channelSegment.masksToApply[1].endTime = 12.0;
    channelSegment.processingMaskCount = 2;

    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);
    
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
    }  

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 2);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 6.075);
    ASSERT_EQ(actualMask.endTime, 6.225);
    ASSERT_EQ(actualMask.isFixed, 1);

    actualMask = channelSegment.waveforms[0].maskedBy[1];
    ASSERT_EQ(actualMask.startTime, 0.0);
    ASSERT_EQ(actualMask.endTime, 12.0);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}

TEST_F(QcChannelSegmentTest, SINGLE_MASK_OVERLAP_TWO_WAVEFORMS_TEST)
{
    ProcessingChannelSegment channelSegment;
    channelSegment.channelName = "Test";
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));

    channelSegment.masksToApply[0].processingOperation = EVENT_BEAM;
    channelSegment.masksToApply[0].startTime = 10.5;
    channelSegment.masksToApply[0].endTime = 11.5;
    channelSegment.masksToApply[0].isFixed = 0;

    channelSegment.northDisplacementKm = 0.0;
    channelSegment.eastDisplacementKm = 0.0;
    channelSegment.verticalDisplacementKm = 0.0;
    channelSegment.startTime = 1.0;
    channelSegment.endTime = 13.0;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));

    channelSegment.waveforms[0].sampleRateHz = 40.0;
    channelSegment.waveforms[0].startTime = 1.0;
    channelSegment.waveforms[0].endTime = 11.0;
    channelSegment.waveforms[0].sampleCount = 10 * 40;
    channelSegment.waveforms[0].processingMaskCount = 0;
    channelSegment.waveforms[0].maskedBy = (ProcessingMask*) nullptr;
    channelSegment.waveforms[0].data = (double*) malloc(channelSegment.waveforms[0].sampleCount * sizeof(double));
 
    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i % 10 == 0)
        {
            channelSegment.waveforms[0].data[i] = 10.0;
        }
        else
        {
            channelSegment.waveforms[0].data[i] = 1.0;
        }
    }

    channelSegment.waveforms[1].startTime = 11.25;
    channelSegment.waveforms[1].endTime = 13.0;
    channelSegment.waveforms[1].sampleRateHz = 40.0;
    channelSegment.waveforms[1].sampleCount = (13.0 - 11.25) * 40;
    channelSegment.waveforms[1].processingMaskCount  = 0;
    channelSegment.waveforms[1].maskedBy = (ProcessingMask*) nullptr;
    channelSegment.waveforms[1].data = (double*) malloc(channelSegment.waveforms[1].sampleCount * sizeof(double));

    for (int i = 0; i < channelSegment.waveforms[1].sampleCount; i++)
    {
        if (i % 10 == 0)
        {
            channelSegment.waveforms[1].data[i] = 10.0;
        }
        else
        {
            channelSegment.waveforms[1].data[i] = 1.0;
        }
    }


    ProcessingMaskDefinition definition = buildZeroDefinition();
    
    int status = qcFixChannelSegment(&definition, &channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 380)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[0].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
    }

    for (int i = 0; i < channelSegment.waveforms[1].sampleCount; i++)
    {
        if (i > 10)
        {
            if (i % 10 == 0)
            {
                ASSERT_EQ(channelSegment.waveforms[1].data[i], 10.0);
            }
            else
            {
                ASSERT_EQ(channelSegment.waveforms[1].data[i], 1.0);
            }
        }
        else
        {
            ASSERT_EQ(channelSegment.waveforms[1].data[i], 0.0);
        }
    }

    ASSERT_EQ(channelSegment.waveforms[0].processingMaskCount, 1);

    ProcessingMask actualMask = channelSegment.waveforms[0].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 10.5);
    ASSERT_EQ(actualMask.endTime, 11.5);
    ASSERT_EQ(actualMask.isFixed, 0);

    ASSERT_EQ(channelSegment.waveforms[1].processingMaskCount, 1);

    actualMask = channelSegment.waveforms[1].maskedBy[0];
    ASSERT_EQ(actualMask.startTime, 10.5);
    ASSERT_EQ(actualMask.endTime, 11.5);
    ASSERT_EQ(actualMask.isFixed, 0);

    free(channelSegment.waveforms[0].maskedBy);
    free(channelSegment.waveforms[0].data);
    free(channelSegment.waveforms[1].maskedBy);
    free(channelSegment.waveforms[1].data);
    free(channelSegment.masksToApply);
    free(channelSegment.waveforms);
}