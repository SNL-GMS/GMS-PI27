#include "TestFilters.hh"

// BW_BP_CAUSAL_FILTER
LinearIIRFilterDescription TestFilters::buildBandPassDesignedFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{
        0.198710636346788,
            0.0,
            -0.198710636346788,
            0.180717344502774,
            0.0,
            -0.180717344502774,
            0.195110926812332,
            0.0,
            -0.195110926812332,
            0.166195758648592,
            0.0,
            -0.166195758648592,
            0.191151886989875,
            0.0,
            -0.191151886989875,
            0.156705657892246,
            0.0,
            -0.156705657892246,
            0.1862951100783,
            0.0,
            -0.1862951100783,
            0.152352582805543,
            0.0,
            -0.152352582805543,
            0.179052240394048,
            0.0,
            -0.179052240394048,
            0.154259283555432,
            0.0,
            -0.154259283555432},
        std::vector<double>{
        1.0,
            -1.976219617027818,
            0.982383307904244,
            1.0,
            -1.697210746750775,
            0.902939812307109,
            1.0,
            -1.940199194752232,
            0.946692316266706,
            1.0,
            -1.567257214575543,
            0.743602377003912,
            1.0,
            -1.900313957132869,
            0.907707761562771,
            1.0,
            -1.48937275004063,
            0.632430325477895,
            1.0,
            -1.850969561721879,
            0.86029814500257,
            1.0,
            -1.463823604243351,
            0.57125992728159,
            1.0,
            -1.776414014417223,
            0.790565265456503,
            1.0,
            -1.502073365203327,
            0.57099439959792},
        std::vector<double>{}, 0, true, 40, 0);
    return LinearIIRFilterDescription(params,
        true,
        "BW 0.5 3.0 10 BP causal",
        3.0,
        0.5,
        FilterBandType::BAND_PASS,
        FilterDesignModel::BUTTERWORTH,
        10,
        false);
};
LinearIIRFilterDescription TestFilters::buildBandPassFilter() const
{
    auto blankParams = IIRFilterParameters(
        std::vector<double>(),
        std::vector<double>(),
        std::vector<double>(), 0, false, 40, 0);

    return LinearIIRFilterDescription(blankParams,
        true,
        "BW 0.5 3.0 10 BP causal",
        3.0,
        0.5,
        FilterBandType::BAND_PASS,
        FilterDesignModel::BUTTERWORTH,
        10,
        false);
};

