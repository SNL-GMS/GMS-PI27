package gms.shared.event.analysis.relocation.locoo3d.apibridge;

/** Custom exception to report exceptions raised by Salsa3d's native methods */
public class Salsa3dException extends RuntimeException {
  public Salsa3dException(String message, Throwable cause) {
    super(message, cause);
  }
}
