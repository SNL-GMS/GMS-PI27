#!/usr/bin/env python3
import sys
sys.path.append('..')
from utils.validate_conda_environment import console
from deepdiff import DeepDiff
import pytest
from pprint import pprint
import json
import time
from utils.environment_utils import validate_environment, get_ingress_domain_url
from utils.test_utils import read_file_contents, execute_curl_commands

BASE_URL: str = '<BASE_URL>'

class Integration_Test_Info:
    def __init__(self, test_title, url, data: json, vetted_response_file_path):
        # The name of the test.  This should be unique to identify which test was run.
        self.test_title = test_title
        # The url of the endpoint being tested.  The {BASE_URL} will be filled in programatically.
        self.url = url
        # JSON format of the request body.
        self.data = data
        # Directory path to the expected response. This is used to compare against the actual response.
        self.vetted_response_file_path = vetted_response_file_path

# -----------------------------------------------------------------------------
# Base Class for integration test scripts
# -----------------------------------------------------------------------------
class E2E_Test:
    def __init__(self, args):
        self.args = args     
        
    def processDiffs(self, test_title, diffs: DeepDiff):
        """
        Aggregate errors given in the `diffs` parameter into pre-defined categories
        Print the errors if the test fails or print success
        """
          
        if diffs:
            console.log(
                f"[red]----- {test_title} Failed!!! -----"               
            )          
        else:
            console.log(
                f"[green]----- {test_title} Passed!!! -----"
            )
            return True
        
        aggregated_diffs = dict()
        for key, value in diffs.items(): 
            if key == 'dictionary_item_added' or key == 'iterable_item_added':
                key = 'endpoint_response_contains'
            elif key == 'dictionary_item_removed' or key == 'iterable_item_removed':
                key = 'vetted_response_contains'
            
            aggregated_diffs.setdefault(key, []).append(value) 
        
       
        for key, value in aggregated_diffs.items():              
            values = ''
            for key2 in value: 
                values += json.dumps(key2) + '\n\t'
                
            if 'new_value' in values:
                values = values.replace('new_value', 'endpoint_response_value')
            if 'old_value' in values:
                values = values.replace('old_value', 'vetted_response_value')    
            console.log(
                f"[red]{key}\n\t"
                f"[red]{values.strip()}"
            )
        
        return False     
              
    def validation(self):
        if not self.args.name: 
            raise Exception("'--name <instance_name>' is a required argument")
        self.data_times = validate_environment(self.args.name)        
        self.base_url = get_ingress_domain_url(self.args.name)                
    
    def run(self, test_info: Integration_Test_Info) -> bool:
        """
        Executes the curl_command at the given url with the given data 
        and compares the response to the file given by the property 'vetted_response_file_path'
        
        Return:
            True if the response matches the vetted_response
            Otherwise False
        """
        # add a newline to make tests run output easier to understand
        console.log("")
        if self.args.verbose:
            start = time.time()
        
        url = str(test_info.url).replace('<BASE_URL>', self.base_url)
        expected = read_file_contents(test_info.vetted_response_file_path);
        actual = json.loads(execute_curl_commands(self.args, test_info.test_title, url, test_info.data))
        diffs = DeepDiff(expected, actual, ignore_order=True, verbose_level=2)
        ret_val = self.processDiffs(test_info.test_title, diffs)
                   
        if self.args.verbose:
            elapsed_time = time.time() - start
            console.log(f"Elapsed Time - {elapsed_time:.3f} s")
            
        return ret_val
              
def run_e2e_test(test_info: Integration_Test_Info, args):
    test = E2E_Test(args)
       
    try:        
        test.validation()
    except Exception as error:
        print("Error:", error)
        return False
    return test.run(test_info)


