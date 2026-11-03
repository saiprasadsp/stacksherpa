# Authentication troubleshooting

## HTTP 401 and expired JWT

A 401 response means the request was not accepted as authenticated. Check:
- Whether the Authorization header is present and uses the expected Bearer format.
- Token expiration (`exp`) and server clock synchronization.
- Token issuer (`iss`) and audience (`aud`).
- Signing algorithm and key rotation configuration.
- Whether the client is reusing an expired token instead of refreshing it.

Do not paste live access tokens into incident tickets or AI tools. Use redacted claims
and request IDs for investigation.

## Login endpoint returns HTTP 500

A 500 response indicates an unexpected server-side failure, not necessarily an invalid
password. Correlate the request ID with the application stack trace. Check database
connectivity, identity-provider availability, recent deployments, and dependency errors.
Avoid logging passwords, session cookies, or raw tokens.
