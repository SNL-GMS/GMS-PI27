package gms.shared.spring.utilities.framework;

import com.fasterxml.jackson.databind.json.JsonMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

public class SpringTestBase {

  @Autowired protected MockMvc mockMvc;

  protected JsonMapper jsonMapper = ObjectMappers.jsonMapper();

  protected MockHttpServletResponse getResult(String url, HttpStatus expectedStatus)
      throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.get(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.APPLICATION_JSON);

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus.value(), response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResult(
      String url, Object postRequest, HttpStatus expectedStatus) throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsBytes(postRequest));

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus.value(), response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResult(String url, Object postRequest, int expectedStatus)
      throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsBytes(postRequest));

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus, response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResult(String url, Object postRequest) throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsBytes(postRequest));

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();

    return result.getResponse();
  }

  protected MockHttpServletResponse postResult(
      String url, Object postRequest, HttpStatus expectedStatus, MockMvc altMockMvc)
      throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsBytes(postRequest));

    MvcResult result = altMockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus.value(), response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResultTextPlain(
      String url, Object postRequest, HttpStatus expectedStatus) throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url)
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.TEXT_PLAIN)
            .content(jsonMapper.writeValueAsBytes(postRequest));

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus.value(), response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResultNoBody(String url, HttpStatus expectedStatus)
      throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url).accept(MediaType.APPLICATION_JSON);

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();
    MockHttpServletResponse response = result.getResponse();

    Assertions.assertEquals(expectedStatus.value(), response.getStatus());
    return response;
  }

  protected MockHttpServletResponse postResultNoBody(String url) throws Exception {

    RequestBuilder requestBuilder =
        MockMvcRequestBuilders.post(url).accept(MediaType.APPLICATION_JSON);

    MvcResult result = mockMvc.perform(requestBuilder).andReturn();

    return result.getResponse();
  }
}
