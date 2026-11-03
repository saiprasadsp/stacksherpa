import re

# Keep signatures small and explainable. Extend this list as you learn.
SIGNALS = [
    (r"connection pool exhausted|too many connections", "Database connection pool exhausted", "high"),
    (r"database connection timeout|db timeout", "Database connection timeout", "high"),
    (r"\bstatus[=: ]+500\b|internal server error", "HTTP 500 server error", "high"),
    (r"\b401\b|unauthorized|invalid token|jwt.*expired", "Authentication failure", "medium"),
    (r"\b429\b|rate limit|too many requests", "Rate limiting", "medium"),
    (r"connection refused|upstream.*unavailable", "Upstream service unavailable", "high"),
    (r"cors.*blocked|cross.origin", "Possible CORS configuration issue", "low"),
    (r"\b404\b|not found", "Resource or route not found", "low"),
]

RECOMMENDATIONS = {
    "Database connection pool exhausted": [
        "Inspect active and idle database connections.",
        "Check pool maximum, acquisition timeout, and connection release paths.",
        "Look for slow queries or requests holding connections for too long.",
    ],
    "Database connection timeout": [
        "Verify database reachability and current latency.",
        "Inspect database saturation, network errors, and timeout settings.",
    ],
    "HTTP 500 server error": [
        "Correlate the failing request with its application stack trace.",
        "Check recent deployments and dependency failures.",
    ],
    "Authentication failure": [
        "Check token expiry, issuer, audience, signing key, and server clock.",
        "Confirm the client is sending the expected Authorization header.",
    ],
    "Rate limiting": [
        "Inspect rate-limit policy and request volume by client or user.",
        "Check whether retry logic uses exponential backoff.",
    ],
    "Upstream service unavailable": [
        "Check upstream health, DNS, network policy, and service endpoints.",
        "Inspect retry and circuit-breaker behavior.",
    ],
    "Possible CORS configuration issue": [
        "Verify allowed origins, methods, and headers on the API.",
        "Check whether preflight OPTIONS requests are handled correctly.",
    ],
    "Resource or route not found": [
        "Verify the request path, API version, and route registration.",
        "Check whether the resource identifier exists.",
    ],
}


def analyze_logs(logs: str) -> dict:
    lowered = logs.lower()
    detected = []
    highest = "low"

    for pattern, label, severity in SIGNALS:
        if re.search(pattern, lowered):
            detected.append(label)
            if severity == "high":
                highest = "high"
            elif severity == "medium" and highest == "low":
                highest = "medium"

    if not detected:
        summary = "No known failure signature was detected. Review the surrounding log context and timestamps."
        recommendations = [
            "Check timestamps and correlate entries using a request or trace ID.",
            "Compare the failing request with a successful request.",
            "Add structured error details if the failure is not logged clearly.",
        ]
    else:
        summary = "Detected: " + ", ".join(detected) + "."
        recommendations = []
        for signal in detected:
            recommendations.extend(RECOMMENDATIONS[signal])
        # Preserve order while removing duplicate recommendations.
        recommendations = list(dict.fromkeys(recommendations))

    return {
        "severity": highest,
        "summary": summary,
        "signals": detected,
        "recommendations": recommendations[:6],
    }
