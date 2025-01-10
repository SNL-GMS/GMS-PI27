package gms.shared.stationdefinition.dao.css.enums;

/**
 * Segment type. This column indicates if a waveform is:
 *
 * <ul>
 *   <li>o (original)
 *   <li>v (virtual)
 *   <li>s (segmented)
 *   <li>d (duplicate)
 *   <li>c (calibration pulse)
 *   <li>f (flat non-zero segments)
 *   <li>g (glitch)
 *   <li>A (acceleration)
 *   <li>V (velocity)
 *   <li>D (deplacement)
 *   <li>n (no data; at most some bit noise; essentially a dead channel)
 *   <li>t (step)
 *   <li>u (under-resolved; data are live but largest signals have at most a few bits of resolution)
 *   <li>x (bad data; unknown serious instrument malfunction)
 * </ul>
 */
public enum SegType {
  NA("-"),
  ORIGINAL("o"),
  VIRTUAL("v"),
  SEGMENTED("s"),
  DUPLICATE("d"),
  CALIBRATION_PULSE("c"),
  FLAT("f"),
  GLITCH("g"),
  ACCELERATION("A"),
  VELOCITY("V"),
  DEPLACEMENT("D"),
  NO_DATA("n"),
  STEP("t"),
  UNDER_RESOLVED("u"),
  BAD_DATA("x");

  private final String name;

  SegType(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  @Override
  public String toString() {
    return this.getName();
  }
}
