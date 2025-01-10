#ifndef FK_COMPUTE_UTILITY_H
#define FK_COMPUTE_UTILITY_H

#include <map>
#include <string>
#include <vector>
#include <cmath>

#include "common/ChannelSegment.hh"
#include "common/ChannelVersionReference.hh"
#include "common/DoubleValue.hh"
#include "common/Map.hh"
#include "common/ProcessingMask.hh"
#include "common/RelativePosition.hh"
#include "common/Station.hh"
#include "common/TaperDefinition.hh"
#include "common/Units.hh"
#include "utils/DataAlignmentUtility.hh"
#include "utils/ProcessingMaskUtility.hh"

#include "utils/ClassToCStructConverter.hh"

#include "FkSpectra.hh"
#include "FkSpectraDefinition.hh"
#include "FkSpectrumWindow.hh"
#include "FkComputeException.hh"
#include "FkTimeseriesWithMissingInputChannels.hh"

namespace GmsSigpro {
    extern "C" {
#include <common/structs.h>
#include <fk/structs.h>
#include <fk/fk.h>
    }
}
class FkComputeUtility
{
public:
    FkTimeseriesWithMissingInputChannels computeFk(
        const FkSpectraDefinition* fkSpectraDefinition,
        const Station* station,
        const std::vector<std::string>* inputChannelNames,
        double startTime,
        double endTime,
        double detectionTime,
        const std::vector<ChannelSegment>* channelSegments,
        const Map<std::string, std::vector<ProcessingMask>>* processingMasksByChannels,
        std::optional<TaperDefinition> maskTaperDefinition) const;

    FkAttributes getPeakFkAttributes(FkSpectra const& fkSpectra) const;

};

#endif // FK_COMPUTE_UTILITY_H