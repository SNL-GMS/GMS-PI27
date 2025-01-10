package gms.shared.spring.utilities.framework;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class BaseControllerTest {

  @Test
  void testAliveJSON() {
    BaseController bc = new BaseController();
    AliveCheck response = bc.aliveJson();
    assertTrue(response.toString().contains("aliveAt"));
  }
}
