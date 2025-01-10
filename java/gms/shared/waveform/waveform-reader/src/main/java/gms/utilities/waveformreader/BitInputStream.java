package gms.utilities.waveformreader;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * An input stream that allows variable-bit length integers to be read from the provided input
 * stream. Do not use this input stream for any other reading as it performs internal buffering of
 * the bytes.
 *
 * <p>Read bits from an input stream
 */
public class BitInputStream extends BufferedInputStream {

  private static final int BIT_LENGTH = 32;
  private static final int BITS_IN_BYTE = 8;
  private static final int BIT_OF_LAST_BYTE = 24;

  private int byteNumber;
  private int bitsRemaining;

  /** Construct a bit input stream over the provided input stream, reading n bytes at a time. */
  protected BitInputStream(InputStream is, int n) {
    super(is, n);
  }

  /**
   * Read a 32-bit integer constructed from the next n bits of signed 2's complement data.
   *
   * @param bits number of bits to read (0 to 32)
   * @return the int value of the integer
   * @throws java.io.IOException if an error is encountered while reading the bit stream
   */
  public final int readSigned(int bits) throws IOException {
    return read(bits, true);
  }

  /**
   * Read a 32-bit integer constructed from the next n bits of unsigned 2's complement data.
   *
   * @param bits number of bits to read (0 to 32)
   * @return the int value of the integer
   * @throws java.io.IOException if an error is encountered while reading the bit stream
   */
  public final int readUnsigned(int bits) throws IOException {
    return read(bits, false);
  }

  private int read(int bits, boolean signed) throws IOException {
    var out = 0;
    var n = 0;

    //  Read from the cached byte
    if (bitsRemaining > 0) {
      //  Get the bits
      out = byteNumber << (BIT_LENGTH - bitsRemaining);

      //  Number of bits read from the cached byte
      n = (bits < bitsRemaining ? bits : bitsRemaining);

      bitsRemaining -= n;
    }

    // Read the whole bytes
    for (; n < bits; n += BITS_IN_BYTE) {
      byteNumber = read() & 0xFF;

      if (n < BIT_OF_LAST_BYTE) {
        out |= byteNumber << (BIT_OF_LAST_BYTE - n);
      } else {
        out |= byteNumber >> (n - BIT_OF_LAST_BYTE);
      }

      bitsRemaining = n + BITS_IN_BYTE - bits;
    }

    //  Shift down and sign extend
    if (signed) {
      out >>= (BIT_LENGTH - bits);
    } else {
      out >>>= (BIT_LENGTH - bits);
    }

    return out;
  }
}
