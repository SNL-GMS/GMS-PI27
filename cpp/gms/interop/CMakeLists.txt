cmake_minimum_required(VERSION 3.20)
include(CMakePrintHelpers)
project(GMS_INTEROP_PROVIDER LANGUAGES CXX VERSION 1.0.1 DESCRIPTION "GMS Interop Provider")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(GMS_INTEROP_COMMON_SRC
    src/common/AmplitudeMeasurementValue.hh
    src/common/ArrivalTimeMeasurementValue.hh
    src/common/BaseVersionReference.hh
    src/common/Channel.hh
    src/common/ChannelSegment.hh
    src/common/ChannelSegmentDescriptor.hh
    src/common/ChannelSegmentFaceted.hh
    src/common/ChannelVersionReference.hh
    src/common/DepthRestraintReason.hh
    src/common/DoubleValue.hh
    src/common/DurationMeasurementValue.hh
    src/common/DurationValue.hh
    src/common/Ellipse.hh
    src/common/Ellipsoid.hh
    src/common/EnumeratedMeasurementValue.hh
    src/common/EnumerationType.hh
    src/common/EventHypothesis.hh
    src/common/EventHypothesisId.hh
    src/common/EventLocation.hh
    src/common/FeatureMeasurement.hh
    src/common/FeatureMeasurementType.hh
    src/common/FeatureMeasurementWrapper.hh
    src/common/FeaturePrediction.hh
    src/common/FeaturePredictionComponent.hh
    src/common/FeaturePredictionComponentType.hh
    src/common/FeaturePredictionDerivativeMap.hh
    src/common/FeaturePredictionDerivativeType.hh
    src/common/FilterDefinitionUsage.hh
    src/common/InstantValue.hh
    src/common/Location.cpp
    src/common/Location.hh
    src/common/LocationBehavior.hh
    src/common/LocationRestraint.hh
    src/common/LocationSolution.hh
    src/common/LocationUncertainty.hh
    src/common/MagnitudeModel.hh
    src/common/MagnitudeType.hh
    src/common/Map.hh
    src/common/NetworkMagnitudeBehavior.hh
    src/common/NetworkMagnitudeSolution.hh
    src/common/NumericMeasurementValue.hh
    src/common/OrientationAngles.cpp
    src/common/OrientationAngles.hh
    src/common/PredictionValue.hh
    src/common/ProcessingMask.hh
    src/common/ProcessingOperation.hh
    src/common/QcSegment.hh
    src/common/QcSegmentCategory.hh
    src/common/QcSegmentCategoryAndType.hh
    src/common/QcSegmentType.hh
    src/common/QcSegmentVersion.hh
    src/common/QcSegmentVersionId.hh
    src/common/RelativePosition.hh
    src/common/RequiredPropertyException.hh
    src/common/RestraintType.hh
    src/common/SamplingType.hh
    src/common/ScalingFactorType.hh
    src/common/SignalDetectionHypothesis.hh
    src/common/SignalDetectionHypothesisFaceted.hh
    src/common/SignalDetectionHypothesisId.hh
    src/common/Station.hh
    src/common/StationMagnitudeSolution.hh
    src/common/StationType.hh
    src/common/StationVersionReference.hh
    src/common/TaperDefinition.hh
    src/common/TaperFunction.hh
    src/common/TimeParseException.hh
    src/common/TimeRange.hh
    src/common/TimeRangesByChannel.hh
    src/common/Timeseries.hh
    src/common/TimeseriesType.hh
    src/common/TimeseriesWithMissingInputChannels.hh
    src/common/Units.hh
    src/common/ValueTypeOrT.hh
    src/common/ValueTypeWrapper.hh
    src/common/VersionReference.hh
    src/common/Waveform.hh
    src/common/WaveformAndFilterDefinition.hh
    src/common/WorkflowDefinitionId.hh
)

set(GMS_BEAM_PROVIDER_SRC
    src/beamprovider/definitions/BeamDefinition.hh
    src/beamprovider/descriptions/BeamDescription.hh
    src/beamprovider/parameters/BeamParameters.hh
    src/beamprovider/BeamProvider.cpp
    src/beamprovider/BeamProvider.hh
    src/beamprovider/BeamSummationType.hh
    src/beamprovider/BeamType.hh
    src/beamprovider/BeamOrchestrator.hh
    src/beamprovider/BeamOrchestrator.cpp
)

