package gms.shared.featureprediction.utilities.math;

import static java.lang.Math.abs;

import com.google.common.math.DoubleMath;
import org.apache.commons.lang3.Validate;

/** A class for rational function interpolation and extrapolation */
public final class RationalFunctionInterpolator {

  private static final double EPSILON = 1.0e-6;
  private static final double TOLERANCE = 1.0e-16;

  private RationalFunctionInterpolator() {}

  /**
   * This method performs interpolation and extrapolation by creating a rational function
   * approximation of the given x and y data values. It is an implementation of the rawinterp()
   * function in section 3.4 Rational Function Interpolation and Extrapolation (pp 124-7) of Press,
   * W.H., et al (2007). Numerical Recipes: The Art of Scientific Computing (3rd Ed.). Cambridge
   * University Press.
   *
   * @param xValues - array of abscissa data
   * @param yValues - array of ordinal data
   * @param x - abscissa value for which an approximation is desired
   * @return an approximation of the ordinal at x
   */
  public static double interpolate(double[] xValues, double[] yValues, double x) {

    Validate.isTrue(xValues.length == yValues.length, "Number of X and Y data points differ.");

    var ns = 0;

    // hh = length between x and first value of xValues
    double hh = abs(x - xValues[0]);
    var c = new double[xValues.length];
    var d = new double[xValues.length];
    for (var i = 0; i < xValues.length; ++i) {
      // figure out distance between desired point and fixed points
      double h = abs(x - xValues[i]);
      // if x is on a grid point return no interpolation
      if (DoubleMath.fuzzyEquals(h, 0.0, TOLERANCE)) {
        return yValues[i];
        // if the ith position is closer than the first position, it's the new hh
      } else if (h < hh) {
        // ns = index of the closest point to desired value
        ns = i;
        hh = h;
      } else {
        // otherwise, hh remains the same; no action
      }
      c[i] = yValues[i];
      d[i] = yValues[i] + EPSILON;
    }

    // index before closest y value
    double y = yValues[ns];

    ns -= 1;
    for (var m = 0; m < xValues.length - 1; ++m) {
      for (var i = 0; i < xValues.length - 1 - m; ++i) {
        double h = xValues[i + m + 1] - x;
        double t = (xValues[i] - x) * d[i] / h;

        double dd = t - c[i + 1];
        if (DoubleMath.fuzzyEquals(dd, 0.0, TOLERANCE)) {
          return Double.NaN;
        }

        // w = difference between two points
        double w = c[i + 1] - d[i];

        dd = w / dd;
        d[i] = c[i + 1] * dd;
        c[i] = t * dd;
      }

      if (2 * (ns + 1) < (xValues.length - m - 1)) {
        y += c[ns + 1];
      } else {
        y += d[ns];
        ns -= 1;
      }
    }

    return y;
  }
}
