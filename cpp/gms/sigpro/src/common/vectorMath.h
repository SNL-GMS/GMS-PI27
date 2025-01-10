#ifndef GMS_VECTOR_MATH_H
#define GMS_VECTOR_MATH_H

extern int vectorInit(double* data, long vectorSize, double initialValue);

extern int vectorAdd(double* base, const double* toAdd, long vectorSize);

extern int vectorSum(const double* vector, long vectorSize, double* sum);

extern int vectorScalarSubtract(double* vector, long vectorSize, double scalar);

extern int vectorMean(const double* vector, long vectorSize, double* mean);

extern int vectorDemean(double* vector, long vectorSize);

extern int vectorAbs(double* vector, long vectorSize);

extern int vectorSquare(double* vector, long vectorSize);

extern int vectorSqrt(double* vector, long vectorSize);

extern int vectorDiv(double* vector, const double* divisor, long vectorSize);

#endif // GMS_VECTOR_MATH_H