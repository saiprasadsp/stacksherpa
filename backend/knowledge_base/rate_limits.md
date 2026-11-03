# API rate limiting and upstream failures

## HTTP 429 Too Many Requests

A 429 response indicates that a rate limit was applied. Inspect the configured limit,
time window, client identity, and request volume. Check whether multiple application
instances share rate-limit state.

Clients should respect `Retry-After` when provided and use exponential backoff with
jitter. Avoid retry loops that amplify traffic during an incident.

## Upstream service unavailable

For connection refused or upstream unavailable errors, check service health, DNS,
network policies, endpoint configuration, and load balancer targets. Inspect retry
and circuit-breaker behavior. Correlate the downstream error with upstream timestamps.
