#include "ClassToCStructConverter.hh"

GmsSigpro::MissingInputChannelTimeRanges ClassToCStructConverter::convertToStruct(TimeRangesByChannel const& timeRangesByChannel)
{
    std::vector<GmsSigpro::TimeRange> timeRanges;
    for (auto& timeRange : timeRangesByChannel.timeRanges) {
        timeRanges.push_back(GmsSigpro::TimeRange{
            .startTime = timeRange.startTime,
            .endTime = timeRange.endTime
            });
    }

    return GmsSigpro::MissingInputChannelTimeRanges{
        .channelName = timeRangesByChannel.channelVersionReference.name.c_str(),
        .timeRangeCount = static_cast<int>(timeRanges.size()),
        .timeRanges = timeRanges.data()
    };
}

std::vector<GmsSigpro::MissingInputChannelTimeRanges> ClassToCStructConverter::convertToStruct(std::vector<TimeRangesByChannel> const& timeRangesByChannels)
{
    std::vector<GmsSigpro::MissingInputChannelTimeRanges> missingInputChannelTimeChanges;
    for (auto& timeRangesByChannel : timeRangesByChannels) {
        missingInputChannelTimeChanges.push_back(ClassToCStructConverter::convertToStruct(timeRangesByChannel));
    }
    return missingInputChannelTimeChanges;
}

GmsSigpro::ProcessingMask ClassToCStructConverter::convertToStruct(ProcessingMask const& processingMask)
{
    return GmsSigpro::ProcessingMask{
        .processingOperation = static_cast<GmsSigpro::PROCESSING_OPERATION>(static_cast<int>(processingMask.processingOperation)),
        .startTime = processingMask.startTime,
        .endTime = processingMask.endTime,
        .isFixed = 0
    };
}

std::vector<GmsSigpro::ProcessingMask> ClassToCStructConverter::convertToStruct(std::vector<ProcessingMask> const& processingMasks)
{
    std::vector<GmsSigpro::ProcessingMask> masks;
    for (auto& processingMask : processingMasks) {
        masks.push_back(ClassToCStructConverter::convertToStruct(processingMask));
    }
    return masks;
}

GmsSigpro::ProcessingWaveform ClassToCStructConverter::convertToStruct(
    Waveform& waveform, RelativePosition const& relativePosition,
    std::string const& channelName, std::vector<ProcessingMask> const& processingMasks)
{
    std::vector<GmsSigpro::ProcessingMask> maskedBy = ClassToCStructConverter::convertToStruct(processingMasks);
    GmsSigpro::ProcessingWaveform processingWaveform{
        .channelName = channelName.c_str(),
        .processingMaskCount = 0,
        .maskedBy = nullptr,
        .northDisplacementKm = relativePosition.northDisplacementKm,
        .eastDisplacementKm = relativePosition.eastDisplacementKm,
        .verticalDisplacementKm = relativePosition.verticalDisplacementKm,
        .sampleRateHz = waveform.sampleRateHz,
        .startTime = waveform.startTime,
        .endTime = waveform.endTime,
        .sampleCount = waveform.sampleCount,
        .data = waveform.samples.data()
    };
    return processingWaveform;
};

void ClassToCStructConverter::convertToStruct(
    std::vector<Waveform>& waveforms, RelativePosition const& relativePosition,
    std::string const& channelName, std::vector<ProcessingMask> const& processingMasks, std::vector<GmsSigpro::ProcessingWaveform>& outProcessingWaveforms)
{
    for (int i = 0; i < waveforms.size(); i++) {
        outProcessingWaveforms[i] = ClassToCStructConverter::convertToStruct(waveforms[i], relativePosition, channelName, processingMasks);
    }        
};

GmsSigpro::ProcessingChannelSegment ClassToCStructConverter::convertToStruct(
    ChannelSegment& channelSegment, RelativePosition const& relativePosition, std::vector<GmsSigpro::ProcessingWaveform>& outProcessingWaveforms)
{
    ClassToCStructConverter::convertToStruct(channelSegment.timeseries, relativePosition, channelSegment.id.channel.name, channelSegment.maskedBy, outProcessingWaveforms);
    GmsSigpro::ProcessingChannelSegment processingChannelSegment{
        .channelName = channelSegment.id.channel.name.c_str(),
        .startTime = channelSegment.startTime,
        .endTime = channelSegment.endTime,
        .processingMaskCount = 0,
        .northDisplacementKm = relativePosition.northDisplacementKm,
        .eastDisplacementKm = relativePosition.eastDisplacementKm,
        .verticalDisplacementKm = relativePosition.verticalDisplacementKm,
        .missingInputChannelCount = 0,
        .waveformCount = static_cast<int>(outProcessingWaveforms.size()),
        .waveforms = outProcessingWaveforms.data()
    };
    return processingChannelSegment;
};

