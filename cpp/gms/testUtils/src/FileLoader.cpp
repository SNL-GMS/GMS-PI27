#include "FileLoader.hh"

//implementation
Json::Value GmsTestUtils::FileLoader::getJson(std::string const& fileName) {
    std::string testFilePath;

    if (std::getenv("GMS_COMMON_HOME")) {
        testFilePath = std::string(std::getenv("GMS_COMMON_HOME")) + "/cpp/gms/testUtils/src/data/" + fileName;
    }
    else if (std::getenv("CI_PROJECT_DIR")) {
        testFilePath = std::string(std::getenv("CI_PROJECT_DIR")) + "/cpp/gms/testUtils/src/data/" + fileName;
    }
    else {
        throw std::invalid_argument("Environment Variables 'GMS_COMMON_HOME' or 'CI_PROJECT_DIR' not set. Please set this to your repo directory");
    }

    std::ifstream inputData(testFilePath);
    if (!inputData.good()) {
        throw std::invalid_argument("Failed to load file" + testFilePath);
    }

    Json::Reader reader;
    Json::Value data;
    reader.parse(inputData, data);
    inputData.close();
    return data;
};