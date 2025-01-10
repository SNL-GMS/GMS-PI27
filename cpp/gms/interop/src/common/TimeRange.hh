#ifndef TIME_RANGE_H
#define TIME_RANGE_H

class TimeRange {
public:
    TimeRange(double const& start,
        double const& end) : startTime(start), endTime(end) {};

    double startTime;
    double endTime;
};

#endif //TIME_RANGE_H