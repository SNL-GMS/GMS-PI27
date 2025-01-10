# Command-Line Utilities

The following GMS (Geophysical Monitoring System) command-line
utilities are [available here](../bin):

* [**gmskube**](#gmskube): Manage running instances of the GMS system on a Kubernetes cluster

## gmskube

The **gmskube** command-line program is used to install and configure
*instances* of the GMS (Geophysical Monitoring System) system on
Kubernetes.

Each *instance* is an install of a multi-container application that is
managed as a single unit and runs on a Kubernetes cluster. Each
instance is contained within its own namespace in Kubernetes. Various
predefined types of instances are available. Some example instance types
would be **ian** or **logging**.

Multiple copies of instances may be run simultaneously. Each instance must be
given a unique name to identify it as well as distinguish it from other running
instances of the same type. For example, one instance of **ian** may be running
as 'ian-develop' while another instance of **ian** may be running as
'ian-integration'.

Different versions of a instance type may be available from the configured
Docker registry. Released versions of GMS are tagged with a specific version
number.

#### Configuration
Before you can run **gmskube**, there are some configuration steps you must
apply.

1. Confirm that **kubectl** is installed<br>
   If it is not installed, download and install it
2. Confirm that **docker** is installed<br>
   If it is not installed, download and install it
3. Confirm that your **.bashrc** file is sourcing \<full-path-to-gms-common\>/.bash_env
4. Confirm that the following environment variable is set<br>
   **CI_DOCKER_REGISTRY**:  should be set to the fully qualified domain name of
   your remote docker registry
5. Download a **Kubeconfig bundle** from the cluster and have the kubectl
   context set to the correct cluster.  **Note**:  The example provided below
   if for a Rancher Kubernetes cluster but these instructions could be
   generalized for any Kubernetes cluster.

   - Login to Rancher
   - Click the cluster name
   - In the upper right, click the blue Kubeconfig File button
   - Copy/Paste the contents into ~/.kube/\<cluster-name\>.config on your development machine
   - If you have kubectl installed, the KUBECONFIG environment variable should
     already be set.  If not, set KUBECONFIG=~/config
6. Connect to your cluster<br>
   ```bash
   kubeconfig <cluster-name>

   # Confirm you are connected
   kubeconfig

   # You should see an asterisk next to your cluster name
   ```
7. Confirm that a **Default Storage Class** is defined
   ```bash
   kubectl get storageclass

   # Confirm that the output shows **(default)** next to one of your storage classes.
   # This is the storage class that will be used for persistent storage when not
   # explicitly specified. Default storage class can be set in the Rancher interface.
   ```
8. Create and Configure the cluster-wide objects for gms
   Prior to using `gmskube` to deploy GMS applications, you  must initialize the cluster-wide
   objects.

   1. Create a copy of `deploy/gms/example-values.yaml` into a temporary location, such as `/tmp/cluster-values.yaml`
      ```bash
      # Copy the values file
      cp deploy/gms/example-values.yaml /tmp/cluster-values.yaml
      ```
   2. Edit `/tmp/cluster-values.yaml` and fill out all fields according to the comments in the file.
   3. Save `/tmp/cluster-values.yaml`
   4. Identify location of the oracle wallet for the standalone database. The path will be used below.
   5. Initialize the cluster
      ```bash
      # Use gmskube to init the cluster
      gmskube cluster init --values /tmp/cluster-values.yaml --wallet-path /path/to/oracle-wallet
      ```

9. **OPTIONAL** Install Helm<br>
   Installing Helm is not required (it is built into the container run by the
   gmskube script) but having it installed can help with troubleshooting.

#### Subcommands

Once you have completed the **requirements for gmskube** you can begin using it to
deploy GMS instances.  The command line interface is well documented.  Note that
you can obtain help for each level of commands.
* **gmskube --help** <br>
  List all available gmskube commands.
  ```bash
  gmskube --help
  ```

* **gmskube <command> --help** <br>
  List help for individual commands
  ```bash
  gmskube install --help
  gmskube upgrade --help
  gmskube uninstall --help
  gmskube reconfig --help
  gmskube list --help
  gmskube augment --help
  gmskube ingress --help
  ```
