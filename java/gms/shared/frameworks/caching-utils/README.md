# Utility for utilizing Ignite caches

This utility sets up Ignite caches with appropriate configurations.  

To initialize, call the initialize method on IgniteConnectionManager

```java
IgniteCacheFactory factory = IgniteConnectionManager.initialize(systemConfig, cacheInfos);
```

When the factory has been initialized, you can retrieve a cache by name
```java
IgniteCache<String, String> cache = igniteCacheFactory.getOrCreateCache(cacheInfo);
```

Key/value pairs can be stored and retrieved
```java
cache.put("station", "Terrapin");
cache.get("station");
```

`create` throws `java.lang.IllegalStateException`'s when create is called more than once.