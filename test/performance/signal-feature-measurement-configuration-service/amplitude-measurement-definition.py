#!/usr/bin/env python3
import sys
sys.path.append('../..')
from utils.test_utils import read_file_contents
from performance.performance_test_base import PerformanceTestBase

class AmplitudeMeasurentDefinition(PerformanceTestBase):
    """
    Stress test the signal-feature-measurement-configuration/amplitude-measurement-definition
    The default inut file is amplitude-measurement-type-request11.json
    """
    SERVICE_ENDPOINT_URL = "/signal-feature-measurement-configuration-service/signal-feature-measurement-configuration/amplitude-measurement-definition"
    DEFAULT_INPUT_FILE = "amplitude-measurement-type-request11.json"
    
    def __init__(self):
        self.args = self.get_args()    
        print(self.args)
    
    def get_service_endpoint_url(self):
        return self.SERVICE_ENDPOINT_URL
    
    def get_default_input_file(self):
        return self.DEFAULT_INPUT_FILE  
        
if __name__ == "__main__":
    test = AmplitudeMeasurentDefinition()
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
    
    test.create_request()
    
