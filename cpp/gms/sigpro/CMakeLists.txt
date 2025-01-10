cmake_minimum_required(VERSION 3.20)
include(CMakePrintHelpers)
include(ExternalProject)

project(GMS_SIGPRO_PROVIDER LANGUAGES C VERSION 1.0.1 DESCRIPTION "GMS Sigpro")

set(GMS_LIB_FOLDER ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${ADDITIONAL_CFLAGS} -fPIC")
    
if(DEFINED ENV{CI_REMOTE_REPOSITORY_URL})
    set(FFTW_URL $ENV{CI_REMOTE_REPOSITORY_URL}/fftw-files-remote)
else()
    set(FFTW_URL https://www.fftw.org)
endif()

set(FFTW_PREFIX ${CMAKE_BINARY_DIR}/fftw)
set(FFTW_CONFIG_CMD ${FFTW_PREFIX}/src/project_fftw/configure --prefix=${FFTW_PREFIX}/install)
set(FFTW_INCLUDES_DIR ${FFTW_PREFIX}/install/include)
set(FFTW_LIBRARY_DIR ${FFTW_PREFIX}/install/lib)

if (CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    SET(FFTW_CONFIG cd ${FFTW_PREFIX}/src/ && emconfigure ./configure --enable-silent-rules --quiet --disable-fortran --prefix=${FFTW_PREFIX}/install)
    SET(FFTW_BUILD emmake make -j CFLAGS=${FFTW_CFLAGS} --silent V=0 && emmake make install --silent V=0 && emmake make clean --silent V=0)
else ()
    SET(FFTW_CONFIG ${FFTW_PREFIX}/src/configure --enable-silent-rules --quiet --disable-fortran --prefix=${FFTW_PREFIX}/install)
    SET(FFTW_BUILD make -j CFLAGS=${FFTW_CFLAGS} --silent V=0 && make install --silent V=0 && make clean --silent V=0)
endif ()

ExternalProject_Add(project_fftw
    URL ${FFTW_URL}/fftw-3.3.10.tar.gz
    PREFIX ${FFTW_PREFIX}
    CONFIGURE_COMMAND ${FFTW_CONFIG_CMD}
    INSTALL_DIR ${FFTW_PREFIX}/install
    CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${FFTW_PREFIX}/install
               -DCMAKE_LIBRARY_OUTPUT_DIRECTORY=${FFTW_LIBRARY_DIR}
               -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=${FFTW_LIBRARY_DIR}
)
ExternalProject_Get_Property(project_fftw INSTALL_DIR)
add_library(libfftw STATIC IMPORTED)
set(FFTW_LIBRARY ${FFTW_LIBRARY_DIR}/${CMAKE_STATIC_LIBRARY_PREFIX}fftw3${CMAKE_STATIC_LIBRARY_SUFFIX})
file(MAKE_DIRECTORY ${FFTW_INCLUDES_DIR})  # Must exist.
set_property(TARGET libfftw PROPERTY IMPORTED_LOCATION ${FFTW_LIBRARY})
set_property(TARGET libfftw PROPERTY INTERFACE_INCLUDE_DIRECTORIES ${FFTW_INCLUDES_DIR})
add_dependencies(libfftw project_fftw)
unset(INSTALL_DIR)

set(GMS_BEAM_SRC
    src/beam/enums.h
    src/beam/structs.h
    src/beam/beam.h
    src/beam/beam.c
)

set(GMS_COMMON_SRC
    src/common/enums.h
    src/common/structs.h
    src/common/vectorMath.h
    src/common/vectorMath.c
    src/common/utils.h
    src/common/utils.c
    src/common/taper.h
    src/common/taper.c
    src/common/missingInputChannels.h
    src/common/missingInputChannels.c
    src/common/fft.h
    src/common/fft.c
)

set(GMS_FILTER_SRC
    src/filter/constants.h
    src/filter/enums.h
    src/filter/structs.h
    src/filter/filter_iir.c
    src/filter/filter_iir.h
    src/filter/filter.h
    src/filter/filter.c
)

set(GMS_FK_SRC
    src/fk/enums.h
    src/fk/structs.h
    src/fk/fk.h
    src/fk/fk.c
)

set(GMS_QC_SRC
    src/qc/qc.h
    src/qc/qc.c
)

set(GMS_ROTATION_SRC
    src/rotation/rotation.h
    src/rotation/rotation.c
)
             
add_library(gmssigpro ${GMS_BEAM_SRC} ${GMS_COMMON_SRC} ${GMS_FILTER_SRC} ${GMS_FK_SRC} ${GMS_QC_SRC} ${GMS_ROTATION_SRC})
add_dependencies(gmssigpro project_fftw)
set_target_properties(gmssigpro PROPERTIES VERSION ${PROJECT_VERSION})
target_link_libraries(gmssigpro libfftw)
target_include_directories(gmssigpro PRIVATE ${FFTW_INCLUDES_DIR} ${GMS_SIGPRO_INCLUDES})

ADD_CUSTOM_COMMAND(TARGET gmssigpro POST_BUILD
    COMMAND ${CMAKE_COMMAND} 
)

ADD_CUSTOM_COMMAND(TARGET gmssigpro POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:gmssigpro> ${GMS_LIB_FOLDER}
)

if(NOT CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    if(WITH_UNIT_TESTS)
        message(STATUS "C tests enabled")
        add_subdirectory(./test)
    endif()
endif()