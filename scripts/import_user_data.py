#!/usr/bin/env python3
"""
Import User Data Script
This script imports user data from CSV into MySQL database.
"""

import csv
import mysql.connector
import sys

# Database configuration
DB_CONFIG = {
    "host": "34.172.159.62",
    "port": 3306,
    "user": "admin",
    "password": "CS411sqlmaster@",
    "database": "CS411-teamup",
}

# CSV file path
CSV_FILE = "data/user.csv"


def connect_db():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected to database successfully")
        return conn, cursor
    except mysql.connector.Error as err:
        print(f"✗ Database connection error: {err}")
        sys.exit(1)


def process_user_data(csv_file):
    """Process CSV file and extract user data"""
    users = []

    print(f"Reading CSV file: {csv_file}")

    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Extract and validate user data
            user_data = {
                "user_id": int(row["user_id"]),
                "netid": row["netid"][:64],
                "email": row["email"][:128],
                "phone_number": (
                    row["phone_number"][:32] if row["phone_number"] else None
                ),
                "display_name": (
                    row["display_name"][:128] if row["display_name"] else None
                ),
                "avatar_url": row["avatar_url"][:256] if row["avatar_url"] else None,
                "bio": row["bio"][:1024] if row["bio"] else None,
                "score": float(row["score"]) if row["score"] else None,
                "major": row["major"][:64] if row["major"] else None,
                "grade": row["grade"][:16] if row["grade"] else None,
            }
            users.append(user_data)

    print(f"✓ Processed {len(users)} users")
    return users


def insert_users(cursor, conn, users):
    """Insert user data into database"""
    print("\nInserting users...")

    inserted = 0
    skipped = 0

    for user in users:
        try:
            cursor.execute(
                """
                INSERT INTO User (
                    user_id, netid, email, phone_number, display_name, 
                    avatar_url, bio, score, major, grade
                )
                VALUES (
                    %(user_id)s, %(netid)s, %(email)s, %(phone_number)s, %(display_name)s,
                    %(avatar_url)s, %(bio)s, %(score)s, %(major)s, %(grade)s
                )
            """,
                user,
            )
            inserted += 1
        except mysql.connector.Error as err:
            if err.errno == 1062:  # Duplicate entry
                skipped += 1
            else:
                print(f"✗ Error inserting user {user['user_id']}: {err}")

    conn.commit()
    print(f"✓ Inserted {inserted} users")
    if skipped > 0:
        print(f"⊘ Skipped {skipped} duplicate users")


def verify_data(cursor):
    """Verify inserted data"""
    print("\n" + "=" * 50)
    print("Verifying inserted data...")
    print("=" * 50)

    cursor.execute("SELECT COUNT(*) FROM User")
    user_count = cursor.fetchone()[0]
    print(f"User records: {user_count}")

    # Show sample data
    print("\nSample Users:")
    cursor.execute(
        "SELECT user_id, netid, email, display_name, major, grade FROM User LIMIT 5"
    )
    for row in cursor.fetchall():
        print(f"  {row}")

    # Show distribution by major
    print("\nUser Distribution by Major:")
    cursor.execute(
        "SELECT major, COUNT(*) as count FROM User GROUP BY major ORDER BY count DESC LIMIT 10"
    )
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")


def main():
    """Main execution function"""
    print("=" * 50)
    print("User Data Import Script")
    print("=" * 50)

    # Connect to database
    conn, cursor = connect_db()

    try:
        # Step 1: Process CSV data
        print("\n[Step 1] Processing CSV data...")
        users = process_user_data(CSV_FILE)

        # Step 2: Insert users
        print("\n[Step 2] Inserting users...")
        insert_users(cursor, conn, users)

        # Step 3: Verify data
        verify_data(cursor)

        print("\n" + "=" * 50)
        print("✓ Data import completed successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        conn.rollback()

    finally:
        cursor.close()
        conn.close()
        print("\n✓ Database connection closed")


if __name__ == "__main__":
    main()
