#!/usr/bin/env python3
import sys
sys.path.append('..')
import os
import argparse
from argparse import ArgumentParser, RawDescriptionHelpFormatter
from utils.environment_utils import validate_environment, get_ingress_domain_url
from utils.test_utils import read_file_contents
import time
import aiohttp
import asyncio
from abc import ABC, abstractmethod
class PerformanceTestBase(ABC):
   
    def validation(self):
        """
        Ensures we are in a Kubernetes environment(kubeconfig has been run) and the instance exists.
        Also retrieves the ingress url and checks if we are in a simulated environment in case the date_times are needed
        """
        if not self.args.name: 
            raise Exception("'--name <instance_name>' is a required argument")
        self.data_times = validate_environment(self.args.name)        
        self.base_url = get_ingress_domain_url(self.args.name) 
    
    async def post(self, session: aiohttp.ClientSession, url: str, request_body: any):
        """
        Makes parallel post request to the given url with the given request_body
        """
        headers = {
            'Accepts': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip'
        }
        async with session.post(url, params=headers, json=request_body) as response:
            _ = await response.json()
            return _
                     
    async def create_async_requests(self, request_body):
        """
        Waits for parallel requests to be returned
        """
        num_requests = int(self.args.requests) * int(self.args.users)
        
        async with aiohttp.ClientSession() as session:
            await asyncio.gather(
                *[self.post(session, url, request_body) for url in self.urls(num_requests)]
            )
        
    def urls(self, n_reqs: int):
        """
        Retreives the urls to make parallel calls to
        'yield' allows the calls to be made in parallel
        """
        for _ in range(n_reqs):
            yield self.base_url + self.get_service_endpoint_url()
                     
    def create_request(self, iter_num=0):        
        """
        Reads the json file to create the request body and passes it to make_request().
        This is outside of the make_request recursive call so we don't read the file more than once
        """
        file_name = self.args.file
        directory = os.path.dirname(file_name)
        
        if(directory):
            request_body = read_file_contents(file_name);  
        else:
            request_body = read_file_contents('./requests/' + file_name);  
        start = time.time()
        self.make_request(request_body, iter_num)
        elapsed_time = time.time()-start
        print('Elapsed Time: ' + str(elapsed_time))
    
    def make_request(self, request_body, iter_num):
        """
        Gets the full request body and passes it to rewrite_request_body which will chunk the request_body up into sub-parts as needed on a per test basis.
        The rewritten_request_body is then passed to the async create_async_requests method   
        """
        rewritten_request_body = self.rewrite_request_body(request_body, iter_num) 
        
        if(self.args.verbose):
            print("----- REQUEST DATA -----")
            print(self.base_url + self.get_service_endpoint_url())            
            print(rewritten_request_body)
        asyncio.run(self.create_async_requests(rewritten_request_body))
      
    def rewrite_request_body(self, request_body, iter_num):
        """
        Specific tests may want to allow input files to be "chunked" into smaller requests
        As each file is specific to a test, the chunking of that file is also specific to a test and needs to be done by each subclass
        """
        return request_body
    
    def get_args(self) -> argparse.Namespace:
        """
        Get command-line arguments.

        Returns:
            argparse.Namespace: A namespace of command line arguments
        """

        description = """
            description:
            The performance tests allow users to make requests in parallel to stress test an endpoint.
            The parallel requests can be a single file "chunked" into multiple requests, a single file POSTed many times, or a combintation of the two.
        """

        parser = ArgumentParser(
            description=description,
            formatter_class=RawDescriptionHelpFormatter
        )

        parser.add_argument(
            '--name',
            '-n',
            help="Name of the deployment."
        )
        
        parser.add_argument(
            '--requests',
            '-r',
            default=1,
            help="Number of parallel requests to make.  The default is 1."
        )

        parser.add_argument(
            '--users',
            '-u',
            default=1,
            help="Number of users per request."
        )
        
        parser.add_argument(
            '--file',
            '-f',
            default=self.get_default_input_file(),
            help="The fully qualified path of the file to use.  The default file is ./requests/" + self.DEFAULT_INPUT_FILE +"."
        )
        
        parser.add_argument(
            '--verbose',
            '-v',
            action='store_true',
            help="Print info about executing curl commands."
        )
        
        self.custom_args(parser)

        args = parser.parse_args()
        return args
    
    def custom_args(self, parser):
        """
        Defines additional cmd-line arguments appropriate to specific test
        The are defined in subclasses and not for every test file.
        """
        pass
    
    @abstractmethod
    def get_service_endpoint_url(self):
        """
        Defines the url of the POST request
        """
        pass
    
    @abstractmethod
    def get_default_input_file(self):
        """
        Defines the default inut file if one isn't specificed on the command line
        This goes in the ./requests directory.
        """
        pass
    