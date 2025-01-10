#ifndef PROCESSING_MASK_H
#define PROCESSING_MASK_H

#include <string>
#include <vector>

#include "Channel.hh"
#include "ProcessingOperation.hh"
#include "TaperDefinition.hh"

#include "QcSegmentCategoryAndType.hh"
#include "QcSegmentVersion.hh"

class ProcessingMask
{
public:
  ProcessingMask(std::string const& id,
    Channel const& appliedToRawChannel,
    double const& effectiveAt,
    double const& startTime,
    double const& endTime,
    std::vector<QcSegmentVersion> const& maskedQcSegmentVersions,
    ProcessingOperation processingOperation)
    : id(id),
    appliedToRawChannel(appliedToRawChannel),
    effectiveAt(effectiveAt),
    endTime(endTime),
    maskedQcSegmentVersions(maskedQcSegmentVersions),
    processingOperation(processingOperation),
    startTime(startTime) {};

  std::string id;
  Channel appliedToRawChannel;
  double effectiveAt;
  double endTime;
  std::vector<QcSegmentVersion> maskedQcSegmentVersions;
  ProcessingOperation processingOperation;
  double startTime;
};

#endif //PROCESSING_MASK_DEFINITION_H
