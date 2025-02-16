package gms.shared.frameworks.configuration.repository.dao.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.repository.dao.ConfigurationDao;
import gms.shared.frameworks.configuration.repository.dao.ConfigurationOptionDao;
import gms.shared.frameworks.utilities.jpa.EntityConverter;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;

public class ConfigurationOptionDaoConverter
    implements EntityConverter<ConfigurationOptionDao, ConfigurationOption> {

  private ConfigurationDao configurationDao;

  public ConfigurationOptionDaoConverter(ConfigurationDao cd) {
    this.configurationDao = cd;
  }

  @Override
  public ConfigurationOptionDao fromCoi(ConfigurationOption configurationOption) {
    Objects.requireNonNull(configurationOption);

    var cod = new ConfigurationOptionDao();

    cod.setName(configurationOption.getName());
    cod.setParameters(ObjectMappers.jsonMapper().valueToTree(configurationOption.getParameters()));
    cod.setConstraintDaos(new LinkedHashSet<>());
    cod.setConfigurationDao(this.configurationDao);
    var cdConverter = new ConstraintDaoConverter(cod);
    configurationOption
        .getConstraints()
        .forEach(constraint -> cod.getConstraintDaos().add(cdConverter.fromCoi(constraint)));

    return cod;
  }

  @Override
  public ConfigurationOption toCoi(ConfigurationOptionDao configurationOptionDao) {
    Objects.requireNonNull(configurationOptionDao);
    Map<String, Object> parameters =
        ObjectMappers.jsonMapper()
            .convertValue(
                configurationOptionDao.getParameters(),
                new TypeReference<Map<String, Object>>() {});

    return ConfigurationOption.from(
        configurationOptionDao.getName(),
        configurationOptionDao.getConstraintDaos().stream()
            .map(constraint -> new ConstraintDaoConverter(configurationOptionDao).toCoi(constraint))
            .toList(),
        parameters);
  }
}
