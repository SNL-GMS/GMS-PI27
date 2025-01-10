#ifndef FK_SPECTRUM_WINDOW_H
#define FK_SPECTRUM_WINDOW_H

/**
 * FKSpectrumWindow is comprised of two properties: double duration and double lead
 * Both doubles represent seconds-in-time evaluations based on ISO-8601 values (ie, PT2H)
 * For the sake of transcending the boundary and keeping WASM strictly compute, these values must
 * be supplied as doubles.
*/
class FkSpectrumWindow
{
public:
    FkSpectrumWindow(double duration, double lead)
        : duration(duration), lead(lead) {};
    double duration;
    double lead;

    FkSpectrumWindow() = default;
};

#endif //FK_SPECTRUM_WINDOW_H