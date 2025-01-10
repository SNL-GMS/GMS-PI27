package gms.shared.stationdefinition.dao.util;

import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.dao.css.FilterDao;
import gms.shared.stationdefinition.dao.css.FilterGroupDao;
import java.util.List;
import java.util.Optional;

/**
 * FilterDataNode represents a "node" on the conceptual "tree" that represents a filter record and
 * its possible cascading filter records. Specifically this class allows the tracking of a {@link
 * FilterDao} and its corresponding {@link FilterGroupDao}s and child {@link FilterDao}s.
 */
@AutoValue
public abstract class FilterDataNode {

  public abstract FilterDao getFilterRecord();

  public abstract Optional<FilterGroupDao> getFilterGroup();

  public abstract Optional<List<FilterDataNode>> getChildFilters();

  public static Builder builder() {
    return new AutoValue_FilterDataNode.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  public interface Builder {
    Builder setFilterRecord(FilterDao filterRecord);

    Builder setFilterGroup(FilterGroupDao filterGroup);

    Builder setFilterGroup(Optional<FilterGroupDao> filterGroup);

    Builder setChildFilters(List<FilterDataNode> childFilters);

    Builder setChildFilters(Optional<List<FilterDataNode>> childFilters);

    FilterDataNode autoBuild();

    default FilterDataNode build() {
      return autoBuild();
    }
  }
}
