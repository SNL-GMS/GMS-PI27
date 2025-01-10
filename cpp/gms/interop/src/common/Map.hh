#ifndef MAP_H
#define MAP_H

#include <string>
#include <unordered_map> 

template<class K, class V>
class Map {
private:
    std::unordered_map<K, V> internalMap;
public:
    explicit Map() = default;

    bool add(K const& key, V const& value) {
        auto pair = internalMap.try_emplace(key, value);
        return pair.second;
    };

    bool empty() const {
        return internalMap.empty();
    };

    bool exists(K const& key) const {
        return internalMap.count(key) > 0;
    };

    V get(K const& key) const {
        V result;
        if (auto search = internalMap.find(key); search != internalMap.end())
            result = search->second;
        return result;
    };

    bool remove(K const& key) {
        if (exists(key)) {
            internalMap.erase(key);
            return true;
        }
        else {
            return false;
        }
    };

    bool update(K const& key, V const& value) {
        if (exists(key)) {
            internalMap[key] = value;
            return true;
        }
        else { return false; }
    };
};

#endif //MAP_H