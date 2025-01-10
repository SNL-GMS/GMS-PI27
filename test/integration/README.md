# GMS Integration Tests
GMS uses python and pytest to run our integration tests suite.  If this is the first time you are running the integration tests or it's been a while since you've run python on GMS, you'll want to update your `conda` environment by uninstalling/re-installing the gms conda environment by following the steps below.  These should be run in the {GMS_COMMON}/python directory.  This will take some time (20-30mins) to complete.
```python
1) conda deactivate
2) conda env remove --name gms
3) conda env create --name gms --file gms-test-environment.yml
```
  
The integration tests will be run on a **TBD** schedule.  They can also be run from the command line to point to a currently running instance as outlined below.

## Running the Tests
PyTest is used to run the integration tests from the {GMS_COMMON}/test/integration directory.
The following commands can be used to run the entire suite or a subset of the tests
- Run the entire suite of integration tests
   * pytest --name {instance_name}
   * pytest --name sb_develop
- Run all tests within a specfic directory
   * pytest {directory} --name {instance_name}
   * pytest station-definition --name sb_develop
- Run all tests within a specfic file
   * pytest {directory}/{file_name} --name {instance_name}
   * pytest station-definition/test_station_groups.py --name sb_develop
- Run a specific test
   * pytest {directory}/{file_name}::{test_name} --name {instance_name}
   * pytest station-definition/test_station_groups.py::test_station_groups --name sb_develop

### Command Line Arguments
There are several command line arguments to be aware of to modify the amount of output displayed when running tests.  They are listed below.  
* -v: verbose.  This will display additional information about the test including url, request data, and runtime. 
* -vv: extra verbose.  This will display the response body returned by the query to the instance endpoint and includes the details printed by the **-v** flag. 

## Developing a Test
To Develop a test, you need to create a test_<test_name>.py file in an appropriate subdirectory.
Either add it to an existing subdirectory or create a new one.

A Test file must do two things
1) The test must create an array (or arrays) of commands to initialize/run the test.
The object ```Integration_Test_Info``` will have the following required properties.
```python
#The name of the test.  This should be unique to identify which test was run.
self.test_title 
#The url of the endpoint being tested of the format.  The {BASE_URL} will be filled in programatically.
self.url 
#JSON format of the request body
self.data 
#directory path to the expected response. This is used to compare against the actual response
self.vetted_response_file_path 
```
This object is used to run a single test.  It needs to be initialized with the required data to run the test.  Once the request is defined, it must be added to an array which is used as the argument to the test suite.  Any number of requests can be added to the `request` array and each will be run in turn.
```
station_groups_by_name_request = [
    Integration_Test_Info(
        'Station Definition Service - Station Groups By Name',
        BASE_URL + '/station-definition-service/station-definition/station-groups/query/names',
        {"stationGroupNames": ["ALL_IMS"]},
        './vetted-responses/station-definition/station-groups-by-name.json')
]
```
**Note:**  
**BASE_URL** is a constant and is replaced by the application when the <instance_name> is validated

2) The Test must call the `E2E_Test` class and assert the response to be true.  This call is a parameterized test that will loop through each element in the `request` array defined above
```code
@pytest.mark.parametrize('request', request)
def test_stations(request, options):
    assert run_e2e_test(request, options)
```
### Vetted Responses
`Vetted Responses` are used to validate the response from and endpoint to the expected response.  These have been validated by the SMEs and will only ever be updated by a SME.  Developers do not change these responses.  They are stored in the `vetted-responses` directory.  The ath to the file is given as an argument to the `Integration_Test_Info` object.

## Understanding Output
The tests are run using pytest, which creates a summary report of tests run and which pass/fail.  In addition, failing tests print stdout to the console.  By default, passing tests do not print to stdout.  You can toggle this on with the -s flag.
### Pytest Output
Output from pytest with a failure (without additional flags) looks similar to below.  A description of each section follows.
```
========================= test session starts =========================
platform linux -- Python 3.10.12, pytest-7.4.0, pluggy-1.3.0
rootdir: /home/user/GMS/gms-common/test/integration
configfile: pytest.ini
plugins: mock-3.10.0, anyio-4.0.0
collected 4 items                                                                                                                                          
station-definition/test_channel_groups.py [06:57:48]                                                                                                                                                                             
           ----- Station Definition Service - Channel Groups By Name Failed!!! -----                                                                                                                                                                                                                                                   
           endpoint_response_contains                                                                                                                                                                                                                                                                                                      
                   {"root[2]['name']": "MK31"}                                                                                                                                                                                                                                                                                             
           vetted_response_contains                                                                                                                                                                                                                                                                                                        
                   {"root[2]['new name']": "MK31"}                                                                                                                                                                                                                                                                                         
           values_changed                                                                                                                                                                                                                                                                                                                  
                   {"root[2]['type']": {"endpoint_response_value": "PHYSICAL_SITE", "vetted_response_value": "VIRTUAL_SITE"}}                                                                                                                                                                        
F
station-definition/test_channels.py [06:57:51]                                                                                                                                                                                                                                                                                                                                 
           ----- Station Definition Service - Channels By Name Passed!!! -----                                                                                                                                                                                                                                                             
.
station-definition/test_station_groups.py [06:57:54]                                                                                                                                                                                                                                                                                                                                 
[06:57:55] ----- Station Definition Service - Station Groups By Name Passed!!! -----                                                                                                                                                                                                                                                       
.
station-definition/test_stations.py [06:57:58]                                                                                                                                                                                                                                                                                                                                 
           ----- Station Definition Service - Stations By Name Passed!!! -----                                                                                                                                                                                                                                                             
.
================================== short test summary info ==================================
FAILED station-definition/test_channel_groups.py::test_stations[test_info0] - AssertionError: assert False
=============================== 1 failed, 3 passed in 13.58s ================================
```
1) test session starts  
Pytest lists which files are run and the total number of tests. It indicates which tests pass with a **.** and which tests fail with a **F**.    
The name of the test is given along wih `Passed!!!` or `Failed!!!` text.  In the event of a failure, the differences between the actual and expected responses are given.
* endpoint_response_contains: The response from the curl command contained a json element that as not present in the vetted response.  
* vetted_response_contains: The response from the curl command is missing a json element that is present in the expected vetted. 
* values_changed: The actual response and vetted response contain the same json elements, but the values are different.
2) short test summary info  
This is outut from pytest indicating how many test pass/fail.  If tests fail, it indicates which ones.  One thing to notice with this example is the text: **[test_info0]**.  This indicates a parameterized test (from the `test_info` array) was run and the 1st run of the test (0 indexed) failed.
