#ifndef WAVEFORM_AND_FILTER_DEFINITION_H
#define WAVEFORM_AND_FILTER_DEFINITION_H

#include <optional>
#include "FilterDefinitionUsage.hh"
#include "../filterprovider/definitions/BaseFilterDefinition.hh"
#include "ChannelSegmentFaceted.hh"

class WaveformAndFilterDefinition {
public:
    explicit WaveformAndFilterDefinition(
        std::optional<FilterDefinitionUsage> filterDefinitionUsage, std::optional<BaseFilterDefinition> filterDefinition, ChannelSegmentFaceted waveform)
        : filterDefinitionUsage(filterDefinitionUsage), filterDefinition(filterDefinition), waveform(waveform) {};
    std::optional<FilterDefinitionUsage> filterDefinitionUsage;
    std::optional<BaseFilterDefinition> filterDefinition;
    ChannelSegmentFaceted waveform;
};

#endif // WAVEFORM_AND_FILTER_DEFINITION