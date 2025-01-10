#ifndef SLOWNESS_GRID_H
#define SLOWNESS_GRID_H

class SlownessGrid {
public:
    SlownessGrid(double maxSlowness, int numPoints)
        : maxSlowness(maxSlowness), numPoints(numPoints) {};

    double maxSlowness;
    int numPoints;

    SlownessGrid() = default;
};

#endif //SLOWNESS_GRID_H