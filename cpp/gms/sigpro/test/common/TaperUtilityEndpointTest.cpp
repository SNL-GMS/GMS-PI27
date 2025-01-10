#include "TaperUtilityEndpointTest.hh"

void TaperUtilityEndpointTest::SetUp()
{
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = 120;
    waveform.data = (double*) malloc(TestData::THREE_SECOND_DATA_SIZE * sizeof(double));
    memcpy(waveform.data, TestData::THREE_SECOND_DATA.data(), TestData::THREE_SECOND_DATA_SIZE * sizeof(double));

    taperDefinition.taperFunction = COSINE;
    taperDefinition.taperLength = 1.0;
}

void TaperUtilityEndpointTest::TearDown()
{
}

TEST_F(TaperUtilityEndpointTest, FORWARD_ENDPOINT_TAPER_TEST)
{
    int status = endpointTaper(&waveform, &taperDefinition, FORWARD);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
    {
        ASSERT_NEAR(waveform.data[i], TestData::TAPER_FWD_RESULTS.at(i), error);
    }

    free(waveform.data);
}

TEST_F(TaperUtilityEndpointTest, REVERSE_ENDPOINT_TAPER_TEST)
{
    int status = endpointTaper(&waveform, &taperDefinition, REVERSE);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
    {
        ASSERT_NEAR(waveform.data[i], TestData::TAPER_REV_RESULTS.at(i), error);
    }

    free(waveform.data);
}

TEST_F(TaperUtilityEndpointTest, BOTH_ENDPOINT_TAPER_TEST)
{
    int status = endpointTaper(&waveform, &taperDefinition, BOTH);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
    {
        ASSERT_NEAR(waveform.data[i], TestData::TAPER_BOTH_RESULTS.at(i), error);
    }

    free(waveform.data);
}

TEST_F(TaperUtilityEndpointTest, TAPER_CHANNEL_SEGMENT_FORWARD_TEST)
{
    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = waveform.startTime;
    channelSegment.endTime = waveform.endTime * 2 + 0.5;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));

    channelSegment.waveforms[0] = waveform;

    channelSegment.waveforms[1].startTime = waveform.endTime + 0.5;
    channelSegment.waveforms[1].endTime = waveform.endTime + 0.5 + waveform.endTime;
    channelSegment.waveforms[1].sampleRateHz = waveform.sampleRateHz;
    channelSegment.waveforms[1].sampleCount = waveform.sampleCount;
    channelSegment.waveforms[1].data = (double*) malloc(waveform.sampleCount * sizeof(double));
    memcpy(channelSegment.waveforms[1].data, waveform.data, waveform.sampleCount * sizeof(double));

    int status = endpointTaperChannelSegment(&taperDefinition, &channelSegment, FORWARD);

    for (int j = 0; j < 2; j++)
    {
        for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
        {
            ASSERT_NEAR(waveform.data[i], TestData::TAPER_FWD_RESULTS.at(i), error);
        }
    }

    free(waveform.data);
    free(channelSegment.waveforms[1].data);
    free(channelSegment.waveforms);
}

TEST_F(TaperUtilityEndpointTest, TAPER_CHANNEL_SEGMENT_REVERSE_TEST)
{
    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = waveform.startTime;
    channelSegment.endTime = waveform.endTime * 2 + 0.5;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));

    channelSegment.waveforms[0] = waveform;

    channelSegment.waveforms[1].startTime = waveform.endTime + 0.5;
    channelSegment.waveforms[1].endTime = waveform.endTime + 0.5 + waveform.endTime;
    channelSegment.waveforms[1].sampleRateHz = waveform.sampleRateHz;
    channelSegment.waveforms[1].sampleCount = waveform.sampleCount;
    channelSegment.waveforms[1].data = (double*) malloc(waveform.sampleCount * sizeof(double));
    memcpy(channelSegment.waveforms[1].data, waveform.data, waveform.sampleCount * sizeof(double));

    int status = endpointTaperChannelSegment(&taperDefinition, &channelSegment, REVERSE);

    for (int j = 0; j < 2; j++)
    {
        for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
        {
            ASSERT_NEAR(waveform.data[i], TestData::TAPER_REV_RESULTS.at(i), error);
        }
    }

    free(waveform.data);
    free(channelSegment.waveforms[1].data);
    free(channelSegment.waveforms);
}

TEST_F(TaperUtilityEndpointTest, TAPER_CHANNEL_SEGMENT_BOTH_TEST)
{
    ProcessingChannelSegment channelSegment;
    channelSegment.startTime = waveform.startTime;
    channelSegment.endTime = waveform.endTime * 2 + 0.5;
    channelSegment.waveformCount = 2;
    channelSegment.waveforms = (ProcessingWaveform*) malloc(2 * sizeof(ProcessingWaveform));

    channelSegment.waveforms[0] = waveform;

    channelSegment.waveforms[1].startTime = waveform.endTime + 0.5;
    channelSegment.waveforms[1].endTime = waveform.endTime + 0.5 + waveform.endTime;
    channelSegment.waveforms[1].sampleRateHz = waveform.sampleRateHz;
    channelSegment.waveforms[1].sampleCount = waveform.sampleCount;
    channelSegment.waveforms[1].data = (double*) malloc(waveform.sampleCount * sizeof(double));
    memcpy(channelSegment.waveforms[1].data, waveform.data, waveform.sampleCount * sizeof(double));

    int status = endpointTaperChannelSegment(&taperDefinition, &channelSegment, BOTH);

    for (int j = 0; j < 2; j++)
    {
        for (int i = 0; i < TestData::THREE_SECOND_DATA_SIZE; i++)
        {
            ASSERT_NEAR(waveform.data[i], TestData::TAPER_BOTH_RESULTS.at(i), error);
        }
    }

    free(waveform.data);
    free(channelSegment.waveforms[1].data);
    free(channelSegment.waveforms);
}