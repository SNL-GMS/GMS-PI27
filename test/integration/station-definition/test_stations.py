import pytest
from e2e_test_base import run_e2e_test, Integration_Test_Info, BASE_URL

stations_by_name_request = [
    Integration_Test_Info(
        'Station Definition Service - Stations By Name',
        BASE_URL + '/station-definition-service/station-definition/stations/query/names',
        {"stationNames": ["ASAR"]},
        './vetted-responses/station-definition/stations-by-name.json')
]

@pytest.mark.parametrize('stations_by_name_request', stations_by_name_request)
def test_stations(stations_by_name_request, options):
    assert run_e2e_test(stations_by_name_request, options)
    
    