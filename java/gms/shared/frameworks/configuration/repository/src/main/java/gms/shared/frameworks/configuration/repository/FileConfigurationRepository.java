package gms.shared.frameworks.configuration.repository;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import gms.shared.frameworks.configuration.Configuration;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.osd.coi.FieldMapUtilities;
import gms.shared.frameworks.utilities.Validation;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implements {@link ConfigurationRepository} by constructing {@link Configuration} from {@link
 * ConfigurationOption} files stored in files.
 *
 * <p>Assumes the following structure: 1. All data is rooted in a single configuration root
 * directory. This directory is provided to {@link FileConfigurationRepository#create(Path)}
 *
 * <p>2. The configuration root directory has a collection of subdirectories but no files. Each
 * subdirectory corresponds to a Configuration; the subdirectory name becomes the Configuration's
 * name.
 *
 * <p>3. Each subdirectory contains .yaml files but no nested subdirectories. Each .yaml file
 * contains a single serialized ConfigurationOption.
 *
 * <p>Only implements the {@link ConfigurationRepository#getKeyRange(String)} operation.
 */
public final class FileConfigurationRepository implements ConfigurationRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(FileConfigurationRepository.class);

  private final Map<String, Configuration> configurationByName;

  private FileConfigurationRepository(Map<String, Configuration> configurationByName) {
    this.configurationByName = configurationByName;
  }

  /**
   * Obtain a {@link FileConfigurationRepository} with the provided configurationRoot directory.
   *
   * @param configurationRoot {@link Path} configuration root directory, not null
   * @return {@link FileConfigurationRepository}, not null
   * @throws NullPointerException if configurationRoot is null
   */
  public static FileConfigurationRepository create(Path configurationRoot) {
    Objects.requireNonNull(configurationRoot, "configurationRoot can't be null");

    var configurations =
        FileConfigurationRepository.loadConfigurations(configurationRoot).stream()
            .sorted(Comparator.comparing(Configuration::getName))
            .toList();

    final var cleansedString = Validation.cleanseInputString(configurationRoot.toString());
    LOGGER.info("Configurations for {}: {}", cleansedString, configurations.size());
    configurations.forEach(
        configuration -> LOGGER.info("Config {}: {}", configuration.getName(), configuration));

    return new FileConfigurationRepository(
        configurations.stream()
            .collect(
                Collectors.toMap(
                    Configuration::getName, Function.identity(), (oldVal, newVal) -> oldVal)));
  }

  @Override
  public Optional<Configuration> get(String key) {
    return Optional.of(this.configurationByName.get(key));
  }

  @Override
  public Collection<Configuration> getKeyRange(String keyPrefix) {
    return this.configurationByName.entrySet().stream()
        .filter(e -> e.getKey().startsWith(keyPrefix))
        .map(Entry::getValue)
        .toList();
  }

  @Override
  public Optional<Configuration> put(Configuration configuration) {
    throw new UnsupportedOperationException();
  }

  @Override
  public Collection<Configuration> putAll(Collection<Configuration> configurations) {
    throw new UnsupportedOperationException();
  }

  /**
   * Loads {@link Configuration}s from a base directory. Constructs a Configuration for each
   * subdirectory in the baseDirectory.
   *
   * @param baseDirectory base directory containing the configurations
   * @return List of {@link Configuration} loaded from the baseDirectory
   */
  @SuppressWarnings("unchecked")
  private static List<Configuration> loadConfigurations(Path baseDirectory) {
    // Wrap the DirectoryOperations in a LoggingDirectoryOperations which logs the directories
    // and files that get processed.
    DirectoryOperations directoryOperations =
        new LoggingDirectoryOperations(new FilesystemDirectoryOperations());

    var objectMapper = ObjectMappers.jsonMapper();
    List<Configuration> configurations = new ArrayList<>();

    // subDirectories become Configurations
    Collection<String> subDirectories = directoryOperations.getSubDirectories(baseDirectory);

    // Files in each subdirectory are the ConfigurationOptions
    for (String subDir : subDirectories) {
      FileConfigurationRepository.LOGGER.info("Loading configuration from subdirectory {}", subDir);

      List<ConfigurationOption> configOptions = new ArrayList<>();
      for (String filename : directoryOperations.getFilesInDirectory(subDir)) {
        FileConfigurationRepository.LOGGER.info("Loading configuration from file {}", filename);
        try {
          resolveConfigurationFromFieldMaps(
              directoryOperations, objectMapper, configOptions, filename);
        } catch (IllegalArgumentException | IOException e) {
          FileConfigurationRepository.LOGGER.error("Could not load configuration from disk", e);
        }
      }

      String splitter = getSystemIndependentFileSeparator();

      String[] pathComponents = subDir.split(splitter);
      String configurationName = pathComponents[pathComponents.length - 1];
      configurations.add(Configuration.from(configurationName, configOptions));
    }

    FileConfigurationRepository.LOGGER.debug("configurations: {}", configurations);
    return configurations;
  }

  private static String getSystemIndependentFileSeparator() {
    String splitter;
    if (File.separatorChar == '\\') {
      splitter = "\\\\";
    } else {
      splitter = File.separator;
    }

    return splitter;
  }

  private static void resolveConfigurationFromFieldMaps(
      DirectoryOperations directoryOperations,
      ObjectMapper objectMapper,
      List<ConfigurationOption> configOptions,
      String filename)
      throws IOException {
    try {
      var typeFactory = objectMapper.getTypeFactory();
      JavaType fieldMapType =
          typeFactory.constructMapType(HashMap.class, String.class, Object.class);
      JavaType fieldMapList = typeFactory.constructCollectionType(List.class, fieldMapType);

      List<Map<String, Object>> fieldMaps =
          objectMapper.readValue(directoryOperations.getUrl(filename), fieldMapList);
      fieldMaps.stream()
          .map(fieldMap -> FieldMapUtilities.fromFieldMap(fieldMap, ConfigurationOption.class))
          .forEach(configOptions::add);
    } catch (MismatchedInputException e) {
      configOptions.add(
          FieldMapUtilities.fromFieldMap(
              objectMapper.readValue(directoryOperations.getUrl(filename), Map.class),
              ConfigurationOption.class));
    }
  }

  /** Defines the operations used when loading Configurations */
  private interface DirectoryOperations {

    Collection<String> getSubDirectories(Path configDirectory);

    Collection<String> getFilesInDirectory(String path);

    URL getUrl(String path);
  }

  /**
   * Implements {@link DirectoryOperations} by logging input parameters and operation results of
   * invoking a delegate {@link DirectoryOperations} implementation.
   */
  private static final class LoggingDirectoryOperations implements DirectoryOperations {

    private final DirectoryOperations delegate;

    private LoggingDirectoryOperations(DirectoryOperations delegate) {
      this.delegate = delegate;
    }

    @Override
    public Collection<String> getSubDirectories(Path configDirectory) {
      final var cleansedString = Validation.cleanseInputString(configDirectory.toString());
      FileConfigurationRepository.LOGGER.info("Finding subdirectories of {}", cleansedString);

      Collection<String> subdirectories = this.delegate.getSubDirectories(configDirectory);

      if (FileConfigurationRepository.LOGGER.isInfoEnabled()) {
        final var cleansedSubdirString =
            Validation.cleanseInputString(Arrays.toString(subdirectories.toArray()));
        FileConfigurationRepository.LOGGER.info("Found subdirectories {}", cleansedSubdirString);
      }

      return subdirectories;
    }

    @Override
    public Collection<String> getFilesInDirectory(String path) {
      FileConfigurationRepository.LOGGER.info("Loading files from directory {}", path);

      Collection<String> files = this.delegate.getFilesInDirectory(path);

      if (FileConfigurationRepository.LOGGER.isInfoEnabled()) {
        FileConfigurationRepository.LOGGER.info(
            "Found files to load {}", Arrays.toString(files.toArray()));
      }

      return files;
    }

    @Override
    public URL getUrl(String path) {
      FileConfigurationRepository.LOGGER.info("Getting URL for path {}", path);

      var url = this.delegate.getUrl(path);
      FileConfigurationRepository.LOGGER.info("URL is {} ", url);

      return url;
    }
  }

  /** Implements {@link DirectoryOperations} using filesystem operations */
  private static class FilesystemDirectoryOperations implements DirectoryOperations {

    @Override
    public Collection<String> getSubDirectories(Path configDirectory) {
      try (var subdirectories = Files.list(configDirectory)) {
        return subdirectories.filter(Files::isDirectory).map(Path::toString).toList();
      } catch (IOException e) {
        LOGGER.error("Error reading subdirectories: ", e);
        return Collections.emptyList();
      }
    }

    @Override
    public Collection<String> getFilesInDirectory(String path) {
      return Optional.ofNullable(new File(path).list())
          .map(listing -> Arrays.stream(listing).map(f -> path + File.separator + f).toList())
          .orElse(List.of());
    }

    @Override
    public URL getUrl(String path) {
      try {
        return new File(path).toURI().toURL();
      } catch (MalformedURLException e) {
        String message = "Could not create URL to file at path: " + path;
        throw new IllegalStateException(message, e);
      }
    }
  }
}
