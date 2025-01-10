#include "BeamMissingInputsTest.hh"

void BeamMissingInputsTest::SetUp()
{
    data = GmsTestUtils::FileLoader::getJson("beamMissingInputsData.json");

    processingMaskDefinition.fixType = ZERO;
    processingMaskDefinition.fixThreshold = 0;

    maskTaperDefinition.taperLength = 0;
    maskTaperDefinition.taperFunction = BLACKMAN;
}

std::vector<std::pair<int, int>> BeamMissingInputsTest::findChannelSegmentGapEndpoints(int channelSegmentNumber)
{
    std::vector<std::pair<int, int>> gapSamples;

    Json::Value channelSegment = data["channelSegments"][channelSegmentNumber];
    Json::Value missingSamples = channelSegment["missingSamples"];
    double sampleRate = channelSegment["timeseries"][0]["sampleRateHz"].asDouble();
    double startTime = channelSegment["timeseries"][0]["startTime"].asDouble();
    double endTime = channelSegment["timeseries"][0]["endTime"].asDouble();

    bool previousSampleMissing = false;
    int gapStartSample = -1;
    for (int i = 0; i < missingSamples.size(); i++)
    {
        if (missingSamples[i].asBool())
        {
            if (!previousSampleMissing)
            {
                gapStartSample = i;
                previousSampleMissing = true;
            }
        }
        else
        {
            if (previousSampleMissing)
            {
                gapSamples.push_back(std::pair<int, int>(gapStartSample, i - 1));
                gapStartSample = -1;
                previousSampleMissing = false;
            }
        }
    }

    return gapSamples;
}

std::vector<MissingInputChannelTimeRanges> BeamMissingInputsTest::buildMissingInputChannels()
{
    std::vector<MissingInputChannelTimeRanges> missingInputs{};

    int channelSegmentCount = data["channelSegments"].size();
    double beamStart = data["beam"]["startTime"].asDouble();
    double beamEnd = data["beam"]["endTime"].asDouble();
    for (int i = 0; i < channelSegmentCount; i++)
    {
        std::vector<std::pair<int, int>> gapEndPoints = findChannelSegmentGapEndpoints(i);
        double channelSegmentStart = data["channelSegments"][i]["id"]["startTime"].asDouble();
        double channelSegmentEnd = data["channelSegments"][i]["id"]["endTime"].asDouble();
        double sampleRateHz = data["channelSegments"][i]["timeseries"][0]["sampleRateHz"].asDouble();
        if (gapEndPoints.size() == 1)
        {
            double timeseriesStart = data["channelSegments"][i]["timeseries"][0]["startTime"].asDouble();
            double sampleRateHz = data["channelSegments"][i]["timeseries"][0]["sampleRateHz"].asDouble();

            TimeRange timeRange;
            timeRange.startTime = timeseriesStart + (gapEndPoints.at(0).first / sampleRateHz);
            timeRange.endTime = timeseriesStart + (gapEndPoints.at(0).second / sampleRateHz);

            if (timeRange.startTime <= beamEnd && timeRange.endTime >= beamStart)
            {
                MissingInputChannelTimeRanges missingInputChannel;
                std::string channelName = data["channelSegments"][i]["id"]["channel"]["name"].asString();
                char* channelNameC = (char*) malloc(channelName.size() * sizeof(char));
                memcpy(channelNameC, channelName.c_str(), channelName.size() * sizeof(char));
                missingInputChannel.channelName = channelNameC;       
                missingInputChannel.timeRangeCount = gapEndPoints.size();
                missingInputChannel.timeRanges = (TimeRange*) malloc(gapEndPoints.size() * sizeof(TimeRange));
                missingInputChannel.timeRanges[0] = timeRange;
                missingInputs.push_back(missingInputChannel);
            }
        }
    }

    return missingInputs;
}


