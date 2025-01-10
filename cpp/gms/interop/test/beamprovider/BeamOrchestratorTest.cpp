#include "BeamOrchestratorTest.hh"

void BeamOrchestratorTest::SetUp()
{
    data =  GmsTestUtils::FileLoader::getJson("beamformingData.json");

    processingMaskDefinition.fixThreshold = 10;
    processingMaskDefinition.fixType = GmsSigpro::ZERO;

    maskTaperDefinition.taperFunction = GmsSigpro::COSINE;
    maskTaperDefinition.taperLength = 10;
}

std::vector<GmsSigpro::ProcessingChannelSegment> BeamOrchestratorTest::buildChannelSegments(std::string dataSet)
{
    std::vector<GmsSigpro:: ProcessingChannelSegment> channelSegments = {};
    Json::Value channelSegmentData = data[dataSet]["channelSegments"];
    Json::ArrayIndex channelSegmentCount = channelSegmentData.size();
    for (int i = 0; i < channelSegmentCount; i++)
    {
        GmsSigpro::ProcessingChannelSegment channelSegment;
        std::string channelName = channelSegmentData[i]["id"]["channel"]["name"].asString();
        channelSegment.channelName = channelName.data();
        channelSegment.startTime = channelSegmentData[i]["id"]["startTime"].asDouble();
        channelSegment.endTime = channelSegmentData[i]["id"]["endTime"].asDouble();

        int siteStart = channelName.find_first_of('.');
        int siteEnd = channelName.find_first_of('.', siteStart + 1);
        std::string siteName = channelName.substr(siteStart + 1, siteEnd - (siteStart + 1));
        channelSegment.northDisplacementKm = data["sites"][siteName]["northOffsetKm"].asDouble();
        channelSegment.eastDisplacementKm = data["sites"][siteName]["eastOffsetKm"].asDouble();
        channelSegment.verticalDisplacementKm = data["sites"][siteName]["elevationKm"].asDouble();

        Json::ArrayIndex timeseriesCount = channelSegmentData[i]["timeseries"].size();
        channelSegment.waveformCount = timeseriesCount;

        channelSegment.waveforms = (GmsSigpro::ProcessingWaveform*) malloc(timeseriesCount * sizeof(GmsSigpro::ProcessingWaveform));
        for (int j = 0; j < timeseriesCount; j++)
        {
            Json::Value timeseries = channelSegmentData[i]["timeseries"];
            channelSegment.waveforms[j].startTime = timeseries[j]["startTime"].asDouble();
            channelSegment.waveforms[j].endTime = timeseries[j]["endTime"].asDouble();
            channelSegment.waveforms[j].sampleRateHz = timeseries[j]["sampleRateHz"].asDouble();
            channelSegment.waveforms[j].sampleCount = timeseries[j]["sampleCount"].asInt();
            channelSegment.waveforms[j].processingMaskCount = 0;
            channelSegment.waveforms[j].maskedBy = (GmsSigpro::ProcessingMask*) nullptr;

            channelSegment.waveforms[j].data = (double*)malloc(channelSegment.waveforms[j].sampleCount * sizeof(double));

            for (int m = 0; m < channelSegment.waveforms[j].sampleCount; m++)
            {
                channelSegment.waveforms[j].data[m] = timeseries[j]["samples"][m].asDouble();
            }
        }

        if (dataSet == "mask" && (i == 1 || i == 5))
        {
            channelSegment.processingMaskCount = 1;
            Json::Value processingMask = channelSegmentData[i]["maskedBy"];
            int maskStartSample = -1;
            bool previousSampleMasked = false;
            double maskSampleCount = processingMask.size();
            double sampleRate = channelSegmentData[i]["timeseries"][0]["sampleRateHz"].asDouble();
            for (int k = 0; k < maskSampleCount; k++)
            {
                if (processingMask[k].asBool())
                {
                    if (!previousSampleMasked)
                    {
                        maskStartSample = k;
                        previousSampleMasked = true;
                    }
                }
                else
                {
                    if (previousSampleMasked)
                    {
                        channelSegment.masksToApply = (GmsSigpro::ProcessingMask*) malloc(sizeof(ProcessingMask));
                        channelSegment.masksToApply[0].processingOperation = GmsSigpro::EVENT_BEAM;
                        channelSegment.masksToApply[0].startTime = channelSegment.startTime + (maskStartSample / sampleRate);
                        channelSegment.masksToApply[0].endTime = channelSegment.startTime + ((k - 1) / sampleRate);
                        channelSegment.masksToApply[0].isFixed = 0;
                        previousSampleMasked = false;
                    }
                }
            }
        }
        else
        {
            channelSegment.processingMaskCount = 0;
            channelSegment.masksToApply = (GmsSigpro::ProcessingMask*) nullptr;
        }

        channelSegments.push_back(channelSegment);
    }
    return channelSegments;
}

