package gms.shared.frameworks.configuration.repository.dao;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.util.Objects;
import java.util.Set;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "configuration_option")
public class ConfigurationOptionDao {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "configuration_option_sequence")
  @SequenceGenerator(
      name = "configuration_option_sequence",
      sequenceName = "configuration_option_sequence",
      allocationSize = 1)
  private int id;

  @Column(name = "name", nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "configuration_id", nullable = false, updatable = false)
  private ConfigurationDao configurationDao;

  @OneToMany(mappedBy = "configurationOptionDao", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  private Set<ConstraintDao> constraintDaos;

  @Type(JsonType.class)
  @Column(name = "parameters", columnDefinition = "jsonb")
  private JsonNode parameters;

  public ConfigurationOptionDao() {
    // Empty constructor needed for JPA
  }

  public int getId() {
    return this.id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public String getName() {
    return this.name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public ConfigurationDao getConfigurationDao() {
    return this.configurationDao;
  }

  public void setConfigurationDao(ConfigurationDao configurationDao) {
    this.configurationDao = configurationDao;
  }

  public Set<ConstraintDao> getConstraintDaos() {
    return this.constraintDaos;
  }

  public void setConstraintDaos(Set<ConstraintDao> constraintDaos) {
    this.constraintDaos = constraintDaos;
  }

  public JsonNode getParameters() {
    return this.parameters;
  }

  public void setParameters(JsonNode parameters) {
    this.parameters = parameters;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || this.getClass() != o.getClass()) {
      return false;
    }
    ConfigurationOptionDao that = (ConfigurationOptionDao) o;
    return this.name.equals(that.name)
        && this.configurationDao.equals(that.configurationDao)
        && Objects.equals(this.parameters, that.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(this.name, this.configurationDao, this.parameters);
  }
}