std::vector<ProcessingChannelSegment> BeamMissingInputsTest::buildChannelSegments()
{
    std::vector<ProcessingChannelSegment> channelSegments{};

    Json::Value channelSegmentData = data["channelSegments"];
    Json::ArrayIndex channelSegmentCount = channelSegmentData.size();

    for (int i = 0; i < channelSegmentCount; i++)
    {
        ProcessingChannelSegment channelSegment;
        std::string channelName = channelSegmentData[i]["id"]["channel"]["name"].asString();
        char* channelNameC = (char*) malloc(channelName.length());

        for (int i = 0; i < channelName.length(); i++)
        {
            channelNameC[i] = channelName.at(i);
        }
        
        channelSegment.channelName = channelNameC;

        channelSegment.startTime = channelSegmentData[i]["id"]["startTime"].asDouble();
        channelSegment.endTime = channelSegmentData[i]["id"]["endTime"].asDouble();
        channelSegment.processingMaskCount = 0;
        channelSegment.masksToApply = (ProcessingMask*) nullptr;

        int siteStart = channelName.find_first_of('.');
        int siteEnd = channelName.find_first_of('.', siteStart + 1);
        std::string siteName = channelName.substr(siteStart + 1, siteEnd - (siteStart + 1));
        channelSegment.northDisplacementKm = data["sites"][siteName]["northOffsetKm"].asDouble();
        channelSegment.eastDisplacementKm = data["sites"][siteName]["eastOffsetKm"].asDouble();
        channelSegment.verticalDisplacementKm = data["sites"][siteName]["elevationKm"].asDouble();

        channelSegment.missingInputChannelCount = 0;
        channelSegment.missingInputChannels = (MissingInputChannelTimeRanges*) nullptr;
        std::vector<std::pair<int, int>> gapEndPoints = findChannelSegmentGapEndpoints(i);
        channelSegment.waveformCount = gapEndPoints.size() + 1;
        channelSegment.waveforms = (ProcessingWaveform*) malloc(channelSegment.waveformCount * sizeof(ProcessingWaveform));

        int waveformStartSample = 0;
        double baseStartTime = channelSegmentData[i]["timeseries"][0]["startTime"].asDouble();
        double sampleRateHz = channelSegmentData[i]["timeseries"][0]["sampleRateHz"].asDouble();
        int waveformCount = 0;
        for (int j = 0; j < gapEndPoints.size(); j++)
        {
            std::pair<int, int> gap = gapEndPoints.at(j);
            ProcessingWaveform waveform;
            waveform.processingMaskCount = 0;
            waveform.maskedBy = (ProcessingMask*) nullptr;
            waveform.sampleRateHz = sampleRateHz;
            waveform.startTime = baseStartTime + (waveformStartSample / sampleRateHz);
            waveform.endTime = baseStartTime + ((gapEndPoints.at(j).first - 1) / sampleRateHz);
            waveform.sampleCount = gap.first - waveformStartSample;
            waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

            for (int k = waveformStartSample; k < gap.first; k++)
            {
                waveform.data[k] = channelSegmentData[i]["timeseries"][0]["samples"][k].asDouble();
            }

            channelSegment.waveforms[waveformCount] = waveform;
            waveformStartSample = gap.second + 1;
            waveformCount++;            
        }

        ProcessingWaveform waveform;
        waveform.processingMaskCount = 0;
        waveform.maskedBy = (ProcessingMask*) nullptr;
        waveform.sampleRateHz = sampleRateHz;
        waveform.startTime = baseStartTime + (waveformStartSample / sampleRateHz);
        waveform.endTime = channelSegmentData[i]["timeseries"][0]["endTime"].asDouble();

        int dataSize = channelSegmentData[i]["timeseries"][0]["sampleCount"].asInt();
        waveform.sampleCount = dataSize - waveformStartSample;
        waveform.data = (double*) malloc(waveform.sampleCount * sizeof(double));

        int sampleNum = 0;
        for (int k = waveformStartSample; k < dataSize; k++)
        {
            waveform.data[sampleNum] = channelSegmentData[i]["timeseries"][0]["samples"][k].asDouble();
            sampleNum++;
        }        

        channelSegment.waveforms[waveformCount] = waveform;
        qcFixChannelSegment(&processingMaskDefinition, &channelSegment);
        qcDemean(&channelSegment);
        channelSegments.push_back(channelSegment);
    }

    return channelSegments;
}

