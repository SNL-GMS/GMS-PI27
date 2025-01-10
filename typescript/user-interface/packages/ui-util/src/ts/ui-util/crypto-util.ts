const HEX_BASE = 16;

/**
 * Creates a hex string representation of a SHA-256 hash. Uses crypto.subtle, which
 * requires that it be run in a {@link https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts secure context}, such as https or localhost.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest}
 *
 * @param message a string to hash
 * @returns a promise for the hashed string
 */
export async function digestMessageSHA256(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  return hashArray.map(b => b.toString(HEX_BASE).padStart(2, '0')).join(''); // convert bytes to hex string
}