// Band Reject
LinearIIRFilterDescription TestFilters::buildBandRejectDesignedFilter() const
{
    // BW_BR_NONCAUSAL_FILTER
    auto params = IIRFilterParameters(
        std::vector<double>{1.003425849731876,
        -1.969345345538514,
        1.003425849731876,
        0.930710963372759,
        -1.826633531764778,
        0.930710963372759,
        0.994534945611291,
        -1.951895864192003,
        0.994534945611291,
        0.887904188973282,
        -1.742620027484762,
        0.887904188973282,
        0.985510537986778,
        -1.934184365971856,
        0.985510537986778,
        0.851398286800434,
        -1.670972751756325,
        0.851398286800434,
        0.976158632072041,
        -1.915830112501087,
        0.976158632072041,
        0.821228042267313,
        -1.611759975186001,
        0.821228042267313,
        0.966245289471987,
        -1.896373971209368,
        0.966245289471987,
        0.797371043850253,
        -1.564937712431148,
        0.797371043850253,
        0.955459474579558,
        -1.875205496865278,
        0.955459474579558,
        0.779850089191967,
        -1.53055070664003,
        0.779850089191967,
        0.943343311296696,
        -1.851426051903536,
        0.943343311296696,
        0.768845709192261,
        -1.50895327167386,
        0.768845709192261,
        0.929137308071128,
        -1.823545041723808,
        0.929137308071128,
        0.764878738217182,
        -1.501167608360777,
        0.764878738217182,
        0.911357178589543,
        -1.788649373800774,
        0.911357178589543,
        0.769255083927586,
        -1.509756719412234,
        0.769255083927586,
        0.886367344599885,
        -1.739603783370288,
        0.886367344599885,
        0.78556488845798,
        -1.541766695682187,
        0.78556488845798},
        std::vector<double>{1.0,
        -1.98502288094755,
        0.991174164054715,
        1.0,
        -1.737969705920257,
        0.950085752590039,
        1.0,
        -1.967381438029884,
        0.9735843173847,
        1.0,
        -1.659764852938338,
        0.858663552492987,
        1.0,
        -1.949419846266922,
        0.955785595678491,
        1.0,
        -1.594807138051037,
        0.778962187306156,
        1.0,
        -1.930746251807293,
        0.937401124837877,
        1.0,
        -1.542958145143811,
        0.711257914576815,
        1.0,
        -1.910882772927211,
        0.917981777226131,
        1.0,
        -1.504024131751521,
        0.655655668380133,
        1.0,
        -1.889187796216404,
        0.89693664980799,
        1.0,
        -1.47795239193023,
        0.612298493093734,
        1.0,
        -1.864708747017761,
        0.873403927479166,
        1.0,
        -1.465053085519023,
        0.581591604539358,
        1.0,
        -1.835853196622659,
        0.845966461243405,
        1.0,
        -1.4663728573102,
        0.564552227484941,
        1.0,
        -1.799483861790097,
        0.811879869189762,
        1.0,
        -1.484625329783098,
        0.563641557484307,
        1.0,
        -1.747826286100245,
        0.764512186469813,
        1.0,
        -1.527297112965214,
        0.585599359632933},
        std::vector<double>{}, 0, true, 40, 0);
    return LinearIIRFilterDescription(params,
        false,
        "BW 0.5 3.0 20 BR non-causal",
        3.0,
        0.5,
        FilterBandType::BAND_REJECT,
        FilterDesignModel::BUTTERWORTH,
        20,
        true);
};
LinearIIRFilterDescription TestFilters::buildBandRejectFilter() const
{
    auto blankParams = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, false, 40, 0);

    return LinearIIRFilterDescription(blankParams,
        false,
        "BW 0.5 3.0 20 BR non-causal",
        3.0,
        0.5,
        FilterBandType::BAND_REJECT,
        FilterDesignModel::BUTTERWORTH,
        20,
        true);
};

// Cascaded
CascadeFilterDescription TestFilters::buildCascade() const
{

    auto lpCausalParams = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, false, 40, 0);

    auto lpCausal = LinearIIRFilterDescription(lpCausalParams,
        true,
        "BW 0.5 3.0 7 LP causal",
        3.0,
        0.5,
        FilterBandType::LOW_PASS,
        FilterDesignModel::BUTTERWORTH,
        7,
        false);

    auto hpNonCausalParams = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, false, 40, 0);

    auto hpNoncausal = LinearIIRFilterDescription(hpNonCausalParams,
        false,
        "BW 0.5 3.0 7 LP causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        1,
        true);

    FilterDescriptionWrapper hpWrapper = FilterDescriptionWrapper::Builder().iirDescription(hpNoncausal).build();
    FilterDescriptionWrapper lpWrapper = FilterDescriptionWrapper::Builder().iirDescription(lpCausal).build();

    std::vector<FilterDescriptionWrapper> vecDefs = { lpWrapper, hpWrapper };

    auto lphpParams = CascadeFilterParameters(0, false, 40, 0);

    return CascadeFilterDescription(vecDefs, lphpParams, false, "Cascade LP-HP Filter");
};
CascadeFilterDescription TestFilters::buildDesignedCascade() const
{

    auto lpCausalParams = IIRFilterParameters(
        std::vector<double>{0.193599605930034,
        0.387199211860068,
        0.193599605930034,
        0.049496484722126,
        0.098992969444252,
        0.049496484722126,
        0.042474088413335,
        0.084948176826669,
        0.042474088413335,
        0.038676740290285,
        0.077353480580571,
        0.038676740290285},
        std::vector<double>{1.0,
        0.387199211860068,
        -0.612800788139932,
        1.0,
        -1.618507547663606,
        0.816493486552111,
        1.0,
        -1.38887909036463,
        0.558775444017968,
        1.0,
        -1.264707916739562,
        0.419414877900703},
        std::vector<double>{}, 0, true, 40, 0);

    auto lpCausal = LinearIIRFilterDescription(lpCausalParams,
        true,
        "BW 0.5 3.0 7 LP causal",
        3.0,
        0.5,
        FilterBandType::LOW_PASS,
        FilterDesignModel::BUTTERWORTH,
        7,
        false);

    auto hpNonCausalParams = IIRFilterParameters(
        std::vector<double>{0.962195245829104, 0.0, -0.962195245829104},
        std::vector<double>{1.0, 0.075609508341793, -0.924390491658207},
        std::vector<double>{}, 0, true, 40, 0);

    auto hpNoncausal = LinearIIRFilterDescription(hpNonCausalParams,
        false,
        "BW 0.5 3.0 7 LP causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        1,
        true);

    FilterDescriptionWrapper hpWrapper = FilterDescriptionWrapper::Builder().iirDescription(hpNoncausal).build();
    FilterDescriptionWrapper lpWrapper = FilterDescriptionWrapper::Builder().iirDescription(lpCausal).build();
    std::vector<FilterDescriptionWrapper> vecDefs = { lpWrapper, hpWrapper };
    auto lphpParams = CascadeFilterParameters(0, true, 40, 0);
    return CascadeFilterDescription(vecDefs, lphpParams, false, "Cascade LP-HP Filter");
};

