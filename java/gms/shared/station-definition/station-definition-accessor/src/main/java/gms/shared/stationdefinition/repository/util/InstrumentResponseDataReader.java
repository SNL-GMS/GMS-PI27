package gms.shared.stationdefinition.repository.util;

import com.google.common.io.Files;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.regex.Pattern;

/**
 * InstrumentResponseDataReader parses data into data blocks from the provided file Supports fap,
 * fir, and paz response formats
 */
public final class InstrumentResponseDataReader {

  private static final String COMMENT_INDICATOR = "#";
  private static final Pattern START_BLOCK =
      Pattern.compile("^(theoretical|measured).*", Pattern.UNICODE_CHARACTER_CLASS);
  private static final Pattern WHITESPACE =
      Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
  private static final String SPACE = " ";

  private InstrumentResponseDataReader() {
    // Hide implicit public constructor since this is a utility class
  }

  /**
   * Retrieves the {@link InstrumentResponseDataBlock}'s contained in the input file
   *
   * @param fileName Containing instrument response data
   * @return {@link InstrumentResponseDataBlock}'s contained in the file
   * @throws IOException For issues accessing or reading file
   */
  public static Collection<InstrumentResponseDataBlock> parseFile(String fileName)
      throws IOException {

    return parseFile(new File(fileName));
  }

  /**
   * Retrieves the {@link InstrumentResponseDataBlock}'s contained in the input file
   *
   * @param file Containing instrument response data
   * @return {@link InstrumentResponseDataBlock}'s contained in the file
   * @throws IOException For issues accessing or reading file
   */
  public static Collection<InstrumentResponseDataBlock> parseFile(File file) throws IOException {

    var stringList = Files.readLines(file, Charset.defaultCharset());

    var reducedList =
        stringList.stream()
            .map(str -> str.trim().replaceAll(WHITESPACE.toString(), SPACE))
            .filter(str2 -> !str2.startsWith(COMMENT_INDICATOR))
            .filter(str3 -> !str3.isBlank())
            .toList();
    var reducedArray = reducedList.toArray(String[]::new);

    var tmpIndexList = new ArrayList<Integer>();
    for (var i = 0; i < reducedArray.length; i++) {
      if (START_BLOCK.matcher(reducedArray[i]).matches()) {
        tmpIndexList.add(i);
      }
    }
    tmpIndexList.add(reducedArray.length);
    var indicesArray = tmpIndexList.stream().mapToInt(i -> i).toArray();

    var blockList = new ArrayList<InstrumentResponseDataBlock>();
    for (var i = 0; i < (indicesArray.length - 1); i++) {
      var dataBlock =
          new InstrumentResponseDataBlock(
              reducedList.subList(indicesArray[i], indicesArray[i + 1]).toArray(String[]::new));
      blockList.add(dataBlock);
    }

    return blockList.stream().toList();
  }
}
