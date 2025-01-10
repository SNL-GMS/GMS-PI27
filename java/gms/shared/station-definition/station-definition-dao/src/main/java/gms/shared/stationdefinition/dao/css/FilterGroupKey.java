package gms.shared.stationdefinition.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.io.Serializable;
import java.util.Objects;

/** The FilterGroup composite key */
@Embeddable
public class FilterGroupKey implements Serializable {

  private long parentFilterId;
  private FilterDao childFilterDao;
  private long childSequence;

  public FilterGroupKey() {
    // JPA constructor
  }

  @Column(name = "parent_filterid")
  public long getParentFilterId() {
    return parentFilterId;
  }

  public void setParentFilterId(long parentFilterId) {
    this.parentFilterId = parentFilterId;
  }

  @OneToOne(optional = true)
  @JoinColumn(name = "child_filterid")
  public FilterDao getChildFilterDao() {
    return childFilterDao;
  }

  public void setChildFilterDao(FilterDao childFilterDao) {
    this.childFilterDao = childFilterDao;
  }

  @Column(name = "child_sequence")
  public long getChildSequence() {
    return childSequence;
  }

  public void setChildSequence(long childSequence) {
    this.childSequence = childSequence;
  }

  private FilterGroupKey(Builder builder) {
    this.parentFilterId = builder.parentFilterId;
    this.childFilterDao = builder.childFilterDao;
    this.childSequence = builder.childSequence;
  }

  public Builder toBuilder() {
    return new Builder()
        .setParentFilterId(this.parentFilterId)
        .setChildFilterDao(this.childFilterDao)
        .setChildSequence(this.childSequence);
  }

  public static class Builder {

    private long parentFilterId;
    private FilterDao childFilterDao;
    private long childSequence;

    public Builder setParentFilterId(long parentFilterId) {
      this.parentFilterId = parentFilterId;
      return this;
    }

    public Builder setChildFilterDao(FilterDao childFilterDao) {
      this.childFilterDao = childFilterDao;
      return this;
    }

    public Builder setChildSequence(long childSequence) {
      this.childSequence = childSequence;
      return this;
    }

    public FilterGroupKey build() {
      return new FilterGroupKey(this);
    }
  }

  @Override
  public int hashCode() {
    var hash = 7;
    hash = 89 * hash + (int) (this.parentFilterId ^ (this.parentFilterId >>> 32));
    hash = 89 * hash + Objects.hashCode(this.childFilterDao);
    hash = 89 * hash + (int) (this.childSequence ^ (this.childSequence >>> 32));
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
    final FilterGroupKey other = (FilterGroupKey) obj;
    if (this.parentFilterId != other.parentFilterId) {
      return false;
    }
    if (this.childFilterDao != other.childFilterDao) {
      return false;
    }
    return this.childSequence == other.childSequence;
  }
}
