cmake_minimum_required(VERSION 3.20)
include(CMakePrintHelpers)
include(ExternalProject)

project(GMS LANGUAGES C CXX VERSION 1.0.1 DESCRIPTION "GMS COMMON C/C++ Code")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(!CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

set(GMS_LIB_FOLDER ${CMAKE_BINARY_DIR}/lib/)
FILE(MAKE_DIRECTORY ${GMS_LIB_FOLDER})
FILE(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/quality-reports)

if(DEFINED ENV{CI_REMOTE_REPOSITORY_URL})
        set(GITHUB_URL $ENV{CI_REMOTE_REPOSITORY_URL}/github-files-remote)
else()
        set(GITHUB_URL https://github.com)
endif()

if(CMAKE_BUILD_TYPE STREQUAL Debug)
    option(WITH_UNIT_TESTS "Enable project testing" ON)
    option(WITH_COVERAGE "Enable testing code coverage" OFF)
    option(WITH_DEBUG "Enable debugging" ON)
else()
    option(WITH_UNIT_TESTS "Enable project testing" OFF)
    option(WITH_COVERAGE "Enable testing code coverage" OFF)
    option(WITH_DEBUG "Enable debugging" OFF)
endif()

if(CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    set(emscripten_dir "/opt/emsdk/")
    message(" * C++ compiler: Emscripten")
    set(CMAKE_CXX_COMPILER_ID "Emscripten")
    set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ADDITIONAL_CXXFLAGS} -fPIC")
    set (CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${ADDITIONAL_CFLAGS} -fPIC")
    set (CMAKE_LD_FLAGS "${CMAKE_LD_FLAGS} ${ADDITIONAL_LDFLAGS}")
    set (FFTW_CONFIG_CMD ${CMAKE_BINARY_DIR}/fftw/src/project_fftw/configure 
        --disable-fortran 
        --enable-float
        --host=${CMAKE_HOST_SYSTEM_PROCESSOR}
        --prefix=${CMAKE_BINARY_DIR}/fftw/install
        CFLAGS=${CMAKE_C_FLAGS} 
        CXXFLAGS=${CMAKE_CXX_FLAGS} 
        LDFLAGS=${CMAKE_LD_FLAGS}
    )
else()
    message(" * C++ compiler: ${CMAKE_CXX_COMPILER_ID}")
    set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ADDITIONAL_CXXFLAGS} -g")
    set (CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${ADDITIONAL_CFLAGS} -fPIC")
    set (CMAKE_LD_FLAGS "${CMAKE_LD_FLAGS} ${ADDITIONAL_LDFLAGS}")
    if(WITH_DEBUG)
        set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ADDITIONAL_CFLAGS} -g")
        set (CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -g")
    endif()
    if(WITH_COVERAGE)
        set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ADDITIONAL_CXXFLAGS} --coverage")
        set (CMAKE_C_FLAGS "${CMAKE_CXX_FLAGS} ${ADDITIONAL_CXXFLAGS} --coverage")
    endif() 

    if(WITH_UNIT_TESTS)
        set(JSONCPP_INCLUDE_DIR ${CMAKE_BINARY_DIR}/jsoncpp/include)
        set(JSONCPP_LIBRARY_DIR ${CMAKE_BINARY_DIR}/jsoncpp/lib)
        ExternalProject_Add(project_jsoncpp
            URL ${GITHUB_URL}/open-source-parsers/jsoncpp/archive/refs/tags/1.9.5.zip
            PREFIX ${CMAKE_BINARY_DIR}/jsoncpp
            CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/jsoncpp
                    -DCMAKE_LIBRARY_OUTPUT_DIRECTORY=${JSONCPP_LIBRARY_DIR}
                    -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=${JSONCPP_LIBRARY_DIR}
                    # Build static lib but suitable to be included in a shared lib.
                    -DCMAKE_POSITION_INDEPENDENT_CODE=On
                    -DJSONCPP_WITH_TESTS=Off
                    -DJSONCPP_WITH_PKGCONFIG_SUPPORT=Off
                    -DCMAKE_CXX_FLAGS=${JSONCCP_EXTRA_FLAGS}
            # Overwrite build and install commands to force Release build on MSVC.
            BUILD_COMMAND cmake --build <BINARY_DIR>
        )

        add_library(jsoncpp STATIC IMPORTED)
        set(JSONCPP_LIBRARY ${JSONCPP_LIBRARY_DIR}/${CMAKE_STATIC_LIBRARY_PREFIX}jsoncpp${CMAKE_STATIC_LIBRARY_SUFFIX})
        set_property(TARGET jsoncpp PROPERTY IMPORTED_LOCATION ${JSONCPP_LIBRARY})
        set_property(TARGET jsoncpp PROPERTY INTERFACE_INCLUDE_DIRECTORIES ${JSONCPP_INCLUDE_DIR})
        set(GMS_TESTUTILS_INCLUDES ${PROJECT_SOURCE_DIR}/gms/testUtils/src)
        add_subdirectory(gms/testUtils)
    endif()
endif()

set(GMS_SIGPRO_INCLUDES ${PROJECT_SOURCE_DIR}/gms/sigpro/src)
set(GMS_INTEROP_INCLUDES ${PROJECT_SOURCE_DIR}/gms/interop/src)
add_subdirectory(gms/sigpro)
add_subdirectory(gms/interop)
add_subdirectory(gms/ui-wasm-provider)
