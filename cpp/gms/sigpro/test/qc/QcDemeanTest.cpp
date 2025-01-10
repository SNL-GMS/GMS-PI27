#include "QcDemeanTest.hh"

void QcDemeanTest::SetUp()
{
    ProcessingWaveform waveform;
    waveform.channelName = "Test";
    waveform.processingMaskCount = 0;
    waveform.maskedBy = NULL;
    waveform.northDisplacementKm = 0.0;
    waveform.eastDisplacementKm = 0.0;
    waveform.verticalDisplacementKm = 0.0;
    waveform.sampleRateHz = 40.0;
    waveform.startTime = 1.0;
    waveform.endTime = 11.0 - (1.0 / 40.0);
    waveform.sampleCount = 10 * 40;
    waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));
    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = i % 10;
    }       

    channelSegment.processingMaskCount = 0;
    channelSegment.masksToApply = (ProcessingMask*) NULL;
    channelSegment.waveformCount = 1;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(sizeof(ProcessingWaveform));
    channelSegment.waveforms[0] = waveform;
}

void QcDemeanTest::TearDown()
{
    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        if (channelSegment.waveforms[i].maskedBy)
        {
            free(channelSegment.waveforms[i].maskedBy);
        }   

        free(channelSegment.waveforms[i].data);
    }

    if (channelSegment.masksToApply)
    {
        free(channelSegment.masksToApply);
    }

    free(channelSegment.waveforms);
}

TEST_F(QcDemeanTest, QC_DEMEAN_SINGLE_WAVEFORM_NO_MASKS)
{
    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], (i % 10) - 4.5);
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_SINGLE_WAVEFORM_SINGLE_MASK_NO_OVERLAP)
{
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 0.25;
    channelSegment.masksToApply[0].endTime = 0.75;
    channelSegment.masksToApply[0].isFixed = 0;

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], (i % 10) - 4.5);
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_SINGLE_WAVEFORM_SINGLE_MASK_START_OVERLAP)
{
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 0.25;
    channelSegment.masksToApply[0].endTime = 1.95;
    channelSegment.masksToApply[0].isFixed = 0;

    for (int i = 0; i < 39; i++)
    {
        channelSegment.waveforms[0].data[i] = 0.0;
    }

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i < 39)
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
        else
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], (i % 10) - 4.512465374);
        }
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_SINGLE_WAVEFORM_SINGLE_MASK_FULLY_CONTAINED)
{
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 1.95;
    channelSegment.masksToApply[0].endTime = 2.25;
    channelSegment.masksToApply[0].isFixed = 0;

    for (int i = 38; i < 51; i++)
    {
        channelSegment.waveforms[0].data[i] = 0.0;
    }

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i >= 38 && i < 51)
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
        else 
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], (i % 10) - 4.490956072);
        }
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_SINGLE_WAVEFORM_SINGLE_MASK_END_OVERLAP)
{
    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 10.30;
    channelSegment.masksToApply[0].endTime = 12.0;
    channelSegment.masksToApply[0].isFixed = 0;

    for (int i = 372; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = 0.0;
    }

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        if (i >= 372)
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], 0.0);
        }
        else
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[0].data[i], (i % 10) - 4.478494623655914);
        }
    }
}

TEST_F(QcDemeanTest, QC_MEAN_TWO_WAVEFORMS_NO_MASKS)
{
    ProcessingWaveform waveform;
    waveform.startTime = 12.0;
    waveform.endTime = 14.525;
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    waveform.maskedBy = (ProcessingMask*) NULL;
    waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = i % 10;
    }

    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) realloc(channelSegment.waveforms, 2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[1] = waveform;

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        for (int j = 0; j < channelSegment.waveforms[i].sampleCount; j++)
        {
            ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], (j % 10) - 4.484063745);
        }
    }
}

TEST_F(QcDemeanTest, QC_MEAN_TWO_WAVEFORMS_SINGLE_MASK_BOTH_OVERLAP)
{
    ProcessingWaveform waveform;
    waveform.startTime = 12.0;
    waveform.endTime = 14.525;
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    waveform.maskedBy = (ProcessingMask*) NULL;
    waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        if (i < 21)
        {
            waveform.data[i] = 0.0;
        }
        else 
        {
            waveform.data[i] = i % 10;
        }
    }

    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) realloc(channelSegment.waveforms, 2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[1] = waveform;

    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 10.30;
    channelSegment.masksToApply[0].endTime = 12.50;
    channelSegment.masksToApply[0].isFixed = 0;

    for (int i = 372; i < channelSegment.waveforms[0].sampleCount; i++)
    {
        channelSegment.waveforms[0].data[i] = 0.0;
    }

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        for (int j = 0; j < channelSegment.waveforms[i].sampleCount; j++)
        {
            if ((i == 0 && j > 371) || (i == 1 && j < 21))
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], 0.0);
            }
            else 
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], (j % 10) - 4.474613687);
            }
        }
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_TWO_WAVEFORMS_ONE_MASK_ON_FIRST)
{
    ProcessingWaveform waveform;
    waveform.startTime = 12.0;
    waveform.endTime = 14.525;
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    waveform.maskedBy = (ProcessingMask*) NULL;
    waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        waveform.data[i] = i % 10;
    }

    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) realloc(channelSegment.waveforms, 2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[1] = waveform;

    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 1.95;
    channelSegment.masksToApply[0].endTime = 2.25;
    channelSegment.masksToApply[0].isFixed = 0;

    for (int i = 38; i < 51; i++)
    {
        channelSegment.waveforms[0].data[i] = 0.0;
    }

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        for (int j = 0; j < channelSegment.waveforms[i].sampleCount; j++)
        {
            if (i == 0 && j >= 38 && j < 51)
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], 0.0); 
            }
            else
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], (j % 10) - 4.476482618);
            }
        }
    }
}

TEST_F(QcDemeanTest, QC_DEMEAN_TWO_WAVEFORMS_ONE_MASK_ON_SECOND)
{
    ProcessingWaveform waveform;
    waveform.startTime = 12.0;
    waveform.endTime = 14.525;
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = lround((14.525 - 12.0) * 40.0) + 1;
    waveform.maskedBy = (ProcessingMask*) NULL;
    waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

    for (int i = 0; i < waveform.sampleCount; i++)
    {
        if (i >= 38 && i < 51)
        {
            waveform.data[i] = 0.0;
        }
        else 
        {
            waveform.data[i] = i % 10;
        }
    }

    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) realloc(channelSegment.waveforms, 2 * sizeof(ProcessingWaveform));
    channelSegment.waveforms[1] = waveform;

    channelSegment.processingMaskCount = 1;
    channelSegment.masksToApply = (ProcessingMask*) malloc(sizeof(ProcessingMask));
    channelSegment.masksToApply[0].startTime = 12.95;
    channelSegment.masksToApply[0].endTime = 13.25;
    channelSegment.masksToApply[0].isFixed = 0;

    int status = qcDemean(&channelSegment);

    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < channelSegment.waveformCount; i++)
    {
        for (int j = 0; j < channelSegment.waveforms[i].sampleCount; j++)
        {
            if (i == 1 && j >= 38 && j < 51)
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], 0.0);
            }
            else
            {
                ASSERT_FLOAT_EQ(channelSegment.waveforms[i].data[j], (j % 10) - 4.476482618);
            }
        }   
    }
}