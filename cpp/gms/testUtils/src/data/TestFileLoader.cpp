#include "TestFileLoader.hh"

Json::Value TestFileLoader::getJson(std::string const& fileName) {
    std::ifstream inputData(fileName);

    if (!inputData.good()) {
        throw std::invalid_argument("Failed to load file" + fileName);
    }

    Json::Reader reader;
    Json::Value data;
    reader.parse(inputData, data);
    inputData.close();
    return data;
};