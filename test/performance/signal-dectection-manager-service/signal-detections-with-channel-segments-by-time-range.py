#!/usr/bin/env python3
from random import randint
import copy
import sys

sys.path.append('../..')
from performance.performance_test_base import PerformanceTestBase


class FindDetectionsWithSegmentsByStationsAndTimeRange(PerformanceTestBase):
    """
    Stress test the /signal-detection-manager-service/signal-detection/signal-detections-with-channel-segments/query/stations-timerange endpoint
    The default input file is stations-time-range.json
    """
    SERVICE_ENDPOINT_URL = "/signal-detection-manager-service/signal-detection/signal-detections-with-channel-segments/query/stations-timerange"
    DEFAULT_INPUT_FILE = "stations-time-range.json"

    STAGE_IDS = ["Auto Network",
                 "AL1",
                 "AL2"]

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
    NAME_ATTRIBUTE = 'name'
    STATIONS_ATTRIBUTE = 'stations'
    START_TIME_ATTRIBUTE = 'startTime'
    END_TIME_ATTRIBUTE = 'endTime'
    STAGE_ID_ATTRIBUTE = 'stageId'

    def __init__(self):
        self.args = self.get_args()
        print(self.args)
        self.number_of_stations = len(FindDetectionsWithSegmentsByStationsAndTimeRange.STATIONS)
        self.number_of_times = len(FindDetectionsWithSegmentsByStationsAndTimeRange.ON_THE_HOUR_TIMES)
        self.number_of_stage_ids = len(FindDetectionsWithSegmentsByStationsAndTimeRange.STAGE_IDS)

    def rewrite_request_body(self, request_body, iter_num):
        """
        Generate a request body by adding a random set of stations, a random stage ID, and random
        start and end times that occur on the hour within the time range of data (2019-01-05T16:00:00Z to 2019-01-05T22:00:00Z)
        and whose duration is one hour.
        """
        rewritten_request_body = copy.deepcopy(request_body)

        # Add stations to request
        rewritten_request_body[FindDetectionsWithSegmentsByStationsAndTimeRange.STATIONS_ATTRIBUTE] = \
            [{FindDetectionsWithSegmentsByStationsAndTimeRange.NAME_ATTRIBUTE: station} for station in
             [FindDetectionsWithSegmentsByStationsAndTimeRange.STATIONS[randint(0, self.number_of_stations-1)]
              for _ in range(randint(FindDetectionsWithSegmentsByStationsAndTimeRange.MIN_STATIONS,
                                     FindDetectionsWithSegmentsByStationsAndTimeRange.MAX_STATIONS))]]

        # Add time range to request
        start_time_index = randint(0, self.number_of_times-2)
        rewritten_request_body[FindDetectionsWithSegmentsByStationsAndTimeRange.START_TIME_ATTRIBUTE] = \
            FindDetectionsWithSegmentsByStationsAndTimeRange.ON_THE_HOUR_TIMES[start_time_index]
        rewritten_request_body[FindDetectionsWithSegmentsByStationsAndTimeRange.END_TIME_ATTRIBUTE] = \
            FindDetectionsWithSegmentsByStationsAndTimeRange.ON_THE_HOUR_TIMES[start_time_index+1]

        # Add stage ID to request
        rewritten_request_body[FindDetectionsWithSegmentsByStationsAndTimeRange.STAGE_ID_ATTRIBUTE] = \
            {FindDetectionsWithSegmentsByStationsAndTimeRange.NAME_ATTRIBUTE:
             FindDetectionsWithSegmentsByStationsAndTimeRange.STAGE_IDS[randint(0, self.number_of_stage_ids-1)]}

        return rewritten_request_body

    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL

    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE


if __name__ == "__main__":
    test = FindDetectionsWithSegmentsByStationsAndTimeRange()
    try:
        test.validation()
    except Exception as error:
        print("Error:", error)

    test.create_request()
