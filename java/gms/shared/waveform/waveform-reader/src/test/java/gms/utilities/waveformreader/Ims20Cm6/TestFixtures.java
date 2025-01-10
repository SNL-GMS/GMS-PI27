package gms.utilities.waveformreader.Ims20Cm6;

public final class TestFixtures {

  // Files with CM6 and INT data types
  private static final String TEST_DATA_DIR = "/ims2/cm6/";
  // CM6 data for 10 seconds of data for the KURK station
  public static final String KURK_CM6_FILE = TEST_DATA_DIR + "KURK_CM6.response";
  // INT data for the same 10 seconds of data for the KURK station
  public static final String KURK_INT_FILE = TEST_DATA_DIR + "KURK_INT.response";
  // The CM6 data, manipulated to have an invalid character
  public static final String KURK_CM6_INVALID_FILE = TEST_DATA_DIR + "KURK_CM6_INVALID.response";
  // The CM6 data, manipulated to have an invalid character
  public static final String KURK_CM6_OVERRUN_FILE = TEST_DATA_DIR + "KURK_CM6_OVERRUN.response";
  // The CM6 data, manipulated to have leftover data in the cache
  public static final String KURK_CM6_CACHE_FILE = TEST_DATA_DIR + "KURK_CM6_CACHE.response";
}