BeamDefinition BeamMissingInputsTest::buildBeamDefinition()
{
    BeamDefinition beamDefinition;
    beamDefinition.beamType = EVENT;
    beamDefinition.samplingType = NEAREST_SAMPLE;
    beamDefinition.beamSummation = COHERENT;
    beamDefinition.receiverToSourceAzimuthDeg = data["beam"]["azimuthDeg"].asDouble();
    beamDefinition.slownessSecPerDeg = data["beam"]["slownessSecPerKm"].asDouble() * KM_PER_DEGREE;
    beamDefinition.sampleRateHz = 40.0;
    beamDefinition.sampleRateToleranceHz = 0.001;
    beamDefinition.minWaveformsToBeam = 2;
    beamDefinition.preFilterDefinition = (FilterDefinition*) nullptr;

    return beamDefinition;
}

TEST_F(BeamMissingInputsTest, TEST_BEAM_WITH_MISSING_INPUTS)
{
    BeamDefinition beamDefinition = buildBeamDefinition();
    std::vector<ProcessingChannelSegment> channelSegments = buildChannelSegments();
    ProcessingChannelSegment actualBeam;

    int status = beamChannelSegment(&beamDefinition, 
                                    channelSegments.size(),
                                    channelSegments.data(),
                                    data["beam"]["startTime"].asDouble(),
                                    data["beam"]["endTime"].asDouble(),
                                    (double*) nullptr,
                                    &processingMaskDefinition,
                                    &maskTaperDefinition,
                                    &actualBeam);

    ASSERT_EQ(status, SUCCESS);
    ASSERT_FLOAT_EQ(actualBeam.startTime, data["beam"]["startTime"].asDouble());
    ASSERT_FLOAT_EQ(actualBeam.endTime, data["beam"]["endTime"].asDouble());
    ASSERT_EQ(actualBeam.waveformCount, 1);

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        ASSERT_EQ(actualBeam.waveforms[i].sampleCount, data["beam"]["samples"].size());
        for (int j = 0; j < actualBeam.waveforms[i].sampleCount; j++)
        {
            printf("j = %d\n", j);
            double expectedValue = data["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actualBeam.waveforms[i].data[j], expectedValue, error);
        }

        free(actualBeam.waveforms[i].data);
        if (actualBeam.waveforms[i].maskedBy)
        {
            free(actualBeam.waveforms[i].maskedBy);
        }
    }

    free(actualBeam.waveforms);

    std::vector<MissingInputChannelTimeRanges> expectedMissingInputs = buildMissingInputChannels();
    ASSERT_EQ(actualBeam.missingInputChannelCount, expectedMissingInputs.size());

    for (int i = 0; i < expectedMissingInputs.size(); i++)
    {
        ASSERT_EQ(strcmp(actualBeam.missingInputChannels[i].channelName, expectedMissingInputs.at(i).channelName), 0);
        ASSERT_EQ(actualBeam.missingInputChannels[i].timeRangeCount, expectedMissingInputs.at(i).timeRangeCount);

        if (actualBeam.missingInputChannels[i].timeRangeCount > 0)
        {
            for (int j = 0; j < expectedMissingInputs.at(i).timeRangeCount; j++)
            {
                ASSERT_FLOAT_EQ(actualBeam.missingInputChannels[i].timeRanges[j].startTime, expectedMissingInputs.at(i).timeRanges[j].startTime);
                ASSERT_FLOAT_EQ(actualBeam.missingInputChannels[i].timeRanges[j].endTime, expectedMissingInputs.at(i).timeRanges[j].endTime);
            }

            free(actualBeam.missingInputChannels[i].timeRanges);
        }
    }

    free(actualBeam.missingInputChannels);
}