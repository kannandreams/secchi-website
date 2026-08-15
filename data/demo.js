// Real command output, captured by running the actual tools on
// 2026-08-14. Do not invent or edit numbers here — re-capture instead:
//   package signals: `uv run secchi show duckdb` in the secchi repo
//   cli analytics: run `secchi-analytics` a few times, then
//   `secchi-analytics stats --since 7d` and `secchi-analytics tail -n 6`
// (the analytics capture is the tool recording its own invocations).

window.SECCHI_DEMOS = {
  pkg: {
    command: "secchi show duckdb",
    lines: [
      "duckdb",
      "────────────────────",
      "Health Score      89 / 100",
      "Latest Version    1.5.5",
      "Downloads         ▲ 19.1%",
      "GitHub Stars      177",
      "Dependents        —",
      "Security Advisories 0",
    ],
  },
  cli: {
    command: "secchi-analytics stats --since 7d",
    lines: [
      "9 invocation(s), 0 failure(s) in the last 7d",
      "",
      "COMMAND                      INVOCATIONS    AVG MS    P95 MS  FAILURES",
      "status                                 3         0         0         0",
      "stats                                  2        18        20         0",
      "tail                                   2        48        78         0",
      "compact                                1         9         9         0",
      "init                                   1         2         2         0",
    ],
    command2: "secchi-analytics tail -n 4",
    lines2: [
      "2026-08-14 22:39:48  secchi-analytics.stats.completed         exit   0    14ms  agent",
      "2026-08-14 22:39:48  secchi-analytics.status.completed        exit   0     0ms  agent",
      "2026-08-14 22:39:48  secchi-analytics.stats.completed         exit   0    15ms  agent",
      "2026-08-14 22:39:48  secchi-analytics.tail.completed          exit   0    15ms  agent",
    ],
  },
};