set(GMS_FILTER_PROVIDER_SRC
    src/filterprovider/definitions/BaseFilterDefinition.hh
    src/filterprovider/descriptions/BaseFilterDescription.cpp
    src/filterprovider/descriptions/BaseFilterDescription.hh
    src/filterprovider/descriptions/BaseLinearFilterDescription.cpp
    src/filterprovider/descriptions/BaseLinearFilterDescription.hh
    src/filterprovider/descriptions/CascadeFilterDescription.cpp
    src/filterprovider/descriptions/CascadeFilterDescription.hh
    src/filterprovider/descriptions/LinearFIRFilterDescription.cpp
    src/filterprovider/descriptions/LinearFIRFilterDescription.hh
    src/filterprovider/descriptions/LinearIIRFilterDescription.cpp
    src/filterprovider/descriptions/LinearIIRFilterDescription.hh
    src/filterprovider/parameters/BaseFilterParameters.cpp
    src/filterprovider/parameters/BaseFilterParameters.hh
    src/filterprovider/parameters/CascadeFilterParameters.cpp
    src/filterprovider/parameters/CascadeFilterParameters.hh
    src/filterprovider/parameters/FIRFilterParameters.cpp
    src/filterprovider/parameters/FIRFilterParameters.hh
    src/filterprovider/parameters/IIRFilterParameters.cpp
    src/filterprovider/parameters/IIRFilterParameters.hh
    src/filterprovider/wrappers/FilterDescriptionWrapper.cpp
    src/filterprovider/wrappers/FilterDescriptionWrapper.hh
    src/filterprovider/constants.hh
    src/filterprovider/enums.hh
    src/filterprovider/FilterDesigner.cpp
    src/filterprovider/FilterDesigner.hh
    src/filterprovider/FilterProvider.cpp
    src/filterprovider/FilterProvider.hh   
)
set(GMS_FK_PROVIDER_SRC
    src/fkprovider/FkAttributes.hh
    src/fkprovider/FkComputeUtility.cpp
    src/fkprovider/FkComputeUtility.hh
    src/fkprovider/FkFrequencyRange.hh
    src/fkprovider/FkSpectra.hh
    src/fkprovider/FkSpectraDefinition.hh
    src/fkprovider/FkSpectraMetadata.hh
    src/fkprovider/FkSpectraParameters.hh
    src/fkprovider/FkSpectrum.hh
    src/fkprovider/FkSpectrumWindow.hh
    src/fkprovider/FkUncertaintyOption.hh
    src/fkprovider/FkWaveformSampleRate.hh
    src/fkprovider/SlownessGrid.hh
    src/fkprovider/FkTimeseriesWithMissingInputChannels.hh
)

set(GMS_ROTATION_PROVIDER_SRC
    src/rotationprovider/RotationDefinition.hh
    src/rotationprovider/RotationDescription.hh
    src/rotationprovider/RotationParameters.hh
    src/rotationprovider/RotationProvider.cpp
    src/rotationprovider/RotationProvider.hh
)

set(GMS_UTILS_INTEROP_SRC
    src/utils/ClassToCStructConverter.cpp
    src/utils/ClassToCStructConverter.hh
    src/utils/DataAlignmentUtility.cpp
    src/utils/DataAlignmentUtility.hh
    src/utils/ProcessingMaskUtility.cpp
    src/utils/ProcessingMaskUtility.hh
    src/utils/CStructToClassConverter.cpp
    src/utils/CStructToClassConverter.hh
)

set(GMS_WASM_INTEROP_SRC
    src/wasm/CommonInterop.hh
    src/wasm/CommonInterop.cpp
    src/wasm/ArrayConverter.hh
    src/wasm/ArrayConverter.cpp
)


add_library(gmsinterop ${GMS_INTEROP_COMMON_SRC} ${GMS_BEAM_PROVIDER_SRC} ${GMS_FILTER_PROVIDER_SRC} ${GMS_FK_PROVIDER_SRC} ${GMS_ROTATION_PROVIDER_SRC} ${GMS_UTILS_INTEROP_SRC} ${GMS_WASM_INTEROP_SRC})
add_dependencies(gmsinterop gmssigpro)
set_target_properties(gmsinterop PROPERTIES VERSION ${PROJECT_VERSION})
target_include_directories(gmsinterop PRIVATE ${GMS_SIGPRO_INCLUDES} ${GMS_INTEROP_INCLUDES})
target_link_libraries(gmsinterop gmssigpro)
ADD_CUSTOM_COMMAND(TARGET gmsinterop POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:gmsinterop> ${GMS_LIB_FOLDER}
)
if(NOT CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    if(WITH_UNIT_TESTS)
        message(STATUS "C++ tests enabled")
        add_subdirectory(./test)
    endif()
endif()
if(CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    SET(GMS_WASM_OUTPUT_FOLDER ${CMAKE_BINARY_DIR}/wasm)
    FILE(MAKE_DIRECTORY ${GMS_WASM_OUTPUT_FOLDER})
    # add target/command to build the wasm as a single file for bundling purposes and generate the Typescript types
    ADD_CUSTOM_TARGET(run ALL
        COMMAND emcc -lembind -O3 -fexceptions # TODO use -fwasm-exceptions
            -Wl,--whole-archive ${GMS_LIB_FOLDER}/libgmsinterop.a -Wl,--no-whole-archive
            ${GMS_LIB_FOLDER}/libgmssigpro.a
            --std=c++17
            -s EXPORT_EXCEPTION_HANDLING_HELPERS
            -s EXPORTED_FUNCTIONS='["_cascadeFilterApply","_iirFilterApply","_firFilterApply","_malloc","_free"]'
            -s EXPORTED_RUNTIME_METHODS=ccall,cwrap,setValue,getValue
            -s EXPORT_NAME=gmsInterop
            -o ${GMS_WASM_OUTPUT_FOLDER}/gms-interop-module.js
            --embind-emit-tsd ${GMS_WASM_OUTPUT_FOLDER}/gms-interop-module.d.ts
            -s ALLOW_MEMORY_GROWTH=1
            -s LLD_REPORT_UNDEFINED
            -s INITIAL_MEMORY=500mb
            -s MAXIMUM_MEMORY=4gb
            -s STACK_SIZE=400mb
            -s MODULARIZE=1
            -s SINGLE_FILE=1
        DEPENDS gmsinterop
    )
endif()