package gms.shared.stationdefinition.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/** The Filter table DAO object */
@Entity
@Table(name = "Filter")
public class FilterDao implements Serializable {

  private long filterId;
  private char compoundFilter;
  private String filterMethod;
  private String filterString;
  private String filterHash;
  private Instant ldDate;

  public FilterDao() {
    // JPA Constructor
  }

  @Id
  @Column(name = "filterid")
  public long getFilterId() {
    return filterId;
  }

  public void setFilterId(long filterId) {
    this.filterId = filterId;
  }

  @Column(name = "compound_filter")
  public char getCompoundFilter() {
    return compoundFilter;
  }

  public void setCompoundFilter(char compoundFilter) {
    this.compoundFilter = compoundFilter;
  }

  @Column(name = "filter_method")
  public String getFilterMethod() {
    return filterMethod;
  }

  public void setFilterMethod(String filterMethod) {
    this.filterMethod = filterMethod;
  }

  @Column(name = "filter_string")
  public String getFilterString() {
    return filterString;
  }

  public void setFilterString(String filterString) {
    this.filterString = filterString;
  }

  @Column(name = "filter_hash")
  public String getFilterHash() {
    return filterHash;
  }

  public void setFilterHash(String filterHash) {
    this.filterHash = filterHash;
  }

  @Column(name = "lddate")
  public Instant getLdDate() {
    return ldDate;
  }

  public void setLdDate(Instant ldDate) {
    this.ldDate = ldDate;
  }

  private FilterDao(Builder builder) {
    this.filterId = builder.filterId;
    this.compoundFilter = builder.compoundFilter;
    this.filterMethod = builder.filterMethod;
    this.filterString = builder.filterString;
    this.filterHash = builder.filterHash;
    this.ldDate = builder.ldDate;
  }

  public Builder toBuilder() {
    return new Builder()
        .setFilterId(this.filterId)
        .setCompoundFilter(this.compoundFilter)
        .setFilterMethod(this.filterMethod)
        .setFilterString(this.filterString)
        .setFilterHash(this.filterHash)
        .setLdDate(this.ldDate);
  }

  public static class Builder {

    private long filterId;
    private char compoundFilter;
    private String filterMethod;
    private String filterString;
    private String filterHash;
    private Instant ldDate;

    public Builder setFilterId(long filterId) {
      this.filterId = filterId;
      return this;
    }

    public Builder setCompoundFilter(char compoundFilter) {
      this.compoundFilter = compoundFilter;
      return this;
    }

    public Builder setFilterMethod(String filterMethod) {
      this.filterMethod = filterMethod;
      return this;
    }

    public Builder setFilterString(String filterString) {
      this.filterString = filterString;
      return this;
    }

    public Builder setFilterHash(String filterHash) {
      this.filterHash = filterHash;
      return this;
    }

    public Builder setLdDate(Instant ldDate) {
      this.ldDate = ldDate;
      return this;
    }

    public FilterDao build() {
      return new FilterDao(this);
    }
  }

  @Override
  public int hashCode() {
    var hash = 5;
    hash = 73 * hash + (int) (this.filterId ^ (this.filterId >>> 32));
    hash = 73 * hash + this.compoundFilter;
    hash = 73 * hash + Objects.hashCode(this.filterMethod);
    hash = 73 * hash + Objects.hashCode(this.filterString);
    hash = 73 * hash + Objects.hashCode(this.filterHash);
    hash = 73 * hash + Objects.hashCode(this.ldDate);
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
    final FilterDao other = (FilterDao) obj;
    if (this.filterId != other.filterId) {
      return false;
    }
    if (this.compoundFilter != other.compoundFilter) {
      return false;
    }
    if (!Objects.equals(this.filterMethod, other.filterMethod)) {
      return false;
    }
    if (!Objects.equals(this.filterString, other.filterString)) {
      return false;
    }
    if (!Objects.equals(this.filterHash, other.filterHash)) {
      return false;
    }
    return Objects.equals(this.ldDate, other.ldDate);
  }
}
