#ifndef ORIENTATION_ANGLES_H
#define ORIENTATION_ANGLES_H

class OrientationAngles {
public:
    explicit OrientationAngles(double horizontalAngleDeg, double verticalAngleDeg)
        : horizontalAngleDeg(horizontalAngleDeg), verticalAngleDeg(verticalAngleDeg) {};
    double horizontalAngleDeg;
    double verticalAngleDeg;

bool operator==(OrientationAngles const& compared) const;
};


#endif //ORIENTATION_ANGLES_H