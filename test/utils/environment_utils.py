import sys
import os
import shutil
import yaml
import re
from collections import defaultdict
from datetime import datetime, timedelta 
from utils.test_utils import run, run_json_command 

def validate_environment(instance_name):
    """
    Ensure we are connected to a kubernetes cluster 'kubconfig <cluster_name>
    and that a valid instance is running as passed in by `--name <instance_name>'
    
    Also determines if we are connected to a simulator or seed determine and retrieves the appropriate start/end times for deployment
    """
    validate_kubernetes()
    pods = validate_instance(instance_name)
    data_times = determine_instance_times(pods)
    return data_times     
    
def validate_kubernetes():
    """
    Ensure we are connected to a kubernetes cluster 'kubconfig <cluster_name>
    """
     # -- verify kubectl is available
    if shutil.which('kubectl') is None:
        print(
            "ERROR: 'kubectl' executable not found in PATH."
            "Please install kubectl."
        )
        sys.exit(1)

    # -- verify helm is available
    if shutil.which('gmskube') is None:
        print(
            "ERROR: 'gmskube' executable not found in PATH."
            "Please install gmskube."
        )
        sys.exit(1)

    # -- verify KUBECONFIG is set
    if "KUBECONFIG" not in os.environ:
        print(
            "ERROR: Variable 'KUBECONFIG' must be set to "
            "the kubernetes configuration."
        )
        sys.exit(1)

    if ":" in os.environ["KUBECONFIG"]:
        msg = (
            "It looks like your `KUBECONFIG` environment variable points "
            "to multiple configuration files.  Ensure you run `kubeconfig "
            "<cluster_name>` to activate a particular cluster, and then "
            "re-run this script."
        )
        raise SystemExit(msg)
    
    try:
        with open(os.environ["KUBECONFIG"]) as file:
            kubeconfig = yaml.load(file, Loader=yaml.FullLoader)
            if 'clusters' not in kubeconfig:
                print(
                    "ERROR: No clusters defined in file "
                    f"'{os.environ['KUBECONFIG']}"
                )
                sys.exit(1)

    except FileNotFoundError as e:
        print(
            "ERROR: Failed to open KUBECONFIG file "
            f"'{os.environ['KUBECONFIG']}': {e}"
        )
        sys.exit(1)
    except AttributeError as e:
        print(f"ERROR: {e.__class__.__name__}: {e}")
        print(
            "Did you forget to activate the 'gms' conda environment "
            "with 'conda activate gms'?"
        )
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e.__class__.__name__}: {e}")
        sys.exit(1)

def validate_instance(instance_name):
    """
    Ensure a valid instance is running as passed in by `--name <instance_name>'
    """
    instance = get_instance_info(instance_name)

    if not instance:
        raise Exception(f"{ instance_name } instance not found.")

    pods = get_pod_info(instance)
    return pods
    
def determine_instance_times(pods):
    """
    Determines if we are connected to a simulator or seed determine and retrieves the appropriate start/end times for those deployments
    
    Returns:
        appropriate start/end times for deployment
    """    
    simulator_installed = is_simulator_installed(pods)
    
    if simulator_installed:
        data_times = set_simulated_times()
    else:
        data_times = set_fixed_times()
    return data_times          
    
def get_instance_info(name):
    """
    Gather a dictionary of information about a named instance.    
    """
    summary = run_json_command(f"helm list --all -n { name } --output json")

    if not summary:
        return None

    instance = {}
    instance['name'] = summary[0]['name']
    instance['status'] = summary[0]['status']
    instance['updated'] = summary[0]['updated']

    return instance
        
def get_ingress_domain_url(instance_name: str) -> str:
    """
    Use ``gmskube ingress`` to get the ingress URL for the
    ``user-manager-service``, which is common to various instance types.

    Args:
        instance_name:  The name of the instance.

    Raises:
        RuntimeError:  If something goes wrong with ``gmskube ingress``.

    Returns:
        Returns the URL through the port (which is appended to domain
        via ":<port_number>"), stripping off anything following
    """

    ingress_url = ""
    _, out, _ = run(f"gmskube ingress {instance_name}")

    for line in out.splitlines():
        if "user-manager-service" in line:
            ingress_url = line.split()[1]

    if ingress_url == "":
        raise RuntimeError(
            "Unable to get the ingress URL for the "
            "`user-manager-service`."
        )

    return re.search(r"^(https://.*:.*)/.*$", ingress_url).group(1)

def get_pod_info(instance):
    """
    Gather a dictionary of running pods for the given instance name.
    """

    rc, out, err = run(f"kubectl get pods -n {instance['name']} --no-headers")

    if rc != 0:
        print("   ----------ERROR getting pods ----------")
    else:
        pods = defaultdict(list)
        for line in out.splitlines():
            columns = line.split()
            deployment_name = columns[0].rsplit('-', 2)[0]
            pod = {}
            pod['deployment_name'] = deployment_name
            pod['name'] = columns[0]
            pod['ready'] = columns[1]
            pod['status'] = columns[2]
            pod['restarts'] = columns[3]
            pod['age'] = columns[4]
            pods[deployment_name].append(pod)

    return pods

def is_simulator_installed(pods) -> 'bool':
    """
    Check if simulator is installed in instance
    """

    if 'bridged-data-source-simulator' in pods and 'oracle' in pods:
        return True
    else:
        return False

def set_simulated_times():
    """
    Set start/end/creation/effective times to work with
    simulator time range requirements
    
    Returns:
        valid start/end time for simulated deployment
    """

    simulated_times = {}

    # Note: When a simulator is initialized,
    #   the start time defaults to 8 hours in
    #       the past from the last even hour in UTC.
    #       Set the start time below to 8 hrs in the past.
    new_start_time = (datetime.utcnow() - timedelta(hours=8))
    start_time = new_start_time.strftime('%Y-%m-%dT%H:00:00Z')

    # Set the end time below to 6 hrs in the past so that the interval between
    # start and end time is 2 hrs.
    new_end_time = datetime.utcnow() - timedelta(hours=6)
    end_time = new_end_time.strftime('%Y-%m-%dT%H:00:00Z')

    creation_time = start_time
    effective_time = start_time

    simulated_times['start_time'] = start_time
    simulated_times['end_time'] = end_time
    simulated_times['creation_time'] = creation_time
    simulated_times['effective_time'] = effective_time

    return simulated_times

def set_fixed_times():
    """
    Set start/end/creation/effective times to fixed
    values to work when simulator is not installed
    
    Returns:
        valid start/end time for seed deployment
    """

    # Note:  SME says "If you’re not running a simulator,
    #          you could use any time on 2019-01-05.
    #   For start and end times, it’s really dependent on the curl.
    #   For curls that return a ton of data (e.g., events)
    #     you’d want to use a very short time period.
    #   For curls that return only a little data (e.g., intervals )
    #     you can use the entire day."

    fixed_times = {}

    start_time = "2019-01-05T02:00:00Z"

    # set end_time to 2 hrs after start_time
    end_time = "2019-01-05T04:00:00Z"

    # set short_end_time to 1 min after start_time
    # short_end_time = "2019-01-05T04:01:00Z"

    creation_time = start_time
    effective_time = start_time

    fixed_times['start_time'] = start_time
    fixed_times['end_time'] = end_time
    fixed_times['creation_time'] = creation_time
    fixed_times['effective_time'] = effective_time

    return fixed_times