/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { FilterList } from '@gms/common-model/lib/filter/types';
import { BandType, FilterType, LinearFilterType } from '@gms/common-model/lib/filter/types';

export const designedUiFilterList: FilterList = {
  name: 'Test Filters',
  defaultFilterIndex: 0,
  filters: [
    {
      withinHotKeyCycle: true,
      filterDefinition: {
        name: 'Test Filter 1',
        comments: 'Simple LP Filter',
        filterDescription: {
          filterType: FilterType.LINEAR,
          linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
          comments: 'BW 0.0 3.0 1 LP causal',
          causal: true,
          passBandType: BandType.LOW_PASS,
          lowFrequencyHz: 0.5,
          highFrequencyHz: 3.0,
          order: 1,
          zeroPhase: false,
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0,
            sosDenominatorCoefficients: [1.0, 0.387199211860068, -0.612800788139932],
            sosNumeratorCoefficients: [0.193599605930034, 0.387199211860068, 0.193599605930034]
          }
        }
      }
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: {
        name: 'Test Filter 2',
        comments: 'Simple HP Filter',
        filterDescription: {
          filterType: FilterType.LINEAR,
          linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
          comments: 'BW 0.5 0.0 3 HP non-causal',
          causal: false,
          passBandType: BandType.HIGH_PASS,
          lowFrequencyHz: 0.5,
          highFrequencyHz: 3.0,
          order: 3,
          zeroPhase: true,
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0,
            sosDenominatorCoefficients: [
              1.0, 0.075609508341793, -0.924390491658207, 1.0, -1.918570032544273, 0.924502631888101
            ],
            sosNumeratorCoefficients: [
              0.962195245829104, 0.0, -0.962195245829104, 0.960768166108094, -1.921536332216187,
              0.960768166108094
            ]
          }
        }
      }
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: {
        name: 'Test Filter 3',
        comments: 'Simple BP Filter',
        filterDescription: {
          filterType: FilterType.LINEAR,
          linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
          comments: 'BW 0.5 3.0 10 BP causal',
          causal: true,
          passBandType: BandType.BAND_PASS,
          lowFrequencyHz: 0.5,
          highFrequencyHz: 3.0,
          order: 10,
          zeroPhase: false,
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0,
            sosDenominatorCoefficients: [
              1.0, -1.976219617027818, 0.982383307904244, 1.0, -1.697210746750775,
              0.902939812307109, 1.0, -1.940199194752232, 0.946692316266706, 1.0,
              -1.567257214575543, 0.743602377003912, 1.0, -1.900313957132869, 0.907707761562771,
              1.0, -1.48937275004063, 0.632430325477895, 1.0, -1.850969561721879, 0.86029814500257,
              1.0, -1.463823604243351, 0.57125992728159, 1.0, -1.776414014417223, 0.790565265456503,
              1.0, -1.502073365203327, 0.57099439959792
            ],
            sosNumeratorCoefficients: [
              0.198710636346788, 0.0, -0.198710636346788, 0.180717344502774, 0.0,
              -0.180717344502774, 0.195110926812332, 0.0, -0.195110926812332, 0.166195758648592,
              0.0, -0.166195758648592, 0.191151886989875, 0.0, -0.191151886989875,
              0.156705657892246, 0.0, -0.156705657892246, 0.1862951100783, 0.0, -0.1862951100783,
              0.152352582805543, 0.0, -0.152352582805543, 0.179052240394048, 0.0,
              -0.179052240394048, 0.154259283555432, 0.0, -0.154259283555432
            ]
          }
        }
      }
    },
    {
      withinHotKeyCycle: true,
      filterDefinition: {
        name: 'Test Filter 4',
        comments: 'Simple BR Filter',
        filterDescription: {
          filterType: FilterType.LINEAR,
          linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
          comments: 'BW 0.5 3.0 20 BR non-causal',
          causal: false,
          passBandType: BandType.BAND_REJECT,
          lowFrequencyHz: 0.5,
          highFrequencyHz: 3.0,
          order: 20,
          zeroPhase: true,
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0,
            sosDenominatorCoefficients: [
              1.0, -1.98502288094755, 0.991174164054715, 1.0, -1.737969705920257, 0.950085752590039,
              1.0, -1.967381438029884, 0.9735843173847, 1.0, -1.659764852938338, 0.858663552492987,
              1.0, -1.949419846266922, 0.955785595678491, 1.0, -1.594807138051037,
              0.778962187306156, 1.0, -1.930746251807293, 0.937401124837877, 1.0,
              -1.542958145143811, 0.711257914576815, 1.0, -1.910882772927211, 0.917981777226131,
              1.0, -1.504024131751521, 0.655655668380133, 1.0, -1.889187796216404, 0.89693664980799,
              1.0, -1.47795239193023, 0.612298493093734, 1.0, -1.864708747017761, 0.873403927479166,
              1.0, -1.465053085519023, 0.581591604539358, 1.0, -1.835853196622659,
              0.845966461243405, 1.0, -1.4663728573102, 0.564552227484941, 1.0, -1.799483861790097,
              0.811879869189762, 1.0, -1.484625329783098, 0.563641557484307, 1.0,
              -1.747826286100245, 0.764512186469813, 1.0, -1.527297112965214, 0.585599359632933
            ],
            sosNumeratorCoefficients: [
              1.003425849731876, -1.969345345538514, 1.003425849731876, 0.930710963372759,
              -1.826633531764778, 0.930710963372759, 0.994534945611291, -1.951895864192003,
              0.994534945611291, 0.887904188973282, -1.742620027484762, 0.887904188973282,
              0.985510537986778, -1.934184365971856, 0.985510537986778, 0.851398286800434,
              -1.670972751756325, 0.851398286800434, 0.976158632072041, -1.915830112501087,
              0.976158632072041, 0.821228042267313, -1.611759975186001, 0.821228042267313,
              0.966245289471987, -1.896373971209368, 0.966245289471987, 0.797371043850253,
              -1.564937712431148, 0.797371043850253, 0.955459474579558, -1.875205496865278,
              0.955459474579558, 0.779850089191967, -1.53055070664003, 0.779850089191967,
              0.943343311296696, -1.851426051903536, 0.943343311296696, 0.768845709192261,
              -1.50895327167386, 0.768845709192261, 0.929137308071128, -1.823545041723808,
              0.929137308071128, 0.764878738217182, -1.501167608360777, 0.764878738217182,
              0.911357178589543, -1.788649373800774, 0.911357178589543, 0.769255083927586,
              -1.509756719412234, 0.769255083927586, 0.886367344599885, -1.739603783370288,
              0.886367344599885, 0.78556488845798, -1.541766695682187, 0.78556488845798
            ]
          }
        }
      }
    },
    {
      withinHotKeyCycle: false,
      filterDefinition: {
        name: 'Test Filter 5',
        comments: 'Cascade LP-HP Filter',
        filterDescription: {
          filterType: FilterType.CASCADE,
          comments: 'Cascade BW 0.0 3.0 7 LP causal / BW 0.5 0.0 1 HP non-causal',
          causal: true,
          filterDescriptions: [
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 0.0 3.0 7 LP causal',
              causal: true,
              passBandType: BandType.LOW_PASS,
              lowFrequencyHz: 0.5,
              highFrequencyHz: 3.0,
              order: 7,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, 0.387199211860068, -0.612800788139932, 1.0, -1.618507547663606,
                  0.816493486552111, 1.0, -1.38887909036463, 0.558775444017968, 1.0,
                  -1.264707916739562, 0.419414877900703
                ],
                sosNumeratorCoefficients: [
                  0.193599605930034, 0.387199211860068, 0.193599605930034, 0.049496484722126,
                  0.098992969444252, 0.049496484722126, 0.042474088413335, 0.084948176826669,
                  0.042474088413335, 0.038676740290285, 0.077353480580571, 0.038676740290285
                ]
              }
            },
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 0.5 0.0 1 HP non-causal',
              causal: true,
              passBandType: BandType.HIGH_PASS,
              lowFrequencyHz: 0.5,
              highFrequencyHz: 3.0,
              order: 1,
              zeroPhase: true,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [1.0, 0.075609508341793, -0.924390491658207],
                sosNumeratorCoefficients: [0.962195245829104, 0.0, -0.962195245829104]
              }
            }
          ],
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0
          }
        }
      }
    },
    {
      withinHotKeyCycle: false,
      filterDefinition: {
        name: 'Test Filter 6',
        comments: 'Cascade LP-HP-BP-BR-BR Filter',
        filterDescription: {
          filterType: FilterType.CASCADE,
          comments: 'Cascade BW LP-HP-BP-BR-BR causal',
          causal: true,
          filterDescriptions: [
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 0.0 8.0 13 LP causal',
              causal: true,
              passBandType: BandType.LOW_PASS,
              lowFrequencyHz: 0.5,
              highFrequencyHz: 8.0,
              order: 13,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, 0.841615559675464, -0.158384440324536, 1.0, -0.554470989669229,
                  0.794305814121207, 1.0, -0.462168119325305, 0.49560745116992, 1.0,
                  -0.401252590487474, 0.298480658965351, 1.0, -0.361027305646687, 0.168308902806273,
                  1.0, -0.335501713870589, 0.085706352652911, 1.0, -0.32132025998674,
                  0.039814203864996
                ],
                sosNumeratorCoefficients: [
                  0.420807779837732, 0.841615559675464, 0.420807779837732, 0.309958706112995,
                  0.619917412225989, 0.309958706112995, 0.258359832961154, 0.516719665922308,
                  0.258359832961154, 0.224307017119469, 0.448614034238938, 0.224307017119469,
                  0.201820399289896, 0.403640798579793, 0.201820399289896, 0.18755115969558,
                  0.375102319391161, 0.18755115969558, 0.179623485969564, 0.359246971939128,
                  0.179623485969564
                ]
              }
            },
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 0.5 0.0 13 HP causal',
              causal: true,
              passBandType: BandType.HIGH_PASS,
              lowFrequencyHz: 0.5,
              highFrequencyHz: 8.0,
              order: 13,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, 0.075609508341793, -0.924390491658207, 1.0, -1.975155231514575,
                  0.98126280352481, 1.0, -1.939863817503404, 0.945862261456776, 1.0,
                  -1.908761462381712, 0.914663731679764, 1.0, -1.883236915851944, 0.889060258185943,
                  1.0, -1.864316709588452, 0.870081546889348, 1.0, -1.852697613902165,
                  0.858426522653008
                ],
                sosNumeratorCoefficients: [
                  0.962195245829104, 0.0, -0.962195245829104, 0.989104508759846, -1.978209017519692,
                  0.989104508759846, 0.971431519740045, -1.94286303948009, 0.971431519740045,
                  0.955856298515369, -1.911712597030738, 0.955856298515369, 0.943074293509472,
                  -1.886148587018943, 0.943074293509472, 0.93359956411945, -1.8671991282389,
                  0.93359956411945, 0.927781034138793, -1.855562068277587, 0.927781034138793
                ]
              }
            },
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 1.0 6.0 5 BP causal',
              causal: true,
              passBandType: BandType.BAND_PASS,
              lowFrequencyHz: 0.8,
              highFrequencyHz: 6.0,
              order: 5,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, -1.309210403541855, 0.395928008797721, 1.0, -1.92402780534595,
                  0.939792563127147, 1.0, -0.999701776942077, 0.67280984739151, 1.0,
                  -1.796674060445032, 0.815712506277474, 1.0, -0.886784857841455, 0.316362710816507
                ],
                sosNumeratorCoefficients: [
                  0.302035995601139, 0.0, -0.302035995601139, 0.431405959300406, 0.0,
                  -0.431405959300406, 0.2983931267728, 0.0, -0.2983931267728, 0.403332697580005,
                  0.0, -0.403332697580005, 0.245987364757551, 0.0, -0.245987364757551
                ]
              }
            },
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 2.0 3.0 3 BR causal',
              causal: true,
              passBandType: BandType.BAND_REJECT,
              lowFrequencyHz: 2.0,
              highFrequencyHz: 3.0,
              order: 3,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, -1.718243969647683, 0.854080685463466, 1.0, -1.836921210197067,
                  0.936756284073001, 1.0, -1.71440357931858, 0.91263201782268
                ],
                sosNumeratorCoefficients: [
                  0.927040342731733, -1.718243969647683, 0.927040342731733, 0.979292649855282,
                  -1.815092194559505, 0.979292649855282, 0.941238170574229, -1.744559255992803,
                  0.941238170574229
                ]
              }
            },
            {
              filterType: FilterType.LINEAR,
              linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
              comments: 'BW 4.0 4.1 7 BR causal',
              causal: true,
              passBandType: BandType.BAND_REJECT,
              lowFrequencyHz: 4.0,
              highFrequencyHz: 4.1,
              order: 7,
              zeroPhase: false,
              parameters: {
                sampleRateHz: 40,
                sampleRateToleranceHz: 0,
                groupDelaySec: 0,
                sosDenominatorCoefficients: [
                  1.0, -1.596263606908427, 0.984414127416097, 1.0, -1.615011799548447,
                  0.996546989774316, 1.0, -1.596788690881497, 0.996474771581615, 1.0,
                  -1.608227034276469, 0.990334774904957, 1.0, -1.593575445883689, 0.990173504644669,
                  1.0, -1.60155086678991, 0.986011323908681, 1.0, -1.593405477985712,
                  0.985882541487032
                ],
                sosNumeratorCoefficients: [
                  0.992207063708048, -1.596263606908427, 0.992207063708048, 1.00076421494517,
                  -1.610030359432422, 1.00076421494517, 0.995694573416423, -1.601874315630267,
                  0.995694573416423, 0.997162747161714, -1.604236314857997, 0.997162747161714,
                  0.993058098801882, -1.597632752924594, 0.993058098801882, 0.994114748998646,
                  -1.5993326927013, 0.994114748998646, 0.991821973232227, -1.595644073008291,
                  0.991821973232227
                ]
              }
            }
          ],
          parameters: {
            sampleRateHz: 40,
            sampleRateToleranceHz: 0,
            groupDelaySec: 0
          }
        }
      }
    }
  ]
};
