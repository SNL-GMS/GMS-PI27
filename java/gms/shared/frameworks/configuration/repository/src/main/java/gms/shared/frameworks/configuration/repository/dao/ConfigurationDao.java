package gms.shared.frameworks.configuration.repository.dao;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.NamedSubgraph;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "configuration")
@NamedEntityGraph(
    name = "configuration.getConfiguration",
    attributeNodes = {
      @NamedAttributeNode(value = "configurationOptionDaos", subgraph = "constraint.subgraph")
    },
    subgraphs = {
      @NamedSubgraph(
          name = "constraint.subgraph",
          type = ConstraintDao.class,
          attributeNodes = @NamedAttributeNode(value = "constraintDaos")),
    })
public class ConfigurationDao {

  public static final String ENTITY_GRAPH_NAME = "configuration.getConfiguration";

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "configuration_sequence")
  @SequenceGenerator(
      name = "configuration_sequence",
      sequenceName = "configuration_sequence",
      allocationSize = 1)
  private int id;

  @Column(name = "name", nullable = false)
  private String name;

  @OneToMany(
      mappedBy = "configurationDao",
      fetch = FetchType.LAZY,
      cascade = CascadeType.ALL,
      orphanRemoval = true)
  private Set<ConfigurationOptionDao> configurationOptionDaos;

  public ConfigurationDao() {
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

  public Set<ConfigurationOptionDao> getConfigurationOptionDaos() {
    return this.configurationOptionDaos;
  }

  public void setConfigurationOptionDaos(Set<ConfigurationOptionDao> configurationOptionDaos) {
    this.configurationOptionDaos = configurationOptionDaos;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || this.getClass() != o.getClass()) {
      return false;
    }
    ConfigurationDao that = (ConfigurationDao) o;
    return this.name.equals(that.name);
  }

  @Override
  public int hashCode() {
    return Objects.hash(this.name);
  }
}
