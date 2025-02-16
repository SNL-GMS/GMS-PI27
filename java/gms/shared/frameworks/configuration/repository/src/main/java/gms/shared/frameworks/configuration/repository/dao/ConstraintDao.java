package gms.shared.frameworks.configuration.repository.dao;

import gms.shared.frameworks.configuration.Constraint;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.util.Objects;

@Entity
@Table(name = "configuration_constraint")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "constraint_type")
public abstract class ConstraintDao {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "constraint_sequence")
  @SequenceGenerator(
      name = "constraint_sequence",
      sequenceName = "constraint_sequence",
      allocationSize = 1)
  private int id;

  @Column(name = "criterion", nullable = false)
  private String criterion;

  @Column(name = "priority", nullable = false)
  private long priority;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "configuration_option_id", nullable = false, updatable = false)
  private ConfigurationOptionDao configurationOptionDao;

  @Embedded private OperatorDao operatorDao;

  protected ConstraintDao() {
    // Empty constructor needed for JPA
  }

  public int getId() {
    return this.id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public String getCriterion() {
    return this.criterion;
  }

  public void setCriterion(String criterion) {
    this.criterion = criterion;
  }

  public long getPriority() {
    return this.priority;
  }

  public void setPriority(long priority) {
    this.priority = priority;
  }

  public OperatorDao getOperatorDao() {
    return this.operatorDao;
  }

  public void setOperatorDao(OperatorDao operatorDao) {
    this.operatorDao = operatorDao;
  }

  public ConfigurationOptionDao getConfigurationOptionDao() {
    return this.configurationOptionDao;
  }

  public void setConfigurationOptionDao(ConfigurationOptionDao configurationOptionDao) {
    this.configurationOptionDao = configurationOptionDao;
  }

  public abstract Object getValue();

  // There are several constraints (ex: Default, Wildcard) that have a constant as the value.
  // Therefore, setValue should not be called on them.  UnsupportedOperationExeption doesn't make
  // sense since setValue can be called on a List of Constraints, which could include Default,
  // Wildcard Constraints.
  public void setValue(Object value) {}

  public abstract Constraint createConstraint();

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || this.getClass() != o.getClass()) {
      return false;
    }
    ConstraintDao that = (ConstraintDao) o;
    return this.priority == that.priority
        && Objects.equals(this.criterion, that.criterion)
        && this.configurationOptionDao.equals(that.configurationOptionDao)
        && Objects.equals(this.operatorDao, that.operatorDao);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        this.criterion, this.priority, this.configurationOptionDao, this.operatorDao);
  }
}
