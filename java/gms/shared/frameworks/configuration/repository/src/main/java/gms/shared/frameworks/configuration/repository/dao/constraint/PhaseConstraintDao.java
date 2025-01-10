package gms.shared.frameworks.configuration.repository.dao.constraint;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.constraints.PhaseConstraint;
import gms.shared.frameworks.configuration.repository.dao.ConstraintDao;
import gms.shared.frameworks.configuration.repository.dao.converter.OperatorDaoConverter;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

@Entity
@DiscriminatorValue("phase_constraint")
public class PhaseConstraintDao extends ConstraintDao {

  @Enumerated
  @ElementCollection
  @CollectionTable(
      name = "phase_constraint_value",
      joinColumns = @JoinColumn(name = "constraint_id"))
  @LazyCollection(LazyCollectionOption.FALSE)
  private Set<PhaseType> value = new HashSet<>();

  @Override
  public Set<PhaseType> getValue() {
    return this.value;
  }

  @Override
  @SuppressWarnings("unchecked")
  public void setValue(Object value) {
    if (!(value instanceof Set)) {
      throw new IllegalArgumentException(
          "Object passed to PhaseConstraintDao::setValue is not a Set");
    }
    this.value = (Set<PhaseType>) value;
  }

  @Override
  public Constraint createConstraint() {

    return PhaseConstraint.from(
        this.getCriterion(),
        new OperatorDaoConverter().toCoi(this.getOperatorDao()),
        this.getValue(),
        this.getPriority());
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    if (!super.equals(o)) {
      return false;
    }
    PhaseConstraintDao that = (PhaseConstraintDao) o;
    return Objects.equals(value, that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), value);
  }
}
