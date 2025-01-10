#ifndef RELATIVE_POSITION_H
#define RELATIVE_POSITION_H

class RelativePosition {

public:
	RelativePosition() : northDisplacementKm(0), eastDisplacementKm(0), verticalDisplacementKm(0) {}
	explicit RelativePosition(
		double northDisplacementKm,
		double eastDisplacementKm,
		double verticalDisplacementKm)
		: northDisplacementKm(northDisplacementKm),
		eastDisplacementKm(eastDisplacementKm),
		verticalDisplacementKm(verticalDisplacementKm) {};

	double northDisplacementKm;
	double eastDisplacementKm;
	double verticalDisplacementKm;
};

#endif // RELATIVE_POSITION_H