#!/usr/bin/env python3
"""
Script to import Team and TeamMember data from CSV files into MySQL database.
"""

import csv
import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    "host": "34.172.159.62",
    "port": 3306,
    "user": "admin",
    "password": "CS411sqlmaster@",
    "database": "CS411-teamup",
}


def connect_db():
    """Establish database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("✓ Successfully connected to database")
        return conn
    except Error as e:
        print(f"✗ Error connecting to database: {e}")
        return None


def import_teams(cursor, conn, csv_file):
    """Import team data from CSV file."""
    print(f"\n--- Importing Teams from {csv_file} ---")

    teams = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            team = {
                "team_id": int(row["team_id"]),
                "course_id": row["course_id"],
                "section_id": row["section_id"],
                "team_name": row["team_name"],
                "target_size": int(row["target_size"]) if row["target_size"] else None,
                "notes": row["notes"][:1024] if row["notes"] else None,
                "status": row["status"],
            }
            teams.append(team)

    print(f"Total teams to insert: {len(teams)}")

    insert_query = """
        INSERT INTO Team (team_id, course_id, section_id, team_name, target_size, notes, status)
        VALUES (%(team_id)s, %(course_id)s, %(section_id)s, %(team_name)s, %(target_size)s, %(notes)s, %(status)s)
        ON DUPLICATE KEY UPDATE
            course_id = VALUES(course_id),
            section_id = VALUES(section_id),
            team_name = VALUES(team_name),
            target_size = VALUES(target_size),
            notes = VALUES(notes),
            status = VALUES(status)
    """

    inserted = 0
    skipped = 0

    for team in teams:
        try:
            cursor.execute(insert_query, team)
            inserted += 1
        except Error as e:
            if "Duplicate entry" not in str(e):
                print(f"Error inserting team {team['team_id']}: {e}")
            skipped += 1

    conn.commit()
    print(f"✓ Inserted: {inserted}, Skipped: {skipped}")


def import_team_members(cursor, conn, csv_file):
    """Import team member data from CSV file."""
    print(f"\n--- Importing TeamMembers from {csv_file} ---")

    members = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            member = {
                "team_id": int(row["team_id"]),
                "user_id": int(row["user_id"]),
                "role": row["role"],
                "joined_at": row["joined_at"],
            }
            members.append(member)

    print(f"Total team members to insert: {len(members)}")

    insert_query = """
        INSERT INTO TeamMember (team_id, user_id, role, joined_at)
        VALUES (%(team_id)s, %(user_id)s, %(role)s, %(joined_at)s)
        ON DUPLICATE KEY UPDATE
            role = VALUES(role),
            joined_at = VALUES(joined_at)
    """

    inserted = 0
    skipped = 0

    for member in members:
        try:
            cursor.execute(insert_query, member)
            inserted += 1
        except Error as e:
            if "Duplicate entry" not in str(e):
                print(
                    f"Error inserting member team_id={member['team_id']}, user_id={member['user_id']}: {e}"
                )
            skipped += 1

    conn.commit()
    print(f"✓ Inserted: {inserted}, Skipped: {skipped}")


def verify_data(cursor):
    """Verify the imported data."""
    print("\n--- Verification ---")

    # Count teams
    cursor.execute("SELECT COUNT(*) FROM Team")
    team_count = cursor.fetchone()[0]
    print(f"Total Teams: {team_count}")

    # Count team members
    cursor.execute("SELECT COUNT(*) FROM TeamMember")
    member_count = cursor.fetchone()[0]
    print(f"Total TeamMembers: {member_count}")

    # Show sample data
    print("\nSample Teams:")
    cursor.execute("SELECT team_id, team_name, status, course_id FROM Team LIMIT 5")
    for row in cursor.fetchall():
        print(f"  {row}")

    print("\nSample TeamMembers:")
    cursor.execute("SELECT team_id, user_id, role FROM TeamMember LIMIT 5")
    for row in cursor.fetchall():
        print(f"  {row}")


def main():
    print("=" * 60)
    print("Team Data Import Script")
    print("=" * 60)

    # Connect to database
    conn = connect_db()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        # Import teams
        import_teams(cursor, conn, "data/team.csv")

        # Import team members
        import_team_members(cursor, conn, "data/team_member.csv")

        # Verify data
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
