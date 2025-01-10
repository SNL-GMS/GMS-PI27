# GMS Common - Java

## Description
This directory represents the entirety of all common GMS java code, configured as a gradle multi-project build.

## How To Run
This project uses gradle as its build system, with two options of running

1. Using the Gradle Wrapper via `gradlew` (Recommended). The wrapper can be ran either per-subproject (`java/gms/` or `java/test-tools`) at the root level via `./gradlew`, or configured in your environment by adding `gms-common/bin/` to your PATH
2. Using a locally installed Gradle via `gradle` (If using this option, substitute all subsequent `gradlew` references in commands with `gradle`)

Given the multi-project build structure, certain gradle tasks can be run at the root level of either `gms/` or `test-tools/` projects to build and test
the entire project. All example commands can be run from the **java/gms** or **java/test-tools/** directory.

`gradlew build` - builds and tests the entire project, leveraging the gradle build cache where appropriate

`gradlew test` - runs all tests, ignoring the cache

`gradlew componentTest` - runs all component tests

`gradlew docker` - builds all java application/spring boot images (**NOTE**: see docker documentation for details on
proper environment setup to run this task)

Subprojects can be run individually using gradle's syntax

`gradlew :subproject:build` - builds the subproject named `subproject`

To see all available tasks for a subproject, run `gradle :subproject:tasks`

## Version Locking
GMS Java projects now incorporate version locking to ensure repeatable builds.
Each subproject will contain its own lock file representing all versions of all dependencies, including
transitive dependencies.

To update lock files, use the `--write-locks` option when running a task that resolves configuration for a project.
The simplest task to run for a subproject would be `dependencies`:

`gradlew :subproject:dependencies --write-locks`

But in order to update all locks, the `allDependencies` task should be run, as `dependencies` does not work as expected
at the root level:

`gradlew allDependencies --write-locks`

## Spring Profiles
GMS supports the use of Spring profiles to modify runtime behavior.  The currently supported list of profiles is below
- timing

To activate a profile, the environment variable needs to be set on the command line, like so:\
`
gmskube install --tag develop --set event-manager-service.env.SPRING_PROFILES_ACTIVE=timing --type ian <deployment>
`