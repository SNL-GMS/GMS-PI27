#ifndef CHANNEL_SEGMENT_H
#define CHANNEL_SEGMENT_H

#include <map>
#include <optional>
#include <string>
#include <vector>

#include "common/Channel.hh"
#include "common/ChannelSegmentDescriptor.hh"
#include "common/ChannelVersionReference.hh"
#include "common/ProcessingMask.hh"
#include "common/RequiredPropertyException.hh"
#include "common/TimeRangesByChannel.hh"

#include "Channel.hh"
#include "ChannelSegmentDescriptor.hh"
#include "ChannelVersionReference.hh"
#include "ProcessingMask.hh"
#include "TimeseriesType.hh"
#include "Waveform.hh"
#include "Units.hh"

class ChannelSegment
{
public:
    class Builder
    {

    public:
        Builder() = default;

        std::map<std::string, bool, std::less<>> required = {
            {"id", false},
            {"channelSegmentUnits", false},
            {"creationTime", false},
            {"endTime", false},
            {"startTime", false},
            {"timeseries", false},
            {"timeseriesType", false}
        };

        std::optional<ChannelSegmentDescriptor> _id;
        std::optional<Units> _channelSegmentUnits;
        std::optional<double> _creationTime;
        std::optional<double> _endTime;
        std::optional<double> _startTime;
        std::optional<std::vector<Waveform>> _timeseries;
        std::optional<TimeseriesType> _timeseriesType;

        Builder& id(ChannelSegmentDescriptor const& id)
        {
            this->_id = id;
            this->required["id"] = true;
            return *this;
        };

        Builder& channelSegmentUnits(Units channelSegmentUnits)
        {
            this->_channelSegmentUnits = channelSegmentUnits;
            this->required["channelSegmentUnits"] = true;
            return *this;
        };

        Builder& creationTime(double creationTime)
        {
            this->_creationTime = creationTime;
            this->required["creationTime"] = true;
            return *this;
        };

        Builder& endTime(double endTime)
        {
            this->_endTime = endTime;
            this->required["endTime"] = true;
            return *this;
        };

        Builder& startTime(double startTime)
        {
            this->_startTime = startTime;
            this->required["startTime"] = true;
            return *this;
        };

        Builder& timeseries(std::vector<Waveform> timeseries)
        {
            this->_timeseries = timeseries;
            this->required["timeseries"] = true;
            return *this;
        };

        Builder& timeseriesType(TimeseriesType timeseriesType)
        {
            this->_timeseriesType = timeseriesType;
            this->required["timeseriesType"] = true;
            return *this;
        };
        ChannelSegment build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = ChannelSegment(*this);
            return output;
        };
    };

    ChannelSegmentDescriptor id;
    TimeseriesType timeseriesType;
    Units channelSegmentUnits;
    double creationTime;
    double startTime;
    double endTime;
    std::vector<ProcessingMask> maskedBy;
    std::vector<TimeRangesByChannel> missingInputChannels;
    std::vector<Waveform> timeseries;

private:
    explicit ChannelSegment(ChannelSegment::Builder bld)
        : id(bld._id.value()),
        timeseriesType(bld._timeseriesType.value()),
        channelSegmentUnits(bld._channelSegmentUnits.value()),
        creationTime(bld._creationTime.value()),
        startTime(bld._startTime.value()),
        endTime(bld._endTime.value()),
        timeseries(bld._timeseries.value()) {};

};

#endif // CHANNEL_SEGMENT_H