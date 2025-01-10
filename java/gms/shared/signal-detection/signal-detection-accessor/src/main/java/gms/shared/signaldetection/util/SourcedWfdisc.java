package gms.shared.signaldetection.util;

import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.util.Optional;

/**
 * A structure representing a resolved {@link WfdiscDao} and, if applicable, the associated {@link
 * WfTagDao} used to resolve it.
 */
@AutoValue
public abstract class SourcedWfdisc {

  public abstract WfdiscDao getWfdiscDao();

  public abstract Optional<WfTagDao> getAssociatedWfTagDao();

  public static SourcedWfdisc create(WfdiscDao wfdiscDao, WfTagDao wfTagDao) {
    return new AutoValue_SourcedWfdisc(wfdiscDao, Optional.of(wfTagDao));
  }

  public static SourcedWfdisc create(WfdiscDao wfdiscDao) {
    return new AutoValue_SourcedWfdisc(wfdiscDao, Optional.empty());
  }
}
