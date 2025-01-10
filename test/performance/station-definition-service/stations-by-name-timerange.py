#!/usr/bin/env python3
from random import randint
import copy
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase


class StationsByNameAndTimeRange(PerformanceTestBase):
    """
    Stress test the /station-definition-service/station-definition/stations/query/names-timerange endpoint
    The default input file is stations-time-range.json
    """
    SERVICE_ENDPOINT_URL = "/station-definition-service/station-definition/stations/query/names-timerange"
    DEFAULT_INPUT_FILE = "stations-time-range.json"

    STATIONS = ["ASAR", "AKASG", "ARCES", "BDFB",  "BGCA", "BJT",  "BOSA", "BRTR", "CMAR", "CPUP",
                "DBIC", "ESDC",  "FINES", "GERES", "GEYT", "HILR", "ILAR", "KBZ",  "KEST",
                "KMBO", "KSRS",  "LPAZ",  "LZDM",  "MAW",  "MJAR", "MKAR", "NOA",  "NRIK", "NVAR"
                "PDAR", "PETK",  "PLCA",  "PPT",   "ROSC", "SCHQ", "SONM", "STKA", "THR",  "TORD",
                "TXAR", "ULM",   "USRK",  "VNDA",  "WRA",  "YKA",  "ZAL",  "ZALV"]

    ON_THE_HOUR_TIMES = ["2019-01-05T16:00:00Z",
                         "2019-01-05T17:00:00Z",
                         "2019-01-05T18:00:00Z",
                         "2019-01-05T19:00:00Z",
                         "2019-01-05T20:00:00Z",
                         "2019-01-05T21:00:00Z",
                         "2019-01-05T22:00:00Z"]
    MIN_STATIONS = 1
    MAX_STATIONS = 5
    STATIONS_NAMES = 'stationNames'
    START_TIME_ATTRIBUTE = 'startTime'
    END_TIME_ATTRIBUTE = 'endTime'

    def __init__(self):
        self.args = self.get_args()
        print(self.args)
        self.number_of_stations = len(StationsByNameAndTimeRange.STATIONS)
        self.number_of_times = len(StationsByNameAndTimeRange.ON_THE_HOUR_TIMES)

    def rewrite_request_body(self, request_body, iter_num):
        """
        Generate a request body by adding a random set of stations, and random
        start and end times that occur on the hour within the time range of data
        (2019-01-05T16:00:00Z to 2019-01-05T22:00:00Z)
        and whose duration is one hour.
        """
        rewritten_request_body = copy.deepcopy(request_body)

        # Add stations to request
        rewritten_request_body[StationsByNameAndTimeRange.STATION_NAMES] = \
            [station for station in [StationsByNameAndTimeRange.STATIONS[randint(0, self.number_of_stations-1)]
              for _ in range(randint(StationsByNameAndTimeRange.MIN_STATIONS,
                                     StationsByNameAndTimeRange.MAX_STATIONS))]]

        # Add time range to request
        start_time_index = randint(0, self.number_of_times-2)
        rewritten_request_body[StationsByNameAndTimeRange.START_TIME_ATTRIBUTE] = \
            StationsByNameAndTimeRange.ON_THE_HOUR_TIMES[start_time_index]
        rewritten_request_body[StationsByNameAndTimeRange.END_TIME_ATTRIBUTE] = \
            StationsByNameAndTimeRange.ON_THE_HOUR_TIMES[start_time_index+1]

        return rewritten_request_body

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = StationsByNameAndTimeRange()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