GmsSigpro::FkSpectraDefinition ClassToCStructConverter::convertToStruct(FkSpectraParameters const& params, OrientationAngles const& angles)
{
    return GmsSigpro::FkSpectraDefinition{
        .horizontalAngleDeg = angles.horizontalAngleDeg,
        .verticalAngleDeg = angles.verticalAngleDeg,
        .spectrumStepDuration = params.spectrumStepDuration,
        .minimumWaveformsForSpectrum = params.minimumWaveformsForSpectra,
        .normalizeWaveforms = params.normalizeWaveforms == true ? 1 : 0,
        .twoDimensional = params.twoDimensional == true ? 1 : 0,
        .fftTaperPercent = params.fftTaperPercent,
        .maxSlowness = params.slownessGrid.maxSlowness,
        .numPoints = params.slownessGrid.numPoints,
        .spectrumDurationMs = params.spectrumStepDuration,
        .lead = params.fkSpectrumWindow.lead,
        .lowFrequencyHz = params.fkFrequencyRange.lowFrequencyHz,
        .highFrequencyHz = params.fkFrequencyRange.highFrequencyHz,
        .waveformSampleRateHz = params.waveformSampleRate.waveformSampleRateHz,
        .waveformSampleRateToleranceHz = params.waveformSampleRate.waveformSampleRateToleranceHz,
        .uncertaintyOption = static_cast<GmsSigpro::FK_UNCERTAINTY_OPTION>(static_cast<int>(params.fkUncertaintyOption)),
        .taperFunction = static_cast<GmsSigpro::TAPER_FUNCTION>(static_cast<int>(params.fftTaperFunction)),
        .phaseType = params.phase.c_str()
    };
};

GmsSigpro::BeamDefinition ClassToCStructConverter::convertToStruct(BeamDefinition const& beamDefinition)
{
    return GmsSigpro::BeamDefinition{
        .beamType = static_cast<GmsSigpro::BEAM_TYPE>(static_cast<int>(beamDefinition.beamDescription.beamType)),
        .samplingType = static_cast<GmsSigpro::SAMPLING_TYPE>(static_cast<int>(beamDefinition.beamDescription.samplingType)),
        .beamSummation = static_cast<GmsSigpro::BEAM_SUMMATION_TYPE>(static_cast<int>(beamDefinition.beamDescription.beamSummation)),
        .location = {},
        .twoDimensional = beamDefinition.beamDescription.twoDimensional == true ? 1 : 0,
        .receiverToSourceAzimuthDeg = beamDefinition.beamParameters.receiverToSourceAzimuthDeg,
        .slownessSecPerDeg = beamDefinition.beamParameters.slownessSecPerDeg,
        .sampleRateHz = beamDefinition.beamParameters.sampleRateHz,
        .horizontalAngleDeg = beamDefinition.beamParameters.orientationAngles.horizontalAngleDeg,
        .verticalAngleDeg = beamDefinition.beamParameters.orientationAngles.verticalAngleDeg,
        .sampleRateToleranceHz = beamDefinition.beamParameters.sampleRateToleranceHz,
        .orientationAngleToleranceDeg = beamDefinition.beamParameters.orientationAngleToleranceDeg,
        .minWaveformsToBeam = beamDefinition.beamParameters.minWaveformsToBeam,
        .preFilterDefinition = nullptr
    };
};

GmsSigpro::TaperDefinition ClassToCStructConverter::convertToStruct(TaperDefinition const& taperDefinition)
{
    return {
        taperDefinition.taperLengthSamples,
        static_cast<GmsSigpro::TAPER_FUNCTION>(static_cast<int>(taperDefinition.taperFunction))
    };
};

GmsSigpro::ProcessingMaskDefinition ClassToCStructConverter::convertToStruct(GmsSigpro::FIX_TYPE fixType, int const& fixThreshold)
{
    return GmsSigpro::ProcessingMaskDefinition{ fixType, fixThreshold };
}
