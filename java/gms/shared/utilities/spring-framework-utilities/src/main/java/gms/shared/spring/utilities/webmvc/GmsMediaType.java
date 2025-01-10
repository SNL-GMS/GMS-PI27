package gms.shared.spring.utilities.webmvc;

import org.springframework.http.MediaType;

/**
 * Collection of GMS-specific {@link MediaType} constants not defined by default in third-party
 * libraries
 */
public final class GmsMediaType {

  public static final String APPLICATION_MSGPACK_VALUE = "application/msgpack";
  public static final MediaType APPLICATION_MSGPACK;

  static {
    APPLICATION_MSGPACK = new MediaType("application", "msgpack");
  }

  private GmsMediaType() {}
}
