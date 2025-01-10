package gms.shared.fk.control.exception;

public class FkWebRequestException extends RuntimeException {

  public FkWebRequestException(String message, Exception ex) {
    super(message, ex);
  }
}
