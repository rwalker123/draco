# Build Integration Checklist

This guide outlines the required artifacts and packaging steps for distributing
Draco product builds.

## Required Artifacts

- Compiled application binaries or container images for the target environment.
- Environment-specific configuration files (for example, `.env.production`).
- Database migration bundles generated from the `dbMigration` workspace when
  applicable.
- Proprietary end-user license agreement located at
  `LICENSES/PROPRIETARY_LICENSE.txt`.

## Packaging Steps

1. Run the workspace build command appropriate for the release target.
2. Collect the generated build artifacts alongside the required configuration
   files listed above.
3. Copy `LICENSES/PROPRIETARY_LICENSE.txt` into the root of the distribution
   package so the installer or release bundle ships with the EULA.
4. Update any installer scripts to display or link to the EULA during the
   installation flow.
5. Archive the final distribution package and confirm checksum and signing steps
   per the release checklist.

## Verification

Before shipping a build:

- Validate that the package includes the proprietary license file in the
  expected path.
- Smoke test the installation to ensure the EULA is presented to the user during
  setup.
- Record the build ID, checksum, and license version in the release notes.
