import pytest
from e2e_test_base import run_e2e_test, Integration_Test_Info, BASE_URL

request1 = Integration_Test_Info(
    'Waveform Service - Waveforms by Channels and Time Range',
    BASE_URL + '/waveform-manager-service/waveform/channel-segment/query/channel-timerange',
    {
        "channels": [
            {
                "name": "ASAR.AS01.SHZ"
            },
            {
                "name": "MAW.MAW.BHZ"
            },
            {
                "name": "MKAR.MK31.BHE"
            }
        ],
        "startTime": "2019-01-05T19:25:00Z",
        "endTime": "2019-01-05T19:29:00Z"
    },
    './vetted-responses/waveform/waveforms-by-channels-timerange.json') 
test_info = [request1]

@pytest.mark.parametrize('test_info', test_info)
def test_waveforms(test_info, options):
    assert run_e2e_test(test_info, options)
    
    