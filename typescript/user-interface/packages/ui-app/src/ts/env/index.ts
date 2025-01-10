const ENV: Record<string, string> = Object.freeze((window as any).ENV);

/**
 * Used to determine if an environment variable is not set
 *
 * @param envVar to be tested
 * @returns true when no value is set
 */
export function isNotSet(envVar: string) {
  return (
    envVar === 'undefined' ||
    envVar === undefined ||
    envVar === null ||
    envVar === 'null' ||
    envVar.length === 0
  );
}

const GMS_KEYCLOAK = Object.freeze({
  GMS_KEYCLOAK_REALM: ENV?.GMS_KEYCLOAK_REALM,
  GMS_KEYCLOAK_URL: ENV?.GMS_KEYCLOAK_URL,
  GMS_KEYCLOAK_CLIENT_ID: ENV?.GMS_KEYCLOAK_CLIENT_ID,
  GMS_DISABLE_KEYCLOAK_AUTH: ENV?.GMS_DISABLE_KEYCLOAK_AUTH === 'true'
});

export const {
  GMS_KEYCLOAK_REALM,
  GMS_KEYCLOAK_URL,
  GMS_KEYCLOAK_CLIENT_ID,
  GMS_DISABLE_KEYCLOAK_AUTH
} = GMS_KEYCLOAK;
