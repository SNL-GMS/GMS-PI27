package gms.shared.frameworks.osd.dao.stationreference;

import static jakarta.persistence.CascadeType.ALL;

import gms.shared.frameworks.osd.coi.stationreference.ReferenceSite;
import gms.shared.frameworks.osd.dao.emerging.provenance.InformationSourceDao;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** Define a Data Access Object to allow read and write access to the relational database. */
@Entity
@Table(name = "reference_site")
public class ReferenceSiteDao {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reference_site_sequence")
  @SequenceGenerator(
      name = "reference_site_sequence",
      sequenceName = "reference_site_sequence",
      allocationSize = 5)
  private long id;

  @Column(name = "entity_id")
  private UUID entityId;

  @Column(name = "version_id", unique = true)
  private UUID versionId;

  @Column(name = "name")
  private String name;

  @Column(name = "description")
  private String description;

  @Column(name = "latitude")
  private double latitude;

  @Column(name = "longitude")
  private double longitude;

  @Column(name = "elevation")
  private double elevation;

  @Column(name = "comment")
  private String comment;

  @Embedded private InformationSourceDao source;

  @Embedded private RelativePositionDao position;

  @Column(name = "actual_time")
  private Instant actualTime;

  @Column(name = "system_time")
  private Instant systemTime;

  @Column(name = "active")
  private boolean active;

  @OneToMany(cascade = ALL)
  @JoinTable(
      name = "reference_site_aliases",
      joinColumns = {
        @JoinColumn(name = "reference_site", table = "reference_site", referencedColumnName = "id")
      },
      inverseJoinColumns = {
        @JoinColumn(
            name = "reference_alias",
            table = "reference_alias",
            referencedColumnName = "id")
      })
  private List<ReferenceAliasDao> aliases;

  /** Default constructor for JPA. */
  public ReferenceSiteDao() {}

  /**
   * Create a DAO from the COI object.
   *
   * @param site The ReferenceStation object.
   */
  public ReferenceSiteDao(ReferenceSite site) throws NullPointerException {
    Objects.requireNonNull(site);
    this.entityId = site.getEntityId();
    this.versionId = site.getVersionId();
    this.name = site.getName();
    this.description = site.getDescription();
    this.source = new InformationSourceDao(site.getSource());
    this.comment = site.getComment();
    this.latitude = site.getLatitude();
    this.longitude = site.getLongitude();
    this.elevation = site.getElevation();
    this.actualTime = site.getActualChangeTime();
    this.systemTime = site.getSystemChangeTime();
    this.active = site.isActive();
    this.position = RelativePositionDao.from(site.getPosition());
    this.aliases = site.getAliases().stream().map(ReferenceAliasDao::new).toList();
  }

  /**
   * Convert this DAO into its corresponding COI object.
   *
   * @return A ReferenceStation COI object.
   */
  public ReferenceSite toCoi() {
    return ReferenceSite.builder()
        .setName(getName())
        .setDescription(getDescription())
        .setSource(getSource().toCoi())
        .setComment(getComment())
        .setLatitude(getLatitude())
        .setLongitude(getLongitude())
        .setElevation(getElevation())
        .setActualChangeTime(getActualTime())
        .setSystemChangeTime(getSystemTime())
        .setActive(active)
        .setPosition(getPosition().toCoi())
        .setAliases(getAliases().stream().map(ReferenceAliasDao::toCoi).toList())
        .build();
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public UUID getEntityId() {
    return entityId;
  }

  public void setEntityId(UUID id) {
    this.entityId = id;
  }

  public UUID getVersionId() {
    return versionId;
  }

  public void setVersionId(UUID id) {
    this.versionId = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public double getLatitude() {
    return latitude;
  }

  public void setLatitude(double latitude) {
    this.latitude = latitude;
  }

  public double getLongitude() {
    return longitude;
  }

  public void setLongitude(double longitude) {
    this.longitude = longitude;
  }

  public double getElevation() {
    return elevation;
  }

  public void setElevation(double elevation) {
    this.elevation = elevation;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }

  public InformationSourceDao getSource() {
    return source;
  }

  public void setSource(InformationSourceDao source) {
    this.source = source;
  }

  public RelativePositionDao getPosition() {
    return position;
  }

  public void setPosition(RelativePositionDao position) {
    this.position = position;
  }

  public Instant getActualTime() {
    return actualTime;
  }

  public void setActualTime(Instant actualTime) {
    this.actualTime = actualTime;
  }

  public Instant getSystemTime() {
    return systemTime;
  }

  public void setSystemTime(Instant systemTime) {
    this.systemTime = systemTime;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public List<ReferenceAliasDao> getAliases() {
    return this.aliases;
  }

  public void setAliases(List<ReferenceAliasDao> aliases) {
    this.aliases = aliases;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    if (this.getClass() != o.getClass()) {
      return false;
    }
    ReferenceSiteDao that = (ReferenceSiteDao) o;
    return Double.compare(that.latitude, latitude) == 0
        && Double.compare(that.longitude, longitude) == 0
        && Double.compare(that.elevation, elevation) == 0
        && active == that.active
        && entityId.equals(that.entityId)
        && versionId.equals(that.versionId)
        && name.equals(that.name)
        && description.equals(that.description)
        && comment.equals(that.comment)
        && source.equals(that.source)
        && position.equals(that.position)
        && actualTime.equals(that.actualTime)
        && systemTime.equals(that.systemTime)
        && aliases.equals(that.aliases);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        entityId,
        versionId,
        name,
        description,
        latitude,
        longitude,
        elevation,
        comment,
        source,
        position,
        actualTime,
        systemTime,
        active,
        aliases);
  }

  @Override
  public String toString() {
    return "ReferenceSiteDao{"
        + "id="
        + id
        + ", entityId="
        + entityId
        + ", versionId="
        + versionId
        + ", name='"
        + name
        + '\''
        + ", description='"
        + description
        + '\''
        + ", latitude="
        + latitude
        + ", longitude="
        + longitude
        + ", elevation="
        + elevation
        + ", comment='"
        + comment
        + '\''
        + ", source="
        + source
        + ", position="
        + position
        + ", actualTime="
        + actualTime
        + ", systemTime="
        + systemTime
        + ", active="
        + active
        + ", aliases="
        + aliases
        + '}';
  }
}
