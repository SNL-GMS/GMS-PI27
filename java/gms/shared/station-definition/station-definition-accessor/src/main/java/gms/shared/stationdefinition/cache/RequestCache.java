package gms.shared.stationdefinition.cache;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.REQUEST_CACHE;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.stationdefinition.api.util.Request;
import java.util.Collection;
import java.util.List;
import org.apache.ignite.IgniteCache;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** RequestCache for caching station definition requests as the first layer of caching */
@Profile("!disable-caching")
@Component("stationDefinitionRequestCache")
public class RequestCache {

  private final IgniteCache<Request, Collection<Object>> cache;

  public RequestCache() {
    this.cache = IgniteConnectionManager.getOrCreateCache(REQUEST_CACHE);
  }

  public Collection<Object> retrieve(Request request) {
    return cache.containsKey(request) ? cache.get(request) : List.of();
  }

  public void put(Request key, Collection<Object> value) {
    cache.put(key, value);
  }
}
