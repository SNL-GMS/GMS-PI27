#include "BeamValidationTest.hh"

void BeamValidationTest::SetUp()
{
    data = GmsTestUtils::FileLoader::getJson("beamformingData.json");

    processingMaskDefinition.fixThreshold = 10;
    processingMaskDefinition.fixType = ZERO;

    maskTaperDefinition.taperFunction = COSINE;
    maskTaperDefinition.taperLength = 10;
}

std::vector<ProcessingChannelSegment> BeamValidationTest::buildChannelSegments(std::string dataSet)
{
    std::vector<ProcessingChannelSegment> channelSegments = {};
    Json::Value channelSegmentData = data[dataSet]["channelSegments"];
    Json::ArrayIndex channelSegmentCount = channelSegmentData.size();
    for (int i = 0; i < channelSegmentCount; i++)
    {
        ProcessingChannelSegment channelSegment;
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

        channelSegment.waveforms = (ProcessingWaveform*)malloc(timeseriesCount * sizeof(ProcessingWaveform));
        for (int j = 0; j < timeseriesCount; j++)
        {
            Json::Value timeseries = channelSegmentData[i]["timeseries"];
            channelSegment.waveforms[j].startTime = timeseries[j]["startTime"].asDouble();
            channelSegment.waveforms[j].endTime = timeseries[j]["endTime"].asDouble();
            channelSegment.waveforms[j].sampleRateHz = timeseries[j]["sampleRateHz"].asDouble();
            channelSegment.waveforms[j].sampleCount = timeseries[j]["sampleCount"].asInt();
            channelSegment.waveforms[j].processingMaskCount = 0;
            channelSegment.waveforms[j].maskedBy = (ProcessingMask*) nullptr;

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
            double maskStartTime = -1;
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
                        maskStartTime = channelSegment.startTime + k / sampleRate;
                        previousSampleMasked = true;
                    }
                }
                else
                {
                    if (previousSampleMasked)
                    {
                        ProcessingMask mask;
                        mask.processingOperation = EVENT_BEAM;
                        mask.startTime = channelSegment.startTime + (maskStartSample / sampleRate);
                        mask.endTime = channelSegment.startTime + ((k - 1) / sampleRate);
                        mask.isFixed = 0;
                        channelSegment.masksToApply = &mask;
                        previousSampleMasked = false;
                        maskStartTime = -1;
                    }
                }
            }

            qcFixChannelSegment(&processingMaskDefinition, &channelSegment);
        }
        else
        {
            channelSegment.processingMaskCount = 0;
            channelSegment.masksToApply = (ProcessingMask*) nullptr;
        }

        qcDemean(&channelSegment);
        channelSegments.push_back(channelSegment);
    }
    return channelSegments;
}

BeamDefinition BeamValidationTest::buildBeamDefinition(std::string dataSet)
{
    BeamDefinition beamDefinition;
    beamDefinition.beamType = EVENT;
    beamDefinition.samplingType = NEAREST_SAMPLE;
    beamDefinition.beamSummation = COHERENT;
    beamDefinition.receiverToSourceAzimuthDeg = data[dataSet]["beam"]["azimuthDeg"].asDouble();
    beamDefinition.slownessSecPerDeg = data[dataSet]["beam"]["slownessSecPerKm"].asDouble() * KM_PER_DEGREE;
    beamDefinition.sampleRateHz = 40.0;
    beamDefinition.sampleRateToleranceHz = 0.001;
    beamDefinition.minWaveformsToBeam = 2;

    if (data[dataSet]["filterAssociations"].size() == 1)
    {
        Json::Value filter = data[dataSet]["filterAssociations"][0]["definition"];
        IirFilterParameters parameters;
        parameters.sampleRateHz = filter["filterDescription"]["parameters"]["sampleRateHz"].asDouble();
        parameters.sampleRateToleranceHz = filter["filterDescription"]["parameters"]["sampleRateToleranceHz"].asDouble();
        parameters.groupDelaySec = 0.0;
        parameters.sosCoefficientsSize = filter["filterDescription"]["parameters"]["aCoefficients"].size();
        parameters.sosNumeratorCoefficients = (double*)malloc(parameters.sosCoefficientsSize * sizeof(double));
        parameters.sosDenominatorCoefficients = (double*)malloc(parameters.sosCoefficientsSize * sizeof(double));

        for (int i = 0; i < parameters.sosCoefficientsSize; i++)
        {
            parameters.sosNumeratorCoefficients[i] = filter["filterDescription"]["parameters"]["aCoefficients"][i].asDouble();
            parameters.sosDenominatorCoefficients[i] = filter["filterDescription"]["parameters"]["bCoefficients"][i].asDouble();
        }

        IirFilterDescription iirDescription;
        iirDescription.lowFrequencyHz = filter["filterDescription"]["lowFrequencyHz"].asDouble();
        iirDescription.highFrequencyHz = filter["filterDescription"]["highFrequencyHz"].asDouble();
        iirDescription.order = filter["filterDescription"]["order"].asInt();
        iirDescription.zeroPhase = filter["filterDescription"]["zeroPhase"].asBool();
        iirDescription.causal = filter["filterDescription"]["causal"].asBool();

        std::string bandType = filter["filterDescription"]["passBandType"].asString();
        if (bandType == "LOW_PASS")
        {
            iirDescription.bandType = LOW_PASS;
        }
        else if (bandType == "HIGH_PASS")
        {
            iirDescription.bandType = HIGH_PASS;
        }
        else if (bandType == "BAND_PASS")
        {
            iirDescription.bandType = BAND_PASS;
        }
        else
        {
            iirDescription.bandType = BAND_REJECT;
        }

        iirDescription.parameters = parameters;

        beamDefinition.preFilterDefinition = (FilterDefinition*)malloc(sizeof(FilterDefinition));
        beamDefinition.preFilterDefinition->causal = iirDescription.causal;
        beamDefinition.preFilterDefinition->filterType = IIR_BUTTERWORTH;
        beamDefinition.preFilterDefinition->isDesigned = 1;
        beamDefinition.preFilterDefinition->filterDescription.nonCascadeFilterDescription.iirFilterDescription = iirDescription;
    }
    else
    {
        beamDefinition.preFilterDefinition = (FilterDefinition*) nullptr;
    }

    return beamDefinition;
}

ProcessingChannelSegment BeamValidationTest::buildExpectedBeam(std::string dataSet)
{
    ProcessingWaveform beamWaveform;

    beamWaveform.sampleCount = data[dataSet]["beam"]["samples"].size();
    beamWaveform.data = (double*)malloc(beamWaveform.sampleCount * sizeof(double));

    for (int i = 0; i < beamWaveform.sampleCount; i++)
    {
        beamWaveform.data[i] = data[dataSet]["beam"]["samples"][i].asDouble();
    }

    ProcessingChannelSegment beam;
    beam.startTime = data[dataSet]["beam"]["startTime"].asDouble();
    beam.endTime = data[dataSet]["beam"]["endTime"].asDouble();
    beam.missingInputChannelCount = 0;
    beam.missingInputChannels = (MissingInputChannelTimeRanges*) nullptr;
    beam.waveformCount = 1;
    beam.waveforms = &beamWaveform;

    return beam;
}

TEST_F(BeamValidationTest, INSUFFICIENT_CHANNEL_SEGMENTS_TEST)
{
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ProcessingChannelSegment> channelSegments = buildChannelSegments("raw");

    ProcessingChannelSegment actualBeam;
    int status = beamChannelSegment(&beamDefinition, 1, channelSegments.data(), 0.0, 10.0, (double*) nullptr, &processingMaskDefinition, &maskTaperDefinition, &actualBeam);

    ASSERT_EQ(status, INSUFFICIENT_DATA);

    for (ProcessingChannelSegment channelSegment : channelSegments)
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
}

TEST_F(BeamValidationTest, NULL_CHANNEL_SEGMENTS_TEST)
{
    BeamDefinition beamDefinition = buildBeamDefinition("raw");

    ProcessingChannelSegment actualBeam;
    int status = beamChannelSegment(&beamDefinition, 1, (ProcessingChannelSegment*) nullptr, 0.0, 10.0, (double*) nullptr, &processingMaskDefinition, &maskTaperDefinition, &actualBeam);

    ASSERT_EQ(status, INSUFFICIENT_DATA);
}

TEST_F(BeamValidationTest, INVALID_BEAM_ENDPOINTS)
{
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ProcessingChannelSegment> channelSegments = buildChannelSegments("raw");

    ProcessingChannelSegment actualBeam;
    int status = beamChannelSegment(&beamDefinition,
        channelSegments.size(),
        channelSegments.data(),
        10.0,
        0.0,
        (double*) nullptr,
        &processingMaskDefinition,
        &maskTaperDefinition,
        &actualBeam);

    ASSERT_EQ(status, INVALID_BOUNDS);

    for (ProcessingChannelSegment channelSegment : channelSegments)
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
}

TEST_F(BeamValidationTest, RAW_INPUT_CHANNELS_NO_GAPS_BEAM_TEST)
{
    BeamDefinition beamDefinition = buildBeamDefinition("raw");
    std::vector<ProcessingChannelSegment> channelSegments = buildChannelSegments("raw");
    ProcessingChannelSegment actualBeam;

    int status = beamChannelSegment(&beamDefinition,
        channelSegments.size(),
        channelSegments.data(),
        data["raw"]["beam"]["startTime"].asDouble(),
        data["raw"]["beam"]["endTime"].asDouble(),
        (double*) nullptr,
        &processingMaskDefinition,
        &maskTaperDefinition,
        &actualBeam);

    ASSERT_EQ(status, SUCCESS);

    ASSERT_FLOAT_EQ(actualBeam.startTime, data["raw"]["beam"]["startTime"].asDouble());
    ASSERT_FLOAT_EQ(actualBeam.endTime, data["raw"]["beam"]["endTime"].asDouble());
    ASSERT_EQ(actualBeam.missingInputChannelCount, 0);
    ASSERT_EQ(actualBeam.waveformCount, 1);

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        ASSERT_EQ(actualBeam.waveforms[i].sampleCount, data["raw"]["beam"]["samples"].size());
        for (int j = 0; j < actualBeam.waveforms[i].sampleCount; j++)
        {
            double expectedValue = data["raw"]["beam"]["samples"][j].asDouble();
            ASSERT_NEAR(actualBeam.waveforms[i].data[j], expectedValue, error);
        }
    }

    for (int i = 0; i < actualBeam.waveformCount; i++)
    {
        free(actualBeam.waveforms[i].data);
    }

    free(actualBeam.waveforms);

    for (int i = 0; i < channelSegments.size(); i++)
    {
        for (int j = 0; j < channelSegments.at(i).waveformCount; j++)
        {
            free(channelSegments.at(i).waveforms[j].data);

            if (channelSegments.at(i).waveforms[j].maskedBy)
            {
                free(channelSegments.at(i).waveforms[j].maskedBy);
            }
        }

        free(channelSegments.at(i).waveforms);
    }
}

TEST_F(BeamValidationTest, MASKED_INPUT_NO_GAPS_BEAM_TEST)
{
    BeamDefinition beamDefinition = buildBeamDefinition("mask");
    std::vector<ProcessingChannelSegment> channelSegments = buildChannelSegments("mask");
    ProcessingChannelSegment actualBeam;

    int status = beamChannelSegment(&beamDefinition,
        channelSegments.size(),
        channelSegments.data(),
        data["mask"]["beam"]["startTime"].asDouble(),
        data["mask"]["beam"]["endTime"].asDouble(),
        (double*) nullptr,
        &processingMaskDefinition,
        &maskTaperDefinition,
        &actualBeam);

    ASSERT_EQ(status, SUCCESS);

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

        for (int i = 0; i < channelSegments.size(); i++)
    {
        for (int j = 0; j < channelSegments.at(i).waveformCount; j++)
        {
            free(channelSegments.at(i).waveforms[j].data);

            if (channelSegments.at(i).waveforms[j].maskedBy)
            {
                free(channelSegments.at(i).waveforms[j].maskedBy);
            }
        }

        free(channelSegments.at(i).waveforms);
    }
}