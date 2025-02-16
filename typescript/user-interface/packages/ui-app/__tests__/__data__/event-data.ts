import { LegacyEventTypes, SignalDetectionTypes } from '@gms/common-model';

export const legacyEventData: LegacyEventTypes.Event = {
  id: 'f43f58f9-6a87-40e3-95ac-44168325fc49',
  conflictingSdIds: [],
  status: LegacyEventTypes.EventStatus.ReadyForRefinement,
  modified: false,
  hasConflict: false,
  currentEventHypothesis: {
    processingStage: {
      id: '1'
    },
    eventHypothesis: {
      locationSolutionSets: [
        {
          count: 1,
          id: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
          locationSolutions: [
            {
              id: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
              location: {
                latitudeDegrees: 67.57425,
                longitudeDegrees: 33.59468,
                depthKm: 0,
                time: 1274399850.081
              },
              locationToStationDistances: [],
              snapshots: [],
              featurePredictions: [],
              locationRestraint: {
                depthRestraintType: LegacyEventTypes.DepthRestraintType.FIXED_AT_SURFACE,
                depthRestraintKm: null,
                latitudeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
                latitudeRestraintDegrees: null,
                longitudeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
                longitudeRestraintDegrees: null,
                timeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
                timeRestraint: null
              },
              locationUncertainty: {
                xy: 163.665,
                xz: -1,
                xt: -26.6202,
                yy: 400.817,
                yz: -1,
                yt: 20.2312,
                zz: -1,
                zt: -1,
                tt: 6.6189,
                stDevOneObservation: 1.0484,
                ellipses: [
                  {
                    scalingFactorType: LegacyEventTypes.ScalingFactorType.CONFIDENCE,
                    kWeight: 0,
                    confidenceLevel: 0.9,
                    majorAxisLength: '49.1513',
                    majorAxisTrend: 37.23,
                    minorAxisLength: '29.2083',
                    minorAxisTrend: -1,
                    depthUncertainty: -1,
                    timeUncertainty: 'PT4.235S'
                  }
                ],
                ellipsoids: []
              },
              locationBehaviors: [
                {
                  residual: 1.28,
                  weight: 0.734,
                  defining: false,
                  signalDetectionId: '00000000-0000-0000-0000-000000000000',
                  featureMeasurementType:
                    SignalDetectionTypes.FeatureMeasurementType.AMPLITUDE_A5_OVER_2
                }
              ],
              locationType: 'standard',
              networkMagnitudeSolutions: [
                {
                  magnitude: 3.6532,
                  magnitudeType: LegacyEventTypes.MagnitudeType.MB,
                  uncertainty: 0.1611,
                  networkMagnitudeBehaviors: [
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 2.9357,
                        magnitudeUncertainty: 0.4228,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          measurementValue: {
                            value: 'Pn',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE,
                          snr: null
                        },
                        stationName: 'e03b9548-fda0-393e-9606-af73bf25f420',
                        phase: 'Pn'
                      },
                      residual: -0.6995,
                      weight: 1
                    },
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 3.7008,
                        magnitudeUncertainty: 0.281,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          snr: null,
                          measurementValue: {
                            value: 'P',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                        },
                        stationName: 'f7567432-5db0-3a03-a4cd-20db18ded4e7',
                        phase: 'P'
                      },
                      residual: 0.0657,
                      weight: 1
                    },
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 3.264,
                        magnitudeUncertainty: 0.403,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          snr: null,
                          measurementValue: {
                            value: 'Pn',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                        },
                        stationName: '4dd5d739-f4d6-37d6-82c0-099bfaf54b73',
                        phase: 'Pn'
                      },
                      residual: -0.3711,
                      weight: 1
                    },
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 3.5844,
                        magnitudeUncertainty: 0.3449,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          snr: null,
                          measurementValue: {
                            value: 'P',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                        },
                        stationName: '3695d63e-7071-3f74-b6a5-a92681fd2567',
                        phase: 'P'
                      },
                      residual: -0.0507,
                      weight: 1
                    },
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 3.5574,
                        magnitudeUncertainty: 0.3449,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          snr: null,
                          measurementValue: {
                            value: 'P',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                        },
                        stationName: '6856c4c5-54cf-377d-87dc-ed322f36c0bb',
                        phase: 'P'
                      },
                      residual: -0.0777,
                      weight: 1
                    },
                    {
                      defining: true,
                      stationMagnitudeSolution: {
                        type: LegacyEventTypes.MagnitudeType.MB,
                        model: LegacyEventTypes.MagnitudeModel.QFVC1,
                        magnitude: 4.1441,
                        magnitudeUncertainty: 0.281,
                        modelCorrection: 1,
                        stationCorrection: 1,
                        featureMeasurement: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          measuredChannelSegment: {
                            id: {
                              channel: {
                                name: 'ASAR.AS01.SHZ',
                                effectiveAt: 1636503404
                              },
                              startTime: 1636503404,
                              endTime: 1636503504,
                              creationTime: 1636503404
                            }
                          },
                          snr: null,
                          measurementValue: {
                            value: 'P',
                            confidence: 0.5,
                            referenceTime: 1636503404
                          },
                          featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                        },
                        stationName: 'e7437e38-94ba-34d4-a95c-0a9e3983c689',
                        phase: 'P'
                      },
                      residual: 0.5089,
                      weight: 1
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      id: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
      rejected: false,
      event: {
        id: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
        status: LegacyEventTypes.EventStatus.ReadyForRefinement
      },
      preferredLocationSolution: {
        locationSolution: {
          id: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
          location: {
            latitudeDegrees: 67.57425,
            longitudeDegrees: 33.59468,
            depthKm: 0,
            time: 1274399850.081
          },
          locationToStationDistances: [],
          snapshots: [],
          featurePredictions: [],
          locationRestraint: {
            depthRestraintType: LegacyEventTypes.DepthRestraintType.FIXED_AT_SURFACE,
            depthRestraintKm: null,
            latitudeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
            latitudeRestraintDegrees: null,
            longitudeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
            longitudeRestraintDegrees: null,
            timeRestraintType: LegacyEventTypes.RestraintType.UNRESTRAINED,
            timeRestraint: null
          },
          locationUncertainty: {
            xy: 163.665,
            xz: -1,
            xt: -26.6202,
            yy: 400.817,
            yz: -1,
            yt: 20.2312,
            zz: -1,
            zt: -1,
            tt: 6.6189,
            stDevOneObservation: 1.0484,
            ellipses: [
              {
                scalingFactorType: LegacyEventTypes.ScalingFactorType.CONFIDENCE,
                kWeight: 0,
                confidenceLevel: 0.9,
                majorAxisLength: '49.1513',
                majorAxisTrend: 37.23,
                minorAxisLength: '29.2083',
                minorAxisTrend: -1,
                depthUncertainty: -1,
                timeUncertainty: 'PT4.235S'
              }
            ],
            ellipsoids: []
          },
          locationBehaviors: [
            {
              residual: 1.28,
              weight: 0.734,
              defining: false,
              featureMeasurementType:
                SignalDetectionTypes.FeatureMeasurementType.AMPLITUDE_A5_OVER_2,
              signalDetectionId: '00000000-0000-0000-0000-000000000000'
            }
          ],
          locationType: 'standard',
          networkMagnitudeSolutions: [
            {
              magnitude: 3.6532,
              magnitudeType: LegacyEventTypes.MagnitudeType.MB,
              uncertainty: 0.1611,
              networkMagnitudeBehaviors: [
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 2.9357,
                    magnitudeUncertainty: 0.4228,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'Pn',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: 'e03b9548-fda0-393e-9606-af73bf25f420',
                    phase: 'Pn'
                  },
                  residual: -0.6995,
                  weight: 1
                },
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 3.7008,
                    magnitudeUncertainty: 0.281,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'P',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: 'f7567432-5db0-3a03-a4cd-20db18ded4e7',
                    phase: 'P'
                  },
                  residual: 0.0657,
                  weight: 1
                },
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 3.264,
                    magnitudeUncertainty: 0.403,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'Pn',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: '4dd5d739-f4d6-37d6-82c0-099bfaf54b73',
                    phase: 'Pn'
                  },
                  residual: -0.3711,
                  weight: 1
                },
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 3.5844,
                    magnitudeUncertainty: 0.3449,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'P',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: '3695d63e-7071-3f74-b6a5-a92681fd2567',
                    phase: 'P'
                  },
                  residual: -0.0507,
                  weight: 1
                },
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 3.5574,
                    magnitudeUncertainty: 0.3449,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'P',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: '6856c4c5-54cf-377d-87dc-ed322f36c0bb',
                    phase: 'P'
                  },
                  residual: -0.0777,
                  weight: 1
                },
                {
                  defining: true,
                  stationMagnitudeSolution: {
                    type: LegacyEventTypes.MagnitudeType.MB,
                    model: LegacyEventTypes.MagnitudeModel.QFVC1,
                    magnitude: 4.1441,
                    magnitudeUncertainty: 0.281,
                    modelCorrection: 1,
                    stationCorrection: 1,
                    featureMeasurement: {
                      channel: {
                        name: 'ASAR.AS01.SHZ',
                        effectiveAt: 1636503404
                      },
                      measuredChannelSegment: {
                        id: {
                          channel: {
                            name: 'ASAR.AS01.SHZ',
                            effectiveAt: 1636503404
                          },
                          startTime: 1636503404,
                          endTime: 1636503504,
                          creationTime: 1636503404
                        }
                      },
                      snr: null,
                      measurementValue: {
                        value: 'P',
                        confidence: 0.5,
                        referenceTime: 1636503404
                      },
                      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.PHASE
                    },
                    stationName: 'e7437e38-94ba-34d4-a95c-0a9e3983c689',
                    phase: 'P'
                  },
                  residual: 0.5089,
                  weight: 1
                }
              ]
            }
          ]
        }
      },
      associationsMaxArrivalTime: 1274399905.01,
      signalDetectionAssociations: [
        {
          id: '527562d9-027e-4b88-941e-91543763b7a4',
          deleted: false,
          eventHypothesisId: '186f997b-7d7d-3151-8b4d-5609f7a8f31f',
          signalDetectionHypothesis: {
            id: '1c8f8122-0056-3ed9-9304-ddea79de2393',
            deleted: false,
            parentSignalDetectionId: '1c8f8122-0056-3ed9-9304-ddea79de2393'
          }
        }
      ]
    }
  }
};
