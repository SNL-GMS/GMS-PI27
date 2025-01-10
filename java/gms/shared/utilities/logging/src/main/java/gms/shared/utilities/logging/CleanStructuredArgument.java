package gms.shared.utilities.logging;

import gms.shared.frameworks.utilities.Validation;
import java.util.Objects;
import java.util.regex.Pattern;
import net.logstash.logback.argument.StructuredArgument;
import net.logstash.logback.argument.StructuredArguments;

public final class CleanStructuredArgument {

  // The characters listed are the whitelist characters, negated. The ^ in the front negates it,
  // making it "all characters
  // other than those listed are not allowed."
  private static final String DISALLOWED_CHARS = "[^\\w\\-\\.\\[\\]{}(),?!:;\t ]";
  private static final Pattern DISALLOWED =
      Pattern.compile(DISALLOWED_CHARS, Pattern.UNICODE_CHARACTER_CLASS);

  StructuredArgument structuredArgument;

  private CleanStructuredArgument(StructuredArgument argument) {
    this.structuredArgument = argument;
  }

  public static CleanStructuredArgument keyValue(String key, Object value) {
    Validation.cleanseInputString(key);
    Validation.cleanseInputString(value.toString());
    value = scrubString(value.toString());
    return new CleanStructuredArgument(StructuredArguments.keyValue(key, value));
  }

  private static Object scrubString(Object value) {
    // Need to run through potential scrub - characters present not on the white list ?
    return DISALLOWED.matcher(value.toString()).replaceAll("");
  }

  public static CleanStructuredArgument kv(String key, Object value) {
    return keyValue(key, value);
  }

  public static CleanStructuredArgument value(String key, Object value) {
    Validation.cleanseInputString(key);
    Validation.cleanseInputString(value.toString());
    value = scrubString(value.toString());
    return new CleanStructuredArgument(StructuredArguments.value(key, value));
  }

  public static CleanStructuredArgument v(String key, Object value) {
    return value(key, value);
  }

  public StructuredArgument getStructuredArgument() {
    return structuredArgument;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    CleanStructuredArgument that = (CleanStructuredArgument) o;
    return Objects.equals(structuredArgument, that.structuredArgument);
  }

  @Override
  public int hashCode() {
    return Objects.hash(structuredArgument);
  }
}
