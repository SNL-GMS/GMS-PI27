package gms.shared.waveform.coi;

import com.google.common.base.Preconditions;
import java.util.Arrays;

public final class Immutable2dDoubleArray {

  private static final int NO_NEED_TO_FIND_MORE_THAN_TWO = 2;

  private final double[][] values;

  private Immutable2dDoubleArray(double[][] values) {
    this.values = copyOf(values);
  }

  public static Immutable2dDoubleArray from(double[][] values) {

    Preconditions.checkNotNull(values);
    Preconditions.checkArgument(values.length > 0, "Expected at least 1 row");
    Preconditions.checkArgument(values[0].length > 0, "Expected at least 1 column");

    // must have same column width
    Preconditions.checkArgument(
        Arrays.stream(values)
                .mapToInt(r -> r.length)
                .distinct()
                .limit(NO_NEED_TO_FIND_MORE_THAN_TWO)
                .count()
            == 1,
        "Expected identical row lengths");

    return new Immutable2dDoubleArray(values);
  }

  public double getValue(int row, int column) {
    Preconditions.checkElementIndex(row, values.length, "Row outside of array bounds");
    Preconditions.checkElementIndex(column, values[row].length, "Column outside of array bounds");
    return values[row][column];
  }

  public int rowCount() {
    return values.length;
  }

  public int columnCount() {
    // works since we validated same column width across all rows
    return values[0].length;
  }

  public double[][] copyOf() {
    return copyOf(values);
  }

  private static double[][] copyOf(double[][] values) {
    var copyValues = new double[values.length][];
    for (var i = 0; i < values.length; i++) {
      double[] valuesRow = values[i];
      int rowLength = valuesRow.length;
      copyValues[i] = new double[rowLength];
      System.arraycopy(valuesRow, 0, copyValues[i], 0, rowLength);
    }

    return copyValues;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Immutable2dDoubleArray that = (Immutable2dDoubleArray) o;
    return Arrays.deepEquals(values, that.values);
  }

  @Override
  public int hashCode() {
    return Arrays.deepHashCode(values);
  }

  @Override
  public String toString() {
    return "Immutable2dDoubleArray{" + "values=" + Arrays.deepToString(values) + '}';
  }
}
