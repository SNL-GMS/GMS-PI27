from utils.validate_conda_environment import console
import json
import subprocess
import sys
import argparse
from argparse import ArgumentParser, RawDescriptionHelpFormatter
import requests

def run(command: str, print_output: bool = False) -> tuple[int, str, str]:
    """
    Execute the specified command and return when the execution is complete.

    Args:
        command (str): A shell command to run.
        print_output (bool, optional): Enable printing of stdout and stderr
            immediately. Defaults to False.

    Returns:
        tuple: Return code, stdout, and stderr of the command

    """
    cmd = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.PIPE
    )
    out, err = cmd.communicate(input=None)
    out = out.decode()
    err = err.decode()

    if print_output:
        print(out)
        if len(err) > 0:
            print(err)

    return cmd.returncode, out, err

def run_json_command(command):
    """
    Run a command that produces JSON output
    and return the result as a dictionary.
    """
    result = None
    try:
        cmd = subprocess.Popen(
            command.split(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE
        )
        out, err = cmd.communicate()
        out = out.decode()
        err = err.decode()

        if cmd.returncode != 0:
            print(
                f"ERROR: '{ command.split()[0] }' returned { cmd.returncode }."
            )
            print(out)
            console.out(f'[yellow]{err}')
            return None

        result = json.loads(out)
    except Exception as ex:
        print(ex)
        sys.exit(1)

    return result

def read_file_contents(file_name):  
    
    resp = ''
    with open(file_name, 'r') as f:
        line = f.read()         
        resp += line
      
    return json.loads(resp)

def execute_curl_commands(args, description, url, data):
    """
    Executes the curl command at the given url with the given data.

    Returns:
        response as utf-8 string format
    """
    default_headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    bad_curl_resps = dict()
    
    if args.verbose:
        console.log(
            f"[black]Executing the following curl command:\n"
            f"[magenta]url: {url}\n"
            f"[magenta]data: {data}"
        )      
        
    try:
        # note that we are only using the POST method for requests
        # GET methods are not supported
        resp = requests.post(
            url,
            headers=default_headers,
            data=json.dumps(data),
            timeout=30
        )        
       
        if args.verbose > 1:
            console.log(f"Response:")
            console.log(f"{resp.text}")

        resp.raise_for_status()

    # Handles bad urls, unsuccessful response codes, timeouts,
    # and connection errors
    except requests.exceptions.RequestException as err:
        bad_curl_resps[description] = err
        if args.verbose:
            print()

    # Print a list error messages for commands that didn't
    # return a successful response code
    if bad_curl_resps:
        console.log(
            "[bold red]The following curl commands did not execute "
            "as anticipated."
        )
        for description, err in bad_curl_resps.items():
            console.log(f"[magenta]{description}: [red]{err}")
    elif args.verbose:
        console.log(
            "[green]All curl commands successfully executed "
            "and returned a valid response."
        )
    
    content = resp.content.decode('utf-8')    
    return content
