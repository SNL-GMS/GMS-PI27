package gms.shared.spring.utilities.webmvc;

import static org.assertj.core.api.Assertions.assertThat;

import org.assertj.core.api.Condition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;

class GmsHttpMessageConvertersConfigurationTest {

  private static final Condition<HttpMessageConverter<?>> canReadJson =
      new Condition<>(
          converter -> converter.canRead(String.class, MediaType.APPLICATION_JSON),
          "can read application/json");
  private static final Condition<HttpMessageConverter<?>> canReadMessagePack =
      new Condition<>(
          converter -> converter.canRead(String.class, new MediaType("application", "msgpack")),
          "can read application/msgpack");

  private GmsHttpMessageConvertersConfiguration configuration;

  @BeforeEach
  void init() {
    this.configuration = new GmsHttpMessageConvertersConfiguration();
  }

  @Test
  void testJsonMessageConverter() {
    assertThat(configuration.jsonMessageConverter()).satisfies(canReadJson);
  }

  @Test
  void testMessagePackMessageConverter() {
    assertThat(configuration.messagePackMessageConverter()).satisfies(canReadMessagePack);
  }
}
