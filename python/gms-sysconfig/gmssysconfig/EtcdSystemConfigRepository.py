import os
import sys

import etcd3

ETCD_PUT_LOCK_NAME = 'put_lock'


class EtcdSystemConfigRepository:
    "Etcd GMS System Configuration Repository"

    def __init__(
        self,
        endpoints: str | None = None,
        username: str | None = None,
        password: str | None = None,
        verbose: bool = False
    ) -> None:
        # If no endpoints were specified, get them from our environment
        self.endpoints = (
            endpoints if endpoints
            else os.getenv('GMS_ETCD_ENDPOINTS', 'etcd:2379')
        )  # yapf: disable
        self.username = username if username else os.getenv('ETCD_GMS_USER')
        self.password = (
            password if password else os.getenv('ETCD_GMS_PASSWORD')
        )  # known pw for read-only access
        self.verbose = verbose

        if not self.username:
            raise ValueError("No etcd user specified.")

        if not self.password:
            raise ValueError("No etcd password specified.")

        if not self.endpoints:
            raise ValueError(
                "No etcd endpoints specified for GmsSystemConfig."
            )

        # Etcd supports an endpoint of the form '127.0.0.1:4001,127.0.0.1:4002'
        #
        # However, since the etcd3 Python client only supports a
        # single hostname and port, so we want to split off the first
        # hostname and port.
        first_endpoint = self.endpoints.split(',')[0]
        if ':' in first_endpoint:
            self.hostname, self.port = first_endpoint.split(':')
        else:
            # If there's no port, just assume the default port...
            self.hostname = first_endpoint
            self.port = 2379

        if self.verbose:
            print(
                "... [etcd] connecting to server on "
                f"'{self.hostname}:{self.port}'",
                end=''
            )
            if self.username:
                print(f" as user '{self.username}'", end='')
            print(" ...")

        try:
            # GRPC complains about the format of our proxy environment
            # variable (even if empty). So even though it is unused,
            # we will unset it
            for v in ['http_proxy', 'HTTP_PROXY']:
                os.environ.pop(v, None)

            self.etcd = etcd3.client(
                host=self.hostname,
                port=self.port,
                user=self.username,
                password=self.password,
                grpc_options={'grpc.enable_http_proxy': 0}.items()
            )
        except Exception as e:
            print(
                "Central system configuration unreachable at endpoint "
                f"'{self.endpoints}': " + str(e)
            )
            self.etcd = None

    def get(self, key: str) -> str | None:
        "Return the value from etcd for the specified key, or None if key "
        "is not present."
        if not self.etcd:
            return None
        try:
            if self.verbose:
                print(f"... [etcd] looking for {key}")
            value = self.etcd.get(key)
            if self.verbose:
                print(f"... [etcd] found {key} = {value}")
            return str(value[0], 'utf-8')
        except Exception:
            return None

    def set(self, key: str, value: str) -> None:
        "Set a new value in etcd for the specified key."
        if self.verbose:
            print(f"... [etcd] setting {key} to {value}")
        with self.etcd.lock(name=ETCD_PUT_LOCK_NAME, ttl=30):
            value = self.etcd.put(key, value)

    def delete(self, key: str) -> None:
        "Delete the given key from etcd."
        with self.etcd.lock(name=ETCD_PUT_LOCK_NAME, ttl=30):
            if self.verbose:
                print(f"... [etcd] deleting {key}")
            self.etcd.delete(key)

    def load(self, values: dict[str, str], clear: bool = False) -> None:
        """
        Import a dictionary of key-value pairs into etcd, optionally clearing
        existing values before importing.
        """
        if not self.etcd:
            print(
                "WARNING: Central configuration repository unavailable at "
                f"endpoint '{self.endpoints}': "
            )
            return
        try:
            # 1. Acquire lock (to ensure no one else is setting values
            #     at the same time).
            # 2. Create an empty transaction.
            # 3. If clearing, add delete commands for all existing keys to
            #     the transaction.
            # 4. Add all key=value pairs to the transaction.
            # 5. Commit the transaction
            # 6. Release the lock.
            with self.etcd.lock(name=ETCD_PUT_LOCK_NAME, ttl=30):

                if clear:
                    clear_transaction = []
                    for (value_bytes, metadata) in self.etcd.get_all():
                        key = str(metadata.key, 'utf-8')
                        # ignore any lock keys
                        if not key.startswith("/locks"):
                            if self.verbose:
                                print(f"... [etcd] clearing '{key}'")
                            clear_transaction.append(
                                self.etcd.transactions.delete(key)
                            )
                    self.etcd.transaction(
                        compare=[],
                        success=clear_transaction,
                        failure=[]
                    )

                # Add keys one at a time to avoid transaction limit
                for key in values:
                    transaction = []
                    value = values[key].data
                    if self.verbose:
                        print(f"... [etcd] setting '{key}' = '{value}'")
                    transaction.append(self.etcd.transactions.put(key, value))
                    self.etcd.transaction(
                        compare=[],
                        success=transaction,
                        failure=[]
                    )

        except Exception as e:
            print(
                "FATAL: Central configuration repository unavailable at "
                f"endpoint '{self.endpoints}': " + str(e)
            )
            sys.exit(1)

    def export(self) -> dict[str, str]:
        "Export key-value pairs from etcd to a dictionary"
        values = {}
        if not self.etcd:
            print(
                "WARNING: Central configuration repository unavailable at "
                f"endpoint '{self.endpoints}': "
            )
            return values
        try:
            for (value_bytes, metadata) in self.etcd.get_all():
                key = str(metadata.key, 'utf-8')
                value = str(value_bytes, 'utf-8')
                if self.verbose:
                    print(f"... [etcd] found '{key}' = '{value}'")
                values[key] = value
        except Exception as e:
            print(
                "WARNING: Central configuration repository unavailable at "
                f"endpoint '{self.endpoints}': " + str(e)
            )

        return values
