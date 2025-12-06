#!/usr/bin/env python3

import csv
import mysql.connector
from datetime import datetime
import sys

DB_CONFIG = {
    "host": "34.172.159.62",
    "port": 3306,
    "user": "admin",
    "password": "CS411sqlmaster@",
    "database": "CS411-teamup",
}

CSV_FILE = "data/course-catalog.csv"


def connect_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected to database successfully")
        return conn, cursor
    except mysql.connector.Error as err:
        print(f"✗ Database connection error: {err}")
        sys.exit(1)


def insert_term(cursor, conn):
    term_data = {
        "term_id": "2025-sp",
        "name": "Spring 2025",
        "start_date": "2025-01-20",
        "end_date": "2025-05-15",
    }

    try:
        cursor.execute(
            """
            INSERT INTO Term (term_id, name, start_date, end_date)
            VALUES (%(term_id)s, %(name)s, %(start_date)s, %(end_date)s)
        """,
            term_data,
        )
        conn.commit()
        print(f"✓ Inserted term: {term_data['name']}")
    except mysql.connector.Error as err:
        if err.errno == 1062:
            print(f"⊘ Term already exists: {term_data['name']}")
        else:
            print(f"✗ Error inserting term: {err}")


def process_course_data(csv_file, subject_filter=None):
    courses = {}
    sections = []

    print(f"Reading CSV file: {csv_file}")
    if subject_filter:
        print(f"Filtering by subject(s): {subject_filter}")

    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            subject = row["Subject"]
            number = row["Number"]

            if not subject or not number:
                continue

            if subject_filter:
                if isinstance(subject_filter, list):
                    if subject not in subject_filter:
                        continue
                elif subject != subject_filter:
                    continue

            course_id = f"sp25{subject}{number}"

            if course_id not in courses:
                title = row["Name"][:128] if row["Name"] else ""

                credits_str = row["Credit Hours"].replace(" hours.", "").strip()
                try:
                    credits = float(credits_str)
                except ValueError:
                    credits = 3.0

                courses[course_id] = {
                    "course_id": course_id,
                    "term_id": "2025-sp",
                    "subject": subject[:16],
                    "number": number[:16],
                    "title": title[:128],
                    "credits": credits,
                }

            crn = row["CRN"]
            if crn:
                start_time = row["Start Time"] if row["Start Time"] else ""
                end_time = row["End Time"] if row["End Time"] else ""
                days = row["Days of Week"] if row["Days of Week"] else ""

                meeting_time = f"{days} {start_time}-{end_time}".strip()
                if not meeting_time or meeting_time == "-":
                    meeting_time = "ARRANGED" if row["Type"] == "Online" else None

                room = row["Room"] if row["Room"] else ""
                building = row["Building"] if row["Building"] else ""
                location = f"{building} {room}".strip() if building or room else None

                instructor = row["Instructors"][:128] if row["Instructors"] else None

                delivery_mode = row["Type"][:32] if row["Type"] else None

                sections.append(
                    {
                        "course_id": course_id,
                        "crn": crn[:16],
                        "instructor": instructor,
                        "meeting_time": meeting_time[:128] if meeting_time else None,
                        "location": location[:128] if location else None,
                        "delivery_mode": delivery_mode,
                    }
                )

    print(f"✓ Processed {len(courses)} unique courses")
    print(f"✓ Processed {len(sections)} sections")

    return courses, sections


def insert_courses(cursor, conn, courses):
    print("\nInserting courses...")

    inserted = 0
    skipped = 0

    for course_id, course_data in courses.items():
        try:
            cursor.execute(
                """
                INSERT INTO Course (course_id, term_id, subject, number, title, credits)
                VALUES (%(course_id)s, %(term_id)s, %(subject)s, %(number)s, %(title)s, %(credits)s)
            """,
                course_data,
            )
            inserted += 1
        except mysql.connector.Error as err:
            if err.errno == 1062:
                skipped += 1
            else:
                print(f"✗ Error inserting course {course_id}: {err}")

    conn.commit()
    print(f"✓ Inserted {inserted} courses")
    if skipped > 0:
        print(f"⊘ Skipped {skipped} duplicate courses")


def insert_sections(cursor, conn, sections):
    print("\nInserting sections...")

    inserted = 0
    skipped = 0

    for section in sections:
        try:
            cursor.execute(
                """
                INSERT INTO Section (course_id, crn, instructor, meeting_time, location, delivery_mode)
                VALUES (%(course_id)s, %(crn)s, %(instructor)s, %(meeting_time)s, %(location)s, %(delivery_mode)s)
            """,
                section,
            )
            inserted += 1
        except mysql.connector.Error as err:
            if err.errno == 1062:
                skipped += 1
            else:
                print(
                    f"✗ Error inserting section {section['course_id']}-{section['crn']}: {err}"
                )

    conn.commit()
    print(f"✓ Inserted {inserted} sections")
    if skipped > 0:
        print(f"⊘ Skipped {skipped} duplicate sections")


def verify_data(cursor):
    print("\n" + "=" * 50)
    print("Verifying inserted data...")
    print("=" * 50)

    cursor.execute("SELECT COUNT(*) FROM Term")
    term_count = cursor.fetchone()[0]
    print(f"Term records: {term_count}")

    cursor.execute("SELECT COUNT(*) FROM Course")
    course_count = cursor.fetchone()[0]
    print(f"Course records: {course_count}")

    cursor.execute("SELECT COUNT(*) FROM Section")
    section_count = cursor.fetchone()[0]
    print(f"Section records: {section_count}")

    print("\nSample Course:")
    cursor.execute("SELECT * FROM Course LIMIT 3")
    for row in cursor.fetchall():
        print(f"  {row}")

    print("\nSample Section:")
    cursor.execute("SELECT * FROM Section LIMIT 3")
    for row in cursor.fetchall():
        print(f"  {row}")


def main():
    print("=" * 50)
    print("Course Data Import Script")
    print("=" * 50)

    conn, cursor = connect_db()

    try:
        print("\n[Step 1] Inserting term data...")
        insert_term(cursor, conn)

        print("\n[Step 2] Processing CSV data...")
        courses, sections = process_course_data(
            CSV_FILE,
            subject_filter=[
                "CS",
                "ECE",
                "MATH",
                "PHYS",
                "CHEM",
                "BIO",
                "STAT",
                "ME",
                "AE",
                "SHS",
                "SPED",
                "ASTR",
                "ECON",
                "CLE",
                "CEE",
                "CMN",
                "CPSC",
                "ENG",
                "LAS",
                "FAA",
                "BUS",
                "IE",
                "IS",
                "GWS",
                "HIS",
                "MUS",
                "DANCE",
                "UP",
                "VCM",
            ],
        )

        print("\n[Step 3] Inserting courses...")
        insert_courses(cursor, conn, courses)

        print("\n[Step 4] Inserting sections...")
        insert_sections(cursor, conn, sections)

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
