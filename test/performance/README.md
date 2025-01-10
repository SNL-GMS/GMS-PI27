# GMS Performance Tests
GMS uses python to run our performance/stress tests.  These are scripts that can be used to stress the system and analyze memory/CPU usage.  They are not tests in a strict sense in that there is no pass/fail. The scripts are used to send parallel asynchronous requests to backend endpoints and the performance of the backend can be investigated using other tools such as `JProfiler`.  

If this is the first time you are running the performance tests or it's been a while since you've run python on GMS, you'll want to update your `conda` environment by uninstalling/re-installing the gms conda environment by following the steps below.  These should be run in the {GMS_COMMON}/python directory.  This will take some time (20-30mins) to complete.

```python
1) conda deactivate
2) conda env remove --name gms
3) conda env create --name gms --file gms-test-environment.yml
```
  
The performance tests will be run on-demand and not part of the pipeline or checkout process. 

## Running the Tests
Python is used to run the performance tests from the {GMS_COMMON}/test/performance/{SUB_DIR} directory, where {SUB_DIR} is a directory specific for each service.
The following example commands can be used to run the tests
- Run rotation-templates.py test.  the cmd-line options are discussed below
   * ./rotation-templates.py --name {instance_name}
   * ./rotation-templates.py --name {instance_name} -r {num_requests} 
   * ./rotation-templates.py --name {instance_name} -r {num_requests} -f {path/to/input_file}
- Run get_default_filter_defs.py test
   * ./get_default_filter_defs.py --name {instance_name} -c 25
- Help is availbe for all tests using the -h option
   * ./get_default_filter_defs.py -h

### Command Line Arguments
There are several command line arguments to be aware of.  The tests define default options for the common cmd-line args, but each test can add additional cmd-line args that may/may-not be requied.  These can be viewed with the `-h` flag
* --name(required): Name of the deployment.
* -r: Number of request.  Default is 1.
* -f: path to input file.  default is defined per test and is located in the `/requests` subdir.
* -v: verbose.  This will display additional information about the test including url and request data. 
Additionally, each script can add custom cmd-line options unique to the endpoint under test.  Use the `-h` flag to learn more about those options.

## Developing a Test
To Develop a test, you need to create a .py file in an appropriate subdirectory.
Either add it to an existing subdirectory or create a new one based off the service being tested.
In the subdir, there should be a `requests` folder, this will contain the json data for the http request.

A Test file must do two things
1) The test should inherit from the base class `PerformanceTestBase`. This base class has 2 abstract methods that need to be overridden in the subclass
   a. get_service_endpoint_url()
   - this defines the url location of the endpoint being tested, starting with the service name
     ex: "/signal-enhancement-configuration-service/signal-enhancement-configuration/default-filter-definitions-by-usage-map"
   b. get_default_input_file()
   - this defines the default input file to be used if the file is not specified on the cmd line.  It need to be places in the `requests` folder.
   c. Optionally, override the following methods
   - `custom_args()`
      define additional cmd-line args, most likely to be used in the `rewrite_request_body()` method
   - `rewrite_request_body()`
      define custom behavior of the test, such as chunking the request file into smaller subrequest.
2) In the `main()` method, the test must make the following calls (see existing tests for examples).  The method definitions are defined in the superclass.
   - test.validation()
   - test.create_request()
## Understanding Test Execution
The test is executed by submitting parallel requests to the server.  Without any request chunking, the number of requests is defined by the -r method and the entire requet file is submitted.  All requests are fired off simultaneously.  The response time is the time for all requests to be completed, no necessarily execution time, and is printed to the screenupon completion.  So, if the server is unable to handle all requests at time of submission, the requests will be placed in a queue for the server to execute when it is able to.  This results in a response time much larger than each individual request as it includes time waiting in the queue.  
  
Chunking or other request manipulation is done on a per test basis and should be specified in that test file description.
