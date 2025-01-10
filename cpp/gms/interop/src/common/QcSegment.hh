#ifndef QC_SEGMENT_H
#define QC_SEGMENT_H

#include <string>

#include "Channel.hh"
#include "QcSegmentVersion.hh"

class QcSegment {

    public:
        QcSegment(
            std::string const& id,
            Channel const& channel,
            QcSegmentVersion const& versionHistory
        ) 
            : id(id),
            channel(channel),
            versionHistory(versionHistory){};

        std::string id;
        Channel channel;
        QcSegmentVersion versionHistory;

};

#endif //QC_SEGMENT_H