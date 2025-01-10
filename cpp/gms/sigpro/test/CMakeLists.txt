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

set(GMS_BEAM_TESTS_SRC
    beam/BeamValidationTest.hh
    beam/BeamValidationTest.cpp
    beam/BeamMissingInputsTest.hh
    beam/BeamMissingInputsTest.cpp
)

set(GMS_COMMON_TESTS_SRC
    common/TaperTest.hh
    common/TaperTest.cpp
    common/TaperUtilityTest.hh
    common/TaperUtilityTest.cpp
    common/TaperUtilityEndpointTest.hh
    common/TaperUtilityEndpointTest.cpp
    common/TaperUtilityChannelSegmentTest.hh
    common/TaperUtilityChannelSegmentTest.cpp
    common/VectorMathTest.hh
    common/VectorMathTest.cpp
    common/MissingInputChannelsTest.hh
    common/MissingInputChannelsTest.cpp
    common/FftForwardTest.hh
    common/FftForwardTest.cpp
)

set(GMS_FILTER_TESTS_SRC
    filter/payloads/TestEnums.hh
    filter/payloads/TestData.hh
    filter/payloads/TestData.cpp
    filter/payloads/TestFilters.hh
    filter/payloads/TestFilters.cpp
    filter/FilterTestUtils.hh
    filter/FilterTestUtils.cpp
    filter/IirButterworthFilterDesignTest.hh
    filter/IirButterworthFilterDesignTest.cpp
    filter/FilterDesignTest.hh
    filter/FilterDesignTest.cpp
    filter/IirButterworthFilterApplyTest.hh
    filter/IirButterworthFilterApplyTest.cpp
    filter/FilterApplyTest.hh
    filter/FilterApplyTest.cpp
    filter/GroupDelayTest.hh
    filter/GroupDelayTest.cpp
)

 set(GMS_FK_TESTS_SRC
    fk/DefaultFkTest.cpp
    fk/DefaultFkTest.hh
)

set(GMS_QC_TESTS_SRC
    qc/QcChannelSegmentTest.hh
    qc/QcChannelSegmentTest.cpp
    qc/QcMeanTest.hh
    qc/QcMeanTest.cpp
    qc/QcDemeanTest.hh
    qc/QcDemeanTest.cpp
)

set(GMS_ROTATION_TESTS_SRC
        rotation/RotationTests.hh
        rotation/RotationTests.cpp
)

add_executable(GMS_SIGPRO_TESTS ${GMS_BEAM_TESTS_SRC} ${GMS_COMMON_TESTS_SRC} ${GMS_FILTER_TESTS_SRC} ${GMS_FK_TESTS_SRC} ${GMS_QC_TESTS_SRC} ${GMS_ROTATION_TESTS_SRC})
add_dependencies(GMS_SIGPRO_TESTS gmstestutils project_fftw project_jsoncpp gmssigpro)
target_compile_features(GMS_SIGPRO_TESTS PUBLIC)
target_include_directories(GMS_SIGPRO_TESTS PRIVATE ${FFTW_INCLUDES_DIR} ${JSONCPP_INCLUDE_DIR} ${GMS_TESTUTILS_INCLUDES} ${GMS_SIGPRO_INCLUDES} ./)
target_link_libraries(GMS_SIGPRO_TESTS gtest gtest_main ${FFTW_LIBRARY} ${JSONCPP_LIBRARY} gmstestutils gmssigpro)

INCLUDE(GoogleTest)

GTEST_ADD_TESTS(TARGET GMS_SIGPRO_TESTS old:)
GTEST_DISCOVER_TESTS(GMS_SIGPRO_TESTS TEST_PREFIX new:)
ADD_TEST(NAME monolithic COMMAND GMS_SIGPRO_TESTS)