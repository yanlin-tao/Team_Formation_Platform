#!/usr/bin/env python3

import csv
import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    "host": "34.172.159.62",
    "port": 3306,
    "user": "admin",
    "password": "CS411sqlmaster@",
    "database": "CS411-teamup",
}


def connect_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("✓ Successfully connected to database")
        return conn
    except Error as e:
        print(f"✗ Error connecting to database: {e}")
        return None


def import_posts(cursor, conn, csv_file):
    print(f"\n--- Importing Posts from {csv_file} ---")

    posts = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            post = {
                "post_id": int(row["post_id"]),
                "user_id": int(row["user_id"]),
                "team_id": int(row["team_id"]),
                "title": row["title"][:128] if row["title"] else None,
                "content": row["content"][:4000] if row["content"] else None,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            posts.append(post)

    print(f"Total posts to insert: {len(posts)}")

    insert_query = """
        INSERT INTO Post (post_id, user_id, team_id, title, content, created_at, updated_at)
        VALUES (%(post_id)s, %(user_id)s, %(team_id)s, %(title)s, %(content)s, %(created_at)s, %(updated_at)s)
        ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            team_id = VALUES(team_id),
            title = VALUES(title),
            content = VALUES(content),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)
    """

    inserted = 0
    skipped = 0

    for post in posts:
        try:
            cursor.execute(insert_query, post)
            inserted += 1
        except Error as e:
            if "Duplicate entry" not in str(e):
                print(f"Error inserting post {post['post_id']}: {e}")
            skipped += 1

    conn.commit()
    print(f"✓ Inserted: {inserted}, Skipped: {skipped}")


def import_comments(cursor, conn, csv_file):
    print(f"\n--- Importing Comments from {csv_file} ---")

    comments = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            comment = {
                "comment_id": int(row["comment_id"]),
                "post_id": int(row["post_id"]),
                "user_id": int(row["user_id"]),
                "parent_comment_id": (
                    int(row["parent_comment_id"]) if row["parent_comment_id"] else None
                ),
                "content": row["content"][:2000] if row["content"] else None,
                "status": row["status"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            comments.append(comment)

    print(f"Total comments to insert: {len(comments)}")

    insert_query = """
        INSERT INTO Comment (comment_id, post_id, user_id, parent_comment_id, content, status, created_at, updated_at)
        VALUES (%(comment_id)s, %(post_id)s, %(user_id)s, %(parent_comment_id)s, %(content)s, %(status)s, %(created_at)s, %(updated_at)s)
        ON DUPLICATE KEY UPDATE
            post_id = VALUES(post_id),
            user_id = VALUES(user_id),
            parent_comment_id = VALUES(parent_comment_id),
            content = VALUES(content),
            status = VALUES(status),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)
    """

    inserted = 0
    skipped = 0

    for comment in comments:
        try:
            cursor.execute(insert_query, comment)
            inserted += 1
        except Error as e:
            if "Duplicate entry" not in str(e):
                print(f"Error inserting comment {comment['comment_id']}: {e}")
            skipped += 1

    conn.commit()
    print(f"✓ Inserted: {inserted}, Skipped: {skipped}")


def verify_data(cursor):
    print("\n--- Verification ---")

    cursor.execute("SELECT COUNT(*) FROM Post")
    post_count = cursor.fetchone()[0]
    print(f"Total Posts: {post_count}")

    cursor.execute("SELECT COUNT(*) FROM Comment")
    comment_count = cursor.fetchone()[0]
    print(f"Total Comments: {comment_count}")

    print("\nSample Posts:")
    cursor.execute("SELECT post_id, user_id, team_id, title FROM Post LIMIT 5")
    for row in cursor.fetchall():
        print(f"  {row}")

    print("\nSample Comments:")
    cursor.execute(
        "SELECT comment_id, post_id, user_id, parent_comment_id FROM Comment LIMIT 5"
    )
    for row in cursor.fetchall():
        print(f"  {row}")


def main():
    print("=" * 60)
    print("Post and Comment Data Import Script")
    print("=" * 60)

    conn = connect_db()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        import_posts(cursor, conn, "data/post.csv")

        import_comments(cursor, conn, "data/comment.csv")

        verify_data(cursor)

        print("\n" + "=" * 60)
        print("✓ Import completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
