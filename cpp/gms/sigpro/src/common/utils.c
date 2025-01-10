#include "utils.h"

int equalWithinTolerance(double compare, double value, double tolerance)
{
    return compare >= value - tolerance && compare <= value + tolerance;
}

long min(long value1, long value2)
{
    if (value1 < value2)
    {
        return value1;
    }
    else 
    {
        return value2;
    }
}