# Database connection troubleshooting

## Connection pool exhaustion

Symptoms include messages such as `connection pool exhausted`, requests waiting for a
connection, and API latency increasing under load.

Investigate:
- Compare active, idle, and maximum pool connections.
- Check that every acquired connection is returned or closed in a `finally` block.
- Look for slow queries and transactions that remain open.
- Review pool acquisition timeout and maximum pool size.
- Confirm the database itself has not reached its connection limit.

Do not blindly increase the pool size. First establish whether connections are leaked,
held too long, or blocked by slow database work.

## Database connection timeout

A connection timeout can be caused by database saturation, network latency, DNS,
firewall rules, exhausted connection pools, or an overly aggressive timeout.

Investigate database health and network reachability from the application environment.
Compare application timestamps with database metrics. Check whether the issue started
after a deployment or infrastructure change.
