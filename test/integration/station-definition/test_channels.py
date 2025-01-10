import pytest
from e2e_test_base import run_e2e_test, Integration_Test_Info, BASE_URL
 
channels_by_name_request = [
    Integration_Test_Info(
        'Station Definition Service - Channels By Name',
        BASE_URL + '/station-definition-service/station-definition/channels/query/names',
        {"channelNames": [
            "ASAR.AS01.SHZ",
            "MAW.MAW.BHZ",
            "MKAR.MK31.BHE" ]
        },
        './vetted-responses/station-definition/channels-by-name.json')
] 

@pytest.mark.parametrize('channels_by_name_request', channels_by_name_request)
def test_stations(channels_by_name_request, options):
    assert run_e2e_test(channels_by_name_request, options)