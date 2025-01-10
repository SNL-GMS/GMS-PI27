package gms.shared.spring.utilities.webmvc;

import org.msgpack.jackson.dataformat.MessagePackMapper;
import org.springframework.http.converter.json.AbstractJackson2HttpMessageConverter;

public class MessagePackMessageConverter extends AbstractJackson2HttpMessageConverter {

  public MessagePackMessageConverter(MessagePackMapper objectMapper) {
    super(objectMapper, GmsMediaType.APPLICATION_MSGPACK);
  }
}
