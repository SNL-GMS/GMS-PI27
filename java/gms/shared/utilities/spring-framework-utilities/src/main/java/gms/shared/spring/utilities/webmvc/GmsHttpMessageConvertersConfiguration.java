package gms.shared.spring.utilities.webmvc;

import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration(proxyBeanMethods = false)
public class GmsHttpMessageConvertersConfiguration {

  @Bean
  public MappingJackson2HttpMessageConverter jsonMessageConverter() {
    return new MappingJackson2HttpMessageConverter(ObjectMappers.jsonMapper());
  }

  @Bean
  public MessagePackMessageConverter messagePackMessageConverter() {
    return new MessagePackMessageConverter(ObjectMappers.messagePackMapper());
  }
}
