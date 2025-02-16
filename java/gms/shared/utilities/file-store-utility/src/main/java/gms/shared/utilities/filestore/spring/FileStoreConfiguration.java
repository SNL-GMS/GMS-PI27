package gms.shared.utilities.filestore.spring;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.filestore.FileStore;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import io.minio.MinioClient;
import io.minio.errors.MinioException;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Configuration
public class FileStoreConfiguration {

  private static final Logger LOGGER = LoggerFactory.getLogger(FileStoreConfiguration.class);

  private final long configLoaderStatusCheckRetryIntervalMillis;
  private final String minioUrl;
  private final String configLoaderUrl;

  @Autowired
  public FileStoreConfiguration(SystemConfig systemConfig) {
    configLoaderStatusCheckRetryIntervalMillis =
        systemConfig.getValueAsLong("file-store.configLoaderStatusCheckRetryIntervalMillis");
    minioUrl = systemConfig.getValue("minio-url");
    configLoaderUrl =
        String.format(
            "http://%s:%d%s",
            systemConfig.getValue("config-loader.host"),
            systemConfig.getValueAsLong("config-loader.port"),
            systemConfig.getValue("config-loader.statusEndpoint"));
  }

  @Autowired
  @Bean
  public FileStore fileStore(
      @Value("${MINIO_ROOT_USER}") String minioUser,
      @Value("${MINIO_ROOT_PASSWORD}") String minioPass) {

    var minioClient =
        MinioClient.builder().endpoint(minioUrl).credentials(minioUser, minioPass).build();

    awaitConnectionToMinIo(minioClient);
    awaitMinIoLoaded();

    return new FileStore(minioClient);
  }

  private void awaitConnectionToMinIo(MinioClient minioClient) {
    var connectedToMinio = false;
    while (!connectedToMinio) {
      try {
        // listBuckets will execute successfully once the client can connect to MinIO
        LOGGER.info("Attempting to connect to MinIO...");
        minioClient.listBuckets();
        LOGGER.info("Connected to MinIO!");
        connectedToMinio = true;
      } catch (MinioException e) {
        // Can't connect yet, log and retry
        LOGGER.info("Unable to connect to MinIO caused by [{}], retrying...", e.getClass(), e);
        try {
          Thread.sleep(configLoaderStatusCheckRetryIntervalMillis);
        } catch (InterruptedException ex) {
          Thread.currentThread().interrupt();
        }
      } catch (IOException | InvalidKeyException | NoSuchAlgorithmException e) {
        // Fail on errors not caused by connection issues
        throw new IllegalStateException("Could not connect to MinIO", e);
      }
    }
  }

  private void awaitMinIoLoaded() {
    var minioLoaded = false;
    LOGGER.info("Waiting for MinIO to be loaded...");
    while (!minioLoaded) {
      try {
        var statusJson =
            WebClient.builder()
                .build()
                .get()
                .uri(configLoaderUrl)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        var status = ObjectMappers.jsonMapper().readValue(statusJson, String.class);
        if ("loaded".equals(status)) {
          minioLoaded = true;
          LOGGER.info("MinIO is loaded!");
        } else {
          LOGGER.info("MinIO not yet loaded, status is [{}]. Retrying...", status);
          Thread.sleep(configLoaderStatusCheckRetryIntervalMillis);
        }
      } catch (WebClientResponseException.InternalServerError e) {
        LOGGER.info("MinIO not yet loaded caused by InternalServerError, retrying...");
        try {
          Thread.sleep(configLoaderStatusCheckRetryIntervalMillis);
        } catch (InterruptedException ex) {
          Thread.currentThread().interrupt();
        }
      } catch (InterruptedException ex) {
        Thread.currentThread().interrupt();
      } catch (JsonProcessingException e) {
        LOGGER.error("Could not deserialize response from config loader");
        throw new IllegalArgumentException(e);
      }
    }
  }
}