// High Pass
LinearIIRFilterDescription TestFilters::buildHighPassDesignedFilter() const
{
    // BW_HP_NONCAUSAL_FILTER
    auto params = IIRFilterParameters(
        std::vector<double>{0.962195245829104,
        0.0,
        -0.962195245829104,
        0.960768166108094,
        -1.921536332216187,
        0.960768166108094},
        std::vector<double>{1.0,
        0.075609508341793,
        -0.924390491658207,
        1.0,
        -1.918570032544273,
        0.924502631888101},
        std::vector<double>(), 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        false,
        "BW 0.5 3.0 3 HP non-causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        3,
        true);
};
LinearIIRFilterDescription TestFilters::buildHighPassFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        false,
        "BW 0.5 3.0 3 HP non-causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        3,
        true);
    ;
};

LinearIIRFilterDescription TestFilters::buildHighPassCausalFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        false,
        "BW 0.5 3.0 3 HP causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        3,
        true);
};
LinearIIRFilterDescription TestFilters::buildHighPassCausalDesignedFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{
        0.96219524582910354,
            0,
            -0.96219524582910354,
            0.96076816610809368,
            -1.9215363322161874,
            0.96076816610809368},
        std::vector<double>{1,
        0.075609508341792947,
        -0.92439049165820708,
        1,
        -1.9185700325442732,
        0.924502631888101},
        std::vector<double>{}, 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        false,
        "BW 0.5 3.0 3 HP causal",
        3.0,
        0.5,
        FilterBandType::HIGH_PASS,
        FilterDesignModel::BUTTERWORTH,
        3,
        true);
};

// Low Pass
LinearIIRFilterDescription TestFilters::buildLowPassDesignedFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{0.193599605930034, 0.387199211860068, 0.193599605930034},
        std::vector<double>{1.0, 0.387199211860068, -0.612800788139932},
        std::vector<double>{}, 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        true,
        "BW 0.0 3.0 1 LP causal",
        3.0,
        0.5,
        FilterBandType::LOW_PASS,
        FilterDesignModel::BUTTERWORTH,
        1,
        false);
};
LinearIIRFilterDescription TestFilters::buildLowPassFilter() const
{
    auto params = IIRFilterParameters(
        std::vector<double>{},
        std::vector<double>{},
        std::vector<double>{}, 0, true, 40, 0);

    return LinearIIRFilterDescription(params,
        true,
        "BW 0.0 3.0 1 LP causal",
        3.0,
        0.5,
        FilterBandType::LOW_PASS,
        FilterDesignModel::BUTTERWORTH,
        1,
        false);
};