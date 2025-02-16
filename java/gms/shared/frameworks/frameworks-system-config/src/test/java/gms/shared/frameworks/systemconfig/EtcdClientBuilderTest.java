package gms.shared.frameworks.systemconfig;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class EtcdClientBuilderTest {

  @Test
  void testConstructionSetsDelegateValues() {
    var endpoints = "http://testEndpoint";
    var user = "testUser";
    var pw = "testPW";
    var clientBuilder = new EtcdClientBuilder(endpoints, user, pw);

    assertThat(clientBuilder)
        .isNotNull()
        .returns(
            user, builder -> builder.clientBuilder().user().toString(StandardCharsets.US_ASCII))
        .returns(
            pw, builder -> builder.clientBuilder().password().toString(StandardCharsets.US_ASCII))
        .returns("ip:///testEndpoint", builder -> builder.clientBuilder().target());
  }
}
