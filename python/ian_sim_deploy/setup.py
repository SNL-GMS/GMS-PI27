from setuptools import setup

setup(
    name="ian_sim_deploy",
    version="0.1.0",
    description=(
        "A script to stand up and interact with IAN instances of GMS that "
        "have a simulator augmentation running."
    ),
    packages=["ian_sim_deploy"],
    scripts=[],
    python_requires=">=3.10",
    tests_require=["pytest"],
    install_requires=["requests",
                      "reverse-argparse",
                      "rich",
                      "tenacity"]
)
