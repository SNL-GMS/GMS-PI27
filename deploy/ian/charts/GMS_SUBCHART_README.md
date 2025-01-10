# IAN Sub-charts
* Common is a symbolically linked sub-charts. See the readme files for more details.
* Augmentation are add-ons for testing/debugging that can optionally be enabled.
* Kafka is the a subchart for bitnami Kafka. All configuration kafka should occur
  in the main `values.yaml` file in IAN. No customizations should be made here unless
  absolutely necessary. The goal is that these charts can be upgraded directly from
  the internet with no modifications.

  However, there are some cases where modifications are necessary. These changes should be detailed below
  so they can be reproduced when upgrading the chart:
  * kafka
    * charts/zookeeper - deleted, it is not used in kraft mode
    * README.md - content replaced with a link due to fortify finding
    * templates/NOTES.txt - delete due to fortify finding
    * values.yaml
      * Delete the value of the following yaml keys due to fortify findings:
        * passwordsSecretKeystoreKey - line 313
        * passwordsSecretTruststoreKey - line 316
        * passwordsSecretKeystoreKey - line 377
        * passwordsSecretTruststoreKey - line 381
        * keyPasswordSecretKey - line 2174
        * keystorePasswordSecretKey - line 2178
        * truststorePasswordSecretKey - line 2182