#!/bin/bash

if [ $# -eq 0 ]; then
    echo "usage: entrypoint.sh etcd [options]"
    exit 1
fi

#-- start our entrypoint but ONLY respond to localhost
ETCD_LISTEN_CLIENT_URLS=http://127.0.0.1:2379 $@ &
pid=$!

#-- wait for etcd to report as healthy
while : ; do
    # check with both old and new passwords
    etcdctl endpoint health --user "gms:6a4cf2f3861802c528882cf818a468bcb89adae8" 2> /dev/null 1> /dev/null
    if [ $? -eq 0 ]; then
       break
    fi
    etcdctl endpoint health --user "${GMS_ETCD_USER}:${GMS_ETCD_PASSWORD}" 2> /dev/null 1> /dev/null
    if [ $? -eq 0 ]; then
       break
    fi
    echo "############################ | waiting for etcd to start..."
    sleep 1
done

#-- update default passwords (if they have not been updated yet)
etcdctl endpoint health --user "${GMS_ETCD_USER}:${GMS_ETCD_PASSWORD}" 2> /dev/null 1> /dev/null
if [ $? -ne 0 ]; then
    echo "############################ | updating passwords..."
    echo ${GMS_ETCD_PASSWORD} | etcdctl user passwd --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550" ${GMS_ETCD_USER} --interactive=false
    echo ${GMS_ETCD_ADMIN_PASSWORD} | etcdctl user passwd --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550" ${GMS_ETCD_ADMIN_USER} --interactive=false
    echo ${GMS_ETCD_ROOT_PASSWORD} | etcdctl user passwd --user "root:714b84391f4c6d67eba1baab028e8b7479cbd550" root --interactive=false
fi

#-- stop the now-configured etcd and restart so external clients can connect
kill ${pid}
wait ${pid}

#-- hand off to our entrypoint
echo "############################ | restarting etcd..."
exec $@
