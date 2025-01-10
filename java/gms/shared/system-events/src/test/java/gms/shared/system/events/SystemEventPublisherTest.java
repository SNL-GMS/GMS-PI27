package gms.shared.system.events;

import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.util.List;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SystemEventPublisherTest {

  @Mock KafkaProducer<String, String> mockKafkaProducer;

  SystemEventPublisher systemEventPublisher;

  @BeforeEach
  void setUp() {
    systemEventPublisher = new SystemEventPublisher(mockKafkaProducer);
  }

  @Test
  void testCreateAndSendSystemEvents() throws JsonProcessingException {

    var fakeSystemMessagePayload = "fake message";

    var systemEvent = SystemEvent.from("intervals", fakeSystemMessagePayload, 0);

    systemEventPublisher.sendSystemEvent(List.of(systemEvent));

    var message = ObjectMappers.jsonMapper().writeValueAsString(systemEvent);
    var producerRecord =
        new ProducerRecord<String, String>(SystemEventPublisher.SYSTEM_EVENT_TOPIC, message);

    verify(mockKafkaProducer).send(producerRecord);
  }
}
