package gms.shared.stationdefinition.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "wftag")
public class WfTagDao {

  private WfTagKey wfTagKey;
  private Instant loadDate;

  public WfTagDao() {
    // JPA Constructor
  }

  /**
   * Return a deep copy of the given {@link WfTagDao}
   *
   * @param wfTagDao WfTagDao to copy
   */
  public WfTagDao(WfTagDao wfTagDao) {

    Objects.requireNonNull(wfTagDao);
    Objects.requireNonNull(wfTagDao.getWfTagKey());

    this.loadDate = wfTagDao.loadDate;
    this.wfTagKey = new WfTagKey();
    var oldKey = wfTagDao.getWfTagKey();
    this.wfTagKey.setId(oldKey.getId());
    this.wfTagKey.setTagName(oldKey.getTagName());
    this.wfTagKey.setWfId(oldKey.getWfId());
  }

  @EmbeddedId
  public WfTagKey getWfTagKey() {
    return wfTagKey;
  }

  public void setWfTagKey(WfTagKey wfTagKey) {
    this.wfTagKey = wfTagKey;
  }

  @Column(name = "lddate", nullable = false)
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }
}