GmsSigpro::BeamDefinition BeamOrchestratorTest::buildBeamDefinition(std::string dataSet)
{
    GmsSigpro::BeamDefinition beamDefinition;
    beamDefinition.beamType = GmsSigpro::EVENT;
    beamDefinition.samplingType = GmsSigpro::NEAREST_SAMPLE;
    beamDefinition.beamSummation = GmsSigpro::COHERENT;
    beamDefinition.receiverToSourceAzimuthDeg = data[dataSet]["beam"]["azimuthDeg"].asDouble();
    beamDefinition.slownessSecPerDeg = data[dataSet]["beam"]["slownessSecPerKm"].asDouble() * KM_PER_DEGREE;
    beamDefinition.sampleRateHz = 40.0;
    beamDefinition.sampleRateToleranceHz = 0.001;
    beamDefinition.minWaveformsToBeam = 2;
    beamDefinition.preFilterDefinition = (GmsSigpro::FilterDefinition*) nullptr;

    return beamDefinition;
}

GmsSigpro::ProcessingChannelSegment BeamOrchestratorTest::buildExpectedBeam(std::string dataSet)
{
    GmsSigpro::ProcessingWaveform beamWaveform;

    beamWaveform.sampleCount = data[dataSet]["beam"]["samples"].size();
    beamWaveform.data = (double*) malloc(beamWaveform.sampleCount * sizeof(double));

    for (int i = 0; i < beamWaveform.sampleCount; i++)
    {
        beamWaveform.data[i] = data[dataSet]["beam"]["samples"][i].asDouble();
    }

    GmsSigpro::ProcessingChannelSegment beam;
    beam.startTime = data[dataSet]["beam"]["startTime"].asDouble();
    beam.endTime = data[dataSet]["beam"]["endTime"].asDouble();
    beam.missingInputChannelCount = 0;
    beam.missingInputChannels = (GmsSigpro::MissingInputChannelTimeRanges*) nullptr;
    beam.waveformCount = 1;
    beam.waveforms = &beamWaveform;
    beam.masksToApply = (GmsSigpro::ProcessingMask*) nullptr;
    return beam;
}

TEST_F(BeamOrchestratorTest, RAW_WAVEFORMS_NO_GAP_TEST)
{
    GmsSigpro::BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<GmsSigpro::ProcessingChannelSegment> channelSegments = buildChannelSegments("raw");

    double startTime = data["raw"]["beam"]["startTime"].asDouble();
    double endTime =  data["raw"]["beam"]["endTime"].asDouble();

    GmsSigpro::ProcessingChannelSegment actualBeam = BeamOrchestrator::maskAndBeamWaveforms(&beamDefinition,
                                           &channelSegments, 
                                           startTime,
                                           endTime,
                                           (double*) nullptr,
                                           &processingMaskDefinition,
                                           &maskTaperDefinition);

    ASSERT_FLOAT_EQ(actualBeam.startTime, startTime);
    ASSERT_FLOAT_EQ(actualBeam.endTime, endTime);
    ASSERT_EQ(actualBeam.missingInputChannelCount, 0);
    ASSERT_EQ(actualBeam.waveformCount, 1);

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        for (int j = 0; j < actualBeam.waveforms[i].sampleCount; j++)
        {
            double expectedValue = data["raw"]["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actualBeam.waveforms[i].data[j], expectedValue, error);
        }
    }

    for (GmsSigpro::ProcessingChannelSegment channelSegment : channelSegments)
    {
        for (int i = 0; i < channelSegment.waveformCount; i++)
        {
            free(channelSegment.waveforms[i].data);
            if (channelSegment.waveforms[i].maskedBy)
            {
                free(channelSegment.waveforms[i].maskedBy);
            }
        }   

        free(channelSegment.waveforms);
    }
    
    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        free(actualBeam.waveforms[i].data);
    }
}

TEST_F(BeamOrchestratorTest, MASKED_INPUT_NO_GAPS_BEAM_TEST)
{
    GmsSigpro::BeamDefinition beamDefinition = buildBeamDefinition("mask");
    std::vector<GmsSigpro::ProcessingChannelSegment> channelSegments = buildChannelSegments("mask");

    double startTime = data["mask"]["beam"]["startTime"].asDouble();
    double endTime =  data["mask"]["beam"]["endTime"].asDouble();

    GmsSigpro::ProcessingChannelSegment actualBeam = BeamOrchestrator::maskAndBeamWaveforms(&beamDefinition,
                                           &channelSegments, 
                                           startTime,
                                           endTime,
                                           (double*) nullptr,
                                           &processingMaskDefinition,
                                           (GmsSigpro::TaperDefinition*) nullptr);

    ASSERT_FLOAT_EQ(actualBeam.startTime, data["mask"]["beam"]["startTime"].asDouble());
    ASSERT_FLOAT_EQ(actualBeam.endTime, data["mask"]["beam"]["endTime"].asDouble());
    ASSERT_EQ(actualBeam.missingInputChannelCount, 0);
    ASSERT_EQ(actualBeam.waveformCount, 1);

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        ASSERT_EQ(actualBeam.waveforms[i].sampleCount, data["mask"]["beam"]["samples"].size());
        for (int j = 0; j < actualBeam.waveforms[i].sampleCount; j++)
        {
            double expectedValue = data["mask"]["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actualBeam.waveforms[i].data[j], expectedValue, error);
        }
    }

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        free(actualBeam.waveforms[i].data);
    }

    free(actualBeam.waveforms);
}