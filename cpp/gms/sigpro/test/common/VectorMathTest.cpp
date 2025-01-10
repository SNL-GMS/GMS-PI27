#include "VectorMathTest.hh"

void VectorMathTest::SetUp()
{
};

TEST_F(VectorMathTest, VECTOR_INIT_INVALID_BOUNDS_TEST)
{
    double* data = (double*) malloc(10 * sizeof(double));

    int status = vectorInit(data, -10, 3.0);
    ASSERT_EQ(status, INVALID_BOUNDS);

    free(data);
}

TEST_F(VectorMathTest, VECTOR_INIT_SUCCESS_TEST)
{
    double* data = (double*) malloc(10 * sizeof(double));

    int status = vectorInit(data, 10, 3.0);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(3.0, data[i]);
    }

    free(data);
}

TEST_F(VectorMathTest, VECTOR_ADD_INVALID_BOUNDS_TEST)
{
    double* base = (double*) malloc(10 * sizeof(double));
    double* toAdd = (double*) malloc(10 * sizeof(double));
    vectorInit(base, 10, 2.6);
    vectorInit(toAdd, 10, 32.4);

    int status = vectorAdd(base, toAdd, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(2.6, base[i]);
    }

    free(base);
    free(toAdd);
}

TEST_F(VectorMathTest, VECTOR_ADD_SUCCESS_TEST)
{
    double* base = (double*) malloc(10 * sizeof(double));
    double* toAdd = (double*) malloc(10 * sizeof(double));
    vectorInit(base, 10, 2.6);
    vectorInit(toAdd, 10, 32.4);

    int status = vectorAdd(base, toAdd, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(35.0, base[i]);
    }

    free(base);
    free(toAdd);
}

TEST_F(VectorMathTest, VECTOR_SUM_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double sum;
    vectorInit(vector, 10, 3);

    int status = vectorSum(vector, -10, &sum);
    ASSERT_EQ(status, INVALID_BOUNDS);

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SUM_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double sum;
    vectorInit(vector, 10, 3.0);

    int status = vectorSum(vector, 10, &sum);
    ASSERT_EQ(status, SUCCESS);

    ASSERT_EQ(30.0, sum);

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SCALAR_SUBTRACT_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    vectorInit(vector, 10, 3.0);

    int status = vectorScalarSubtract(vector, -10, 2.0);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], 3.0);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SCALAR_SUBTRACT_ZERO_SUCCESS)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    vectorInit(vector, 10, 3.0);

    int status = vectorScalarSubtract(vector, 10, 0.0);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], 3.0);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SCALAR_SUBTRACT_NONZERO_SUCCESS)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    vectorInit(vector, 10, 3.0);
    
    int status = vectorScalarSubtract(vector, 10, 1.7);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], 1.3);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_MEAN_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double mean;

    int status = vectorMean(vector, -10, &mean);
    ASSERT_EQ(status, INVALID_BOUNDS);

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_MEAN_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double mean;

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) i;
    }

    int status = vectorMean(vector, 10, &mean);
    ASSERT_EQ(status, SUCCESS);

    ASSERT_EQ(mean, 4.5);

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_DEMEAN_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) i;
    }

    int status = vectorDemean(vector, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_DEMEAN_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) i;
    }

    int status = vectorDemean(vector, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) i - 4.5);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_ABS_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) -i;
    }   

    int status = vectorAbs(vector, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], -i);
    }    

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_ABS_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) -i;
    }

    int status = vectorAbs(vector, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) i);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SQUARE_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) i; 
    }

    int status = vectorSquare(vector, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) i);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SQUARE_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) i;
    }

    int status = vectorSquare(vector, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) (i * i));
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SQRT_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) (i * i);
    }

    int status = vectorSqrt(vector, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) (i * i));
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_SQRT_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) (i * i);
    }

    int status = vectorSqrt(vector, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) i);
    }

    free(vector);
}

TEST_F(VectorMathTest, VECTOR_DIV_INVALID_BOUNDS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double* divisor = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) (i + 1);
        divisor[i] = (double) (i + 1);
    }

    int status = vectorDiv(vector, divisor, -10);
    ASSERT_EQ(status, INVALID_BOUNDS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], (double) (i + 1));
    }

    free(vector);
    free(divisor);
}

TEST_F(VectorMathTest, VECTOR_DIV_SUCCESS_TEST)
{
    double* vector = (double*) malloc(10 * sizeof(double));
    double* divisor = (double*) malloc(10 * sizeof(double));

    for (int i = 0; i < 10; i++)
    {
        vector[i] = (double) (i + 1);
        divisor[i] = (double) (i + 1);
    }

    int status = vectorDiv(vector, divisor, 10);
    ASSERT_EQ(status, SUCCESS);

    for (int i = 0; i < 10; i++)
    {
        ASSERT_EQ(vector[i], 1.0);
    }

    free(vector);
    free(divisor);
}