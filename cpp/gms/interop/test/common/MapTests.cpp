#include "MapTests.hh"

void MapTests::SetUp() {};

TEST_F(MapTests, MAP_CTOR){

    auto actual = Map<std::string, bool>();
    EXPECT_NO_THROW();
}

TEST_F(MapTests, MAP_EMPTY){

    auto const payload = std::string("RALPH");
    auto actual = Map<std::string, bool>();
    EXPECT_FALSE(actual.exists(payload));
    EXPECT_NO_THROW();
}

TEST_F(MapTests, MAP_ADD){
    auto const payload = std::string("RALPH");
    auto actual = Map<std::string, bool>();
    actual.add(payload, true);
    EXPECT_TRUE(actual.exists(payload));
    EXPECT_NO_THROW();
}

TEST_F(MapTests, MAP_GET){
    auto const payload = std::string("RALPH");
    auto actual = Map<std::string, bool>();
    actual.add(payload, true);
    EXPECT_TRUE(actual.exists(payload));
    EXPECT_TRUE(actual.get(payload));
    EXPECT_NO_THROW();
}

TEST_F(MapTests, MAP_REMOVE){
    auto const payload = std::string("RALPH");
    auto actual = Map<std::string, bool>();
    actual.add(payload, true);
    EXPECT_TRUE(actual.remove(payload));
    EXPECT_FALSE(actual.exists(payload));
    EXPECT_NO_THROW();
}

TEST_F(MapTests, MAP_UPDATE){
    auto const payload = std::string("RALPH");
    auto actual = Map<std::string, bool>();
    actual.add(payload, true);
    EXPECT_TRUE(actual.update(payload, false));
    EXPECT_TRUE(actual.exists(payload));
    EXPECT_FALSE(actual.get(payload));
    EXPECT_NO_THROW();
}