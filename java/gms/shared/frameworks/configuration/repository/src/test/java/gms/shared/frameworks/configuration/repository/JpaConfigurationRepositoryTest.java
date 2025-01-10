package gms.shared.frameworks.configuration.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.Configuration;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.Operator;
import gms.shared.frameworks.configuration.Operator.Type;
import gms.shared.frameworks.configuration.constraints.BooleanConstraint;
import gms.shared.frameworks.configuration.constraints.DefaultConstraint;
import gms.shared.frameworks.configuration.constraints.DoubleRange;
import gms.shared.frameworks.configuration.constraints.NumericRangeConstraint;
import gms.shared.frameworks.configuration.constraints.NumericScalarConstraint;
import gms.shared.frameworks.configuration.constraints.PhaseConstraint;
import gms.shared.frameworks.configuration.constraints.StringConstraint;
import gms.shared.frameworks.configuration.constraints.TimeOfDayRange;
import gms.shared.frameworks.configuration.constraints.TimeOfDayRangeConstraint;
import gms.shared.frameworks.configuration.constraints.TimeOfYearRange;
import gms.shared.frameworks.configuration.constraints.TimeOfYearRangeConstraint;
import gms.shared.frameworks.configuration.constraints.WildcardConstraint;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JpaConfigurationRepositoryTest extends H2Test {

  private static final String CONFIG_1_NAME = "test-config";
  private static final String CONFIG_2_NAME = "test-config2";

  private static final Configuration configuration1;
  private static final Configuration configuration2;

  static {
    Collection<ConfigurationOption> configurationOptions = new ArrayList<>();
    List<Constraint> constraints = new ArrayList<>();
    Operator operatorIn = Operator.from(Type.IN, false);
    Operator operatorEq = Operator.from(Type.EQ, false);

    constraints.add(BooleanConstraint.from("test1", true, 1));
    constraints.add(DefaultConstraint.from());
    constraints.add(NumericRangeConstraint.from("test2", operatorIn, DoubleRange.from(0, 1), 1));
    constraints.add(NumericScalarConstraint.from("test3", operatorEq, 0, 1));
    constraints.add(PhaseConstraint.from("test4", operatorEq, Set.of(PhaseType.P), 1));
    constraints.add(StringConstraint.from("test5", operatorEq, Set.of("TEST"), 1));
    constraints.add(
        TimeOfDayRangeConstraint.from(
            "test6", operatorIn, TimeOfDayRange.from(LocalTime.now(), LocalTime.now()), 1));
    constraints.add(
        TimeOfYearRangeConstraint.from(
            "test7",
            operatorIn,
            TimeOfYearRange.from(LocalDateTime.now(), LocalDateTime.now()),
            1));
    constraints.add(WildcardConstraint.from("test8"));

    Map<String, Object> parameters = new LinkedHashMap<>();
    parameters.put("some-string", "some-value");
    ConfigurationOption co =
        ConfigurationOption.from("config-option-test", constraints, parameters);
    configurationOptions.add(co);

    configuration1 = Configuration.from(CONFIG_1_NAME, configurationOptions);
    configuration2 = Configuration.from(CONFIG_2_NAME, configurationOptions);
  }

  private JpaConfigurationRepository repository;

  @Override
  protected Stream<URL> sqlScripts() {
    return Stream.of(getResource("sql/processing-config-schema.sql"));
  }

  @Override
  protected String getUser() {
    return "gms_config";
  }

  @Override
  protected Stream<String> extraOptions() {
    return Stream.of(
        "MODE=PostgreSQL",
        "DATABASE_TO_LOWER=TRUE",
        "DEFAULT_NULL_ORDERING=HIGH",
        "NON_KEYWORDS=VALUE");
  }

  @Override
  protected String getPersistenceUnitName() {
    return "processing-cfg";
  }

  @BeforeEach
  void setUp() {
    repository = new JpaConfigurationRepository();
    repository.setEntityManagerFactory(entityManagerFactory);
  }

  @Test
  void testGetEmptyCheck() {
    repository.put(configuration1);
    Optional<Configuration> cfg = repository.get("not-there");
    assertFalse(cfg.isPresent());
  }

  @Test
  void testPutAndGet() {
    repository.put(configuration1);
    Optional<Configuration> cfg = repository.get(CONFIG_1_NAME);

    assertTrue(
        cfg.get().getName().equalsIgnoreCase(CONFIG_1_NAME),
        "Cfg name doesn't match expected value");
    cfg.get()
        .getConfigurationOptions()
        .forEach(
            cfgOption -> {
              assertEquals(
                  "config-option-test",
                  cfgOption.getName(),
                  "CfgOption name doesn't match expected value");
              assertEquals(
                  "some-value",
                  cfgOption.getParameters().get("some-string"),
                  "CfgOption paremeters don't match expected value");
              assertEquals(
                  9, cfgOption.getConstraints().size(), "CfgOption options not correct size");
            });
  }

  @Test
  void testPutAllAndGetRange() {
    Collection<Configuration> configurations = new ArrayList<>();
    configurations.add(configuration1);
    configurations.add(configuration2);
    repository.putAll(configurations);
    Collection<Configuration> cfgs = repository.getKeyRange("test");

    assertEquals(2, cfgs.size(), "There should be 2 configurations returned by getKeyRange");
    cfgs.forEach(
        cfg -> {
          assertTrue(cfg.getName().startsWith("test"), "Cfg name doesn't match expected value");

          cfg.getConfigurationOptions()
              .forEach(
                  cfgOption -> {
                    assertEquals(
                        "config-option-test",
                        cfgOption.getName(),
                        "CfgOption name doesn't match expected value");
                    assertEquals(
                        "some-value",
                        cfgOption.getParameters().get("some-string"),
                        "CfgOption paremeters don't match expected value");
                    assertEquals(
                        9, cfgOption.getConstraints().size(), "CfgOption options not correct size");
                  });
        });
  }
}
