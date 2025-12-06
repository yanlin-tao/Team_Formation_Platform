from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", type=int, default=3306)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path("data/post.csv"),
        help="Path to the CSV file with post data (default: data/post.csv)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        import mysql.connector
    except ModuleNotFoundError as exc:
        print(
            "mysql-connector-python is required. Install it via: pip install mysql-connector-python",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    if not args.csv.exists():
        print(f"CSV file not found: {args.csv}", file=sys.stderr)
        return 1

    connection = mysql.connector.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        database=args.database,
        autocommit=False,
    )
    with connection.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT team_id FROM Team")
        team_ids = {int(row["team_id"]) for row in cursor.fetchall()}

    with args.csv.open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)

    valid_rows = []
    skipped = []
    for row in rows:
        try:
            team_id = int(row["team_id"])
        except (TypeError, ValueError):
            skipped.append((row["post_id"], row["team_id"], "invalid team_id"))
            continue
        if team_id not in team_ids:
            skipped.append((row["post_id"], team_id, "team missing"))
            continue
        valid_rows.append(row)

    upsert_sql = (
        "INSERT INTO Post (post_id, user_id, team_id, title, content, created_at, updated_at) "
        "VALUES (%(post_id)s, %(user_id)s, %(team_id)s, %(title)s, %(content)s, %(created_at)s, %(updated_at)s) "
        "ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), "
        "created_at = VALUES(created_at), updated_at = VALUES(updated_at)"
    )

    with connection.cursor() as cursor:
        if valid_rows:
            cursor.executemany(upsert_sql, valid_rows)

    connection.commit()
    connection.close()

    print(f"Upserted {len(valid_rows)} posts from {args.csv}")
    if skipped:
        print(f"Skipped {len(skipped)} rows due to missing/invalid team_id")
        for entry in skipped[:10]:
            print("  post_id={0} team_id={1} reason={2}".format(*entry))
        if len(skipped) > 10:
            print("  ...")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
