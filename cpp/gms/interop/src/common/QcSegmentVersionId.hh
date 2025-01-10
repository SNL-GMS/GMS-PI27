#ifndef QC_SEGMENT_VERSION_ID_H
#define QC_SEGMENT_VERSION_ID_H

#include <chrono>
#include <string>

#include "BaseVersionReference.hh"

class QcSegmentVersionId : public BaseVersionReference
{

public:
    QcSegmentVersionId(std::string const &parentQcSegmentId, double const &effectiveAt)
        : BaseVersionReference(effectiveAt), parentQcSegmentId(parentQcSegmentId){};

    std::string parentQcSegmentId;
};

#endif // QC_SEGMENT_VERSION_ID_H