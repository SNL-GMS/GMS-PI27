#ifndef QC_SEGMENT_VERSION_H
#define QC_SEGMENT_VERSION_H

#include <chrono>
#include <map>
#include <optional>
#include <string>
#include <vector>

#include "common/RequiredPropertyException.hh"

#include "Channel.hh"
#include "ChannelSegment.hh"
#include "ChannelVersionReference.hh"
#include "QcSegmentCategory.hh"
#include "QcSegmentType.hh"
#include "QcSegmentVersionId.hh"
#include "WorkflowDefinitionId.hh"

class QcSegmentVersion {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"id", false},
            {"channels", false},
            {"startTime", false},
            {"endTime", false},
            {"createdBy", false},
            {"rejected", false},
            {"rationale", false}
        };

        // TODO : bad_optional_access error if all optional params aren't passed to test
        std::optional<QcSegmentVersionId> _id;
        std::optional<QcSegmentCategory> _category;   // optional
        std::optional<std::vector<ChannelVersionReference>> _channels;
        std::optional<QcSegmentType> _type;   // optional
        std::optional<double> _startTime;
        std::optional<double> _endTime;
        std::optional<std::string> _createdBy;
        std::optional<bool> _rejected;
        std::optional<std::string> _rationale;
        std::optional<WorkflowDefinitionId> _stageId;   // optional
        std::optional<std::vector<ChannelSegmentDescriptor>> _discoveredOn;  // optional


        Builder& id(QcSegmentVersionId const& id) {
            this->_id = id;
            this->required["id"] = true;
            return *this;
        };

        Builder& category(QcSegmentCategory const& category) {
            this->_category = category;
            return *this;
        };

        Builder& channels(std::vector<ChannelVersionReference> const& channels) {
            this->_channels = channels;
            this->required["channels"] = true;
            return *this;
        };

        Builder& type(QcSegmentType const& type) {
            this->_type = type;
            return *this;
        };
        
        Builder& startTime(double const& startTime) {
            this->_startTime = startTime;
            this->required["startTime"] = true;
            return *this;
        };
        
        Builder& endTime(double const& endTime) {
            this->_endTime = endTime;
            this->required["endTime"] = true;
            return *this;
        };

        Builder& createdBy(std::string const& createdBy) {
            this->_createdBy = createdBy;
            this->required["createdBy"] = true;
            return *this;
        };

        Builder& rejected(bool rejected) {
            this->_rejected = rejected;
            this->required["rejected"] = true;
            return *this;
        };

        Builder& rationale(std::string const& rationale) {
            this->_rationale = rationale;
            this->required["rationale"] = true;
            return *this;
        };

        Builder& stageId(WorkflowDefinitionId stageId) {
            this->_stageId = stageId;
            return *this;
        };

        Builder& discoveredOn(std::vector<ChannelSegmentDescriptor> discoveredOn) {
            this->_discoveredOn = discoveredOn;
            return *this;
        };

        QcSegmentVersion build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = QcSegmentVersion(*this);
            return output;
        };
    };

    QcSegmentVersionId id;
    QcSegmentCategory category; //optional
    std::vector<ChannelVersionReference> channels;
    QcSegmentType type; //optional
    double startTime;
    double endTime;
    std::string createdBy;
    bool rejected;
    std::string rationale;
    WorkflowDefinitionId stageId; //optional
    std::vector<ChannelSegmentDescriptor> discoveredOn; //optional

private:
    explicit QcSegmentVersion(QcSegmentVersion::Builder bld)
        : id(bld._id.value()),
        category(bld._category.value()),
        channels(bld._channels.value()),
        type(bld._type.value()),
        startTime(bld._startTime.value()),
        endTime(bld._endTime.value()),
        createdBy(bld._createdBy.value()),
        rejected(bld._rejected.value()),
        rationale(bld._rationale.value()),
        stageId(bld._stageId.value()),
        discoveredOn(bld._discoveredOn.value()) {};
};

#endif //QC_SEGMENT_VERSION_H