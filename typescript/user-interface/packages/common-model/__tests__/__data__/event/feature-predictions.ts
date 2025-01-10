import { CommonTypes, EventTypes } from '../../../src/ts/common-model';
import { FeatureMeasurementType } from '../../../src/ts/signal-detection';

export const featurePredictionsASAR: EventTypes.FeaturePrediction[] = [
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185968.717,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2524.9158666440003,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 2524.895584463,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Lg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.561,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.759045277,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.046251712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.331026203,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381767362,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'sP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184189.327,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 745.525023731,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.381548085,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 745.1318261949999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185266.984,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1823.1821160289999,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.6518746230000001,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 1822.5099592249999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Sn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663186384.572,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2940.770537815,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 2940.770537815,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Rg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184892.829,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1449.027608857,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 1448.634150712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381808694,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.824,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 729.022618081,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381796344,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 728.331104103,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.309717634,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'pP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184775.202,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.724579479,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381795808,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.33113422,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'P',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184775.202,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1331.400965743,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 1330.719661633,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.661021929,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'S',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  }
];

export const featurePredictionsPDAR: EventTypes.FeaturePrediction[] = [
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185968.717,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2524.9158666440003,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 2524.895584463,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Lg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.561,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.759045277,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.046251712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.331026203,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381767362,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'sP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184189.327,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 745.525023731,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.381548085,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 745.1318261949999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185266.984,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1823.1821160289999,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.6518746230000001,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 1822.5099592249999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Sn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663186384.572,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2940.770537815,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 2940.770537815,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Rg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184892.829,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1449.027608857,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 1448.634150712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381808694,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.824,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 729.022618081,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381796344,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 728.331104103,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.309717634,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'pP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663205772,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.724579479,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381795808,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.33113422,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'P',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184775.202,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1331.400965743,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 1330.719661633,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.661021929,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'S',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  }
];

export const featurePredictionsAKASG: EventTypes.FeaturePrediction[] = [
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185968.717,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2524.9158666440003,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 2524.895584463,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Lg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.561,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.759045277,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.046251712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.331026203,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381767362,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'sP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184189.327,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 745.525023731,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.381548085,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 745.1318261949999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663185266.984,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1823.1821160289999,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.6518746230000001,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 1822.5099592249999,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Sn',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663186384.572,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 2940.770537815,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 2940.770537815,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Rg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184892.829,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1449.027608857,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 1448.634150712,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.381808694,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'Pg',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184172.824,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 729.022618081,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381796344,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 728.331104103,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.309717634,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'pP',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: false,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663205700,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 728.724579479,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 0.381795808,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        },
        {
          value: {
            value: 0.011649451,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 728.33113422,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'P',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  },
  {
    extrapolated: true,
    predictionValue: {
      featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue: {
        arrivalTime: {
          value: 1663184775.202,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        },
        travelTime: {
          value: 1331.400965743,
          standardDeviation: 0,
          units: CommonTypes.Units.SECONDS
        }
      },
      featurePredictionComponentSet: [
        {
          value: {
            value: 1330.719661633,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.BASEMODEL_PREDICTION
        },
        {
          value: {
            value: 0.020282181,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: true,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELLIPTICITY_CORRECTION
        },
        {
          value: {
            value: 0.661021929,
            standardDeviation: 0,
            units: CommonTypes.Units.SECONDS
          },
          extrapolated: false,
          predictionComponentType: EventTypes.FeaturePredictionComponentType.ELEVATION_CORRECTION
        }
      ]
    },
    predictionType: FeatureMeasurementType.ARRIVAL_TIME,
    phase: 'S',
    sourceLocation: {
      latitudeDegrees: 21.410372,
      longitudeDegrees: 154.96821,
      depthKm: 0,
      time: 1663205043000
    },
    receiverLocation: {
      depthKm: 0,
      elevationKm: 2.2145,
      latitudeDegrees: 42.767375,
      longitudeDegrees: -109.557904
    }
  }
];
