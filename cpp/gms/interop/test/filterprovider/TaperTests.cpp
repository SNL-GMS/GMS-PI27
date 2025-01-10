#include "TaperTests.hh"

void TaperTests::SetUp()
{
    TEST_DATA = FilterTestUtils::getThreeSecondDataCopy();
};

TEST_F(TaperTests, TAPER_1SEC_FWD)
{
    FilterTestUtils testUtils;
    try
    {
        _filterTaper(
            TEST_DATA.data(),
            TaperTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE,
            40,
            0);
        std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::TAPER_FWD);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), TaperTests::TEST_DATA_SIZE);
    }
    catch (std::exception& e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(TaperTests, TAPER_1SEC_REV)
{
    FilterTestUtils testUtils;
    try
    {
        _filterTaper(
            TEST_DATA.data(),
            TaperTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE,
            40,
            1);
        std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::TAPER_REV);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), TaperTests::TEST_DATA_SIZE);
    }
    catch (std::exception& e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(TaperTests, TAPER_1SEC_BOTH)
{
    FilterTestUtils testUtils;
    try
    {
        _filterTaper(
            TEST_DATA.data(),
            TaperTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE,
            40,
            2);
        std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::TAPER_BOTH);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), TaperTests::TEST_DATA_SIZE);
    }
    catch (std::exception& e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};