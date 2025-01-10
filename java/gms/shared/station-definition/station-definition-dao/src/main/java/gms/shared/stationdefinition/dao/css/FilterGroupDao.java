package gms.shared.stationdefinition.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

/** The FilterGroup table DAO object */
@Entity
@Table(name = "filter_group")
public class FilterGroupDao {

  private FilterGroupKey filterGroupKey;
  private Instant ldDate;
  private char childFunction;

  public FilterGroupDao() {
    // JPA constructor
  }

  @EmbeddedId
  public FilterGroupKey getFilterGroupKey() {
    return filterGroupKey;
  }

  public void setFilterGroupKey(FilterGroupKey filterGroupKey) {
    this.filterGroupKey = filterGroupKey;
  }

  @Column(name = "lddate")
  public Instant getLdDate() {
    return ldDate;
  }

  public void setLdDate(Instant ldDate) {
    this.ldDate = ldDate;
  }

  @Column(name = "child_function")
  public char getChildFunction() {
    return childFunction;
  }

  public void setChildFunction(char childFunction) {
    this.childFunction = childFunction;
  }

  private FilterGroupDao(Builder builder) {
    this.filterGroupKey = builder.filterGroupKey;
    this.ldDate = builder.ldDate;
    this.childFunction = builder.childFunction;
  }

  public Builder toBuilder() {
    return new Builder()
        .setFilterGroupKey(this.filterGroupKey)
        .setLdDate(this.ldDate)
        .setChildFunction(this.childFunction);
  }

  public static class Builder {

    private FilterGroupKey filterGroupKey;
    private Instant ldDate;
    private char childFunction;

    public Builder setFilterGroupKey(FilterGroupKey filterGroupKey) {
      this.filterGroupKey = filterGroupKey;
      return this;
    }

    public Builder setLdDate(Instant ldDate) {
      this.ldDate = ldDate;
      return this;
    }

    public Builder setChildFunction(char childFunction) {
      this.childFunction = childFunction;
      return this;
    }

    public FilterGroupDao build() {
      return new FilterGroupDao(this);
    }
  }

  @Override
  public int hashCode() {
    var hash = 5;
    hash = 43 * hash + Objects.hashCode(this.filterGroupKey);
    hash = 43 * hash + Objects.hashCode(this.ldDate);
    hash = 43 * hash + this.childFunction;
    return hash;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (getClass() != obj.getClass()) {
      return false;
    }
    final FilterGroupDao other = (FilterGroupDao) obj;
    if (this.childFunction != other.childFunction) {
      return false;
    }
    if (!Objects.equals(this.filterGroupKey, other.filterGroupKey)) {
      return false;
    }
    return Objects.equals(this.ldDate, other.ldDate);
  }
}
