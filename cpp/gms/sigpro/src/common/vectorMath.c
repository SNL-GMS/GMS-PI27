#include <math.h>
#include "enums.h"
#include "vectorMath.h"

int vectorInit(double* data, long vectorSize, double initialValue)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; ++i)
    {
        data[i] = initialValue;
    }

    return SUCCESS;
}

int vectorAdd(double* base, const double* toAdd, long vectorSize)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        base[i] += toAdd[i];
    }

    return SUCCESS;
}

int vectorSum(const double* vector, long vectorSize, double* sum)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    *sum = 0.0;
    for (int i = 0; i < vectorSize; i++)
    {
        *sum += vector[i];
    }

    return SUCCESS;
}

int vectorScalarSubtract(double* vector, long vectorSize, double scalar)
{

    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    if (scalar == 0.0)
    {
        return SUCCESS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        vector[i] -= scalar;
    }

    return SUCCESS;
}

int vectorMean(const double* vector, long vectorSize, double* mean)
{
    double sum;
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    int sumResult = vectorSum(vector, vectorSize, &sum);
    if (sumResult != SUCCESS)
    {
        return sumResult;
    }

    *mean = sum / (double)(vectorSize);

    return SUCCESS;
}

int vectorDemean(double* vector, long vectorSize)
{
    double mean;
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    int meanResult = vectorMean(vector, vectorSize, &mean);
    if (meanResult != SUCCESS)
    {
        return meanResult;
    }

    return vectorScalarSubtract(vector, vectorSize, mean);
}

int vectorAbs(double* vector, long vectorSize)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        vector[i] = fabs(vector[i]);
    }

    return SUCCESS;
}

int vectorSquare(double* vector, long vectorSize)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        vector[i] *= vector[i];
    }

    return SUCCESS;
}

int vectorSqrt(double* vector, long vectorSize)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        vector[i] = sqrt(vector[i]);
    }

    return SUCCESS;
}

int vectorDiv(double* vector, const double* divisor, long vectorSize)
{
    if (vectorSize < 1)
    {
        return INVALID_BOUNDS;
    }

    for (int i = 0; i < vectorSize; i++)
    {
        vector[i] /= divisor[i];
    }

    return SUCCESS;
}