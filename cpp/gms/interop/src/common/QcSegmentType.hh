#ifndef QC_SEGMENT_TYPE_H
#define QC_SEGMENT_TYPE_H

enum class QcSegmentType{
    AGGREGATE = 0,
    CALIBRATION = 1,
    FLAT = 2,
    GAP = 3,
    NOISY = 4,
    SENSOR_PROBLEM = 5,
    SPIKE = 6,
    STATION_PROBLEM = 7,
    STATION_SECURITY = 8,
    TIMING = 9
};

#endif //QC_SEGMENT_TYPE_H
