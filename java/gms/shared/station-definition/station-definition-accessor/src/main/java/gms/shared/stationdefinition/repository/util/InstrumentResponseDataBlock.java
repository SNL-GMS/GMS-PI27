package gms.shared.stationdefinition.repository.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * InstrumentResponseDataBlock is the data container representing a block of data Supports fap, fir,
 * and paz response formats
 */
public class InstrumentResponseDataBlock {

  private static final Pattern WHITESPACE =
      Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
  private static final String SPACE = " ";
  private static final int TYPE_POSITION = 3;

  private final String[] block;

  public InstrumentResponseDataBlock(String[] block) {
    this.block = block.clone();
  }

  /**
   * Retrieves the instrument response block from container
   *
   * @return The stored instrument response block
   */
  public String[] getBlock() {
    return block.clone();
  }

  /**
   * Identifies the format of the provide block object
   *
   * @return InstrumentResponseType of the data block
   * @throws IllegalStateException When unable to map format to InstrumentResponseType
   */
  public InstrumentResponseType getFormat() {
    if (block.length > 0) {
      var stringSplit =
          WHITESPACE.matcher(block[0].trim()).replaceAll(SPACE).split(WHITESPACE.toString());
      if (stringSplit.length >= (TYPE_POSITION + 1)) {
        return InstrumentResponseType.valueOf(stringSplit[TYPE_POSITION].toUpperCase(Locale.US));
      } else {
        throw new IllegalStateException(
            "Unable to determine InstrumentResponseType from line:" + block[0]);
      }
    }
    throw new IllegalStateException("No data available to determine InstrumentResponseType");
  }
}
