#include "BeamOrchestrator.hh"

GmsSigpro::ProcessingChannelSegment BeamOrchestrator::maskAndBeamWaveforms(
    GmsSigpro::BeamDefinition const* beamDefinition,
    std::vector<GmsSigpro::ProcessingChannelSegment> const* channelSegments,
    double const& beamStartTime,
    double const& beamEndTime,
    double const* mediumVelocity,
    GmsSigpro::ProcessingMaskDefinition const* processingMaskDefinition,
    GmsSigpro::TaperDefinition const* maskTaperDefinition)
{
    if (beamDefinition->preFilterDefinition)
    {
        filterDesign(beamDefinition->preFilterDefinition);
    }

    for (GmsSigpro::ProcessingChannelSegment channelSegment : *channelSegments)
    {
        qcFixChannelSegment(processingMaskDefinition, &channelSegment);
        qcDemean(&channelSegment);

        if (maskTaperDefinition)
        {
            qcTaperChannelSegment(maskTaperDefinition, &channelSegment);
        }

        if (beamDefinition->preFilterDefinition)
        {
            for (int j = 0; j < channelSegment.waveformCount; j++)
            {
                filterApply(beamDefinition->preFilterDefinition, &channelSegment.waveforms[j], (GmsSigpro::TaperDefinition*) nullptr);
                applyGroupDelay(beamDefinition->preFilterDefinition, &channelSegment.waveforms[j]);
            }
        }
    }

    GmsSigpro::ProcessingChannelSegment beam;

    if (auto returnCode = beamChannelSegment(beamDefinition,
        (int)channelSegments->size(),
        channelSegments->data(),
        beamStartTime,
        beamEndTime,
        mediumVelocity,
        processingMaskDefinition,
        maskTaperDefinition,
        &beam) != GmsSigpro::RETURN_CODE::SUCCESS)
    {
        throw std::invalid_argument("SigPro returned a code: " + std::to_string(returnCode));
    }

    for (GmsSigpro::ProcessingChannelSegment channelSegment : *channelSegments)
    {
        for (int i = 0; i < channelSegment.waveformCount; i++)
        {
            if (channelSegment.waveforms[i].maskedBy)
            {
                free(channelSegment.waveforms[i].maskedBy);
            }
        }
    }

    return beam;
}