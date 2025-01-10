package gms.shared.user.preferences.dao;

import converter.UserInterfaceModeConverter;
import gms.shared.user.preferences.coi.UserInterfaceMode;
import gms.shared.user.preferences.coi.WorkspaceLayout;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "workspace_layout")
public class WorkspaceLayoutDao {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "name")
  private String name;

  @ElementCollection
  @CollectionTable(
      name = "workspace_layout_supported_ui_modes",
      joinColumns = {@JoinColumn(name = "workspace_layout_id")})
  @Convert(converter = UserInterfaceModeConverter.class)
  @Column(name = "supported_user_interface_mode")
  private List<UserInterfaceMode> supportedUserInterfaceModes;

  @Column(name = "layout_configuration", columnDefinition = "text")
  private String layoutConfiguration;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_profile_id", referencedColumnName = "id")
  private UserPreferencesDao userPreferences;

  protected WorkspaceLayoutDao() {}

  public WorkspaceLayoutDao(WorkspaceLayout workspaceLayout) {
    this.id = UUID.randomUUID();
    this.name = workspaceLayout.getName();
    this.supportedUserInterfaceModes = workspaceLayout.getSupportedUserInterfaceModes();
    this.layoutConfiguration = workspaceLayout.getLayoutConfiguration();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<UserInterfaceMode> getSupportedUserInterfaceModes() {
    return supportedUserInterfaceModes;
  }

  public void setSupportedUserInterfaceModes(List<UserInterfaceMode> supportedUserInterfaceModes) {
    this.supportedUserInterfaceModes = supportedUserInterfaceModes;
  }

  public String getLayoutConfiguration() {
    return layoutConfiguration;
  }

  public void setLayoutConfiguration(String layoutConfiguration) {
    this.layoutConfiguration = layoutConfiguration;
  }

  public UserPreferencesDao getUserPreferences() {
    return userPreferences;
  }

  public void setUserPreferences(UserPreferencesDao userPreferences) {
    this.userPreferences = userPreferences;
  }

  public WorkspaceLayout toCoi() {
    return WorkspaceLayout.from(name, supportedUserInterfaceModes, layoutConfiguration);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    WorkspaceLayoutDao that = (WorkspaceLayoutDao) o;
    return id == that.id
        && Objects.equals(name, that.name)
        && Objects.equals(supportedUserInterfaceModes, that.supportedUserInterfaceModes)
        && Objects.equals(layoutConfiguration, that.layoutConfiguration);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, name, supportedUserInterfaceModes, layoutConfiguration);
  }
}
