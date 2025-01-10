package gms.shared.frameworks.utilities.jpa;

public class JpaConstants {
  public enum EntityGraphType {
    FETCH("jakarta.persistence.fetchgraph"),
    LOAD("jakarta.persistence.loadgraph");

    private String value;

    EntityGraphType(String s) {
      value = s;
    }

    public String getValue() {
      return value;
    }
  }
}
