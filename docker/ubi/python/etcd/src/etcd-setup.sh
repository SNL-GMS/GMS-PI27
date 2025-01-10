#!/bin/bash

# This script is run to set up etcd

set -eu

#-- Start etcd temporarily for configuration and loading
etcd &
etcdpid=$!

#-- Wait for etcd to fully initialize
until etcdctl endpoint health; do
    sleep 1
done

#-- Add 'root' user and enable authentication
etcdctl user add "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl auth enable

#-- Setup 'read-everything' and 'readwrite-everything' roles
etcdctl role add read-everything --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl role add readwrite-everything --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl role grant-permission --prefix read-everything read '' --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl role grant-permission --prefix readwrite-everything readwrite '' --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"

#-- Setup 'gmsadmin' user 
etcdctl user add "gmsadmin:7e99ddf6568c334dc8548f4183f4387461e1e26b" --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl user grant-role gmsadmin readwrite-everything --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"

#-- Load configuration as 'gmsadmin'
gms-sysconfig --username gmsadmin --password "7e99ddf6568c334dc8548f4183f4387461e1e26b" --endpoints localhost load /setup/config/system/gms-system-configuration.properties

#-- Setup 'gms' user
etcdctl --dial-timeout=6s user add "gms:6a4cf2f3861802c528882cf818a468bcb89adae8" --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
etcdctl --dial-timeout=6s user grant-role gms read-everything --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550"
sleep 1

#-- Stop the now-configured etcd
kill ${etcdpid}


