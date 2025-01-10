PROJECT(UNIT_TESTS LANGUAGES C CXX)
include(CMakePrintHelpers)
include(FetchContent)
include(ExternalProject)

FetchContent_Declare(
        googletest
        URL ${GITHUB_URL}/google/googletest/archive/609281088cfefc76f9d0ce82e1ff6c30cc3591e5.zip
)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

set(GMS_TESTUTILS_TESTS_SRC
        DataGeneratorTests.cpp
        DataGeneratorTests.hh
)
add_executable(GMS_TESTUTILS_TESTS ${GMS_TESTUTILS_TESTS_SRC})
add_dependencies(GMS_TESTUTILS_TESTS gmstestutils)
target_compile_features(GMS_TESTUTILS_TESTS PUBLIC)
target_include_directories(GMS_TESTUTILS_TESTS PRIVATE ${JSONCPP_INCLUDE_DIR} ${GMS_TESTUTILS_INCLUDES})
target_link_libraries(GMS_TESTUTILS_TESTS gtest gtest_main gmstestutils ${JSONCPP_LIBRARY})

INCLUDE(GoogleTest)

GTEST_ADD_TESTS(TARGET GMS_TESTUTILS_TESTS old:)
GTEST_DISCOVER_TESTS(GMS_TESTUTILS_TESTS TEST_PREFIX new:)
ADD_TEST(NAME monolithic COMMAND GMS_TESTUTILS_TESTS)