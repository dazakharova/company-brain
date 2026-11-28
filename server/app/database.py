"""Small, bounded database readiness check using the application account."""

import os

import pymysql


class DatabaseUnavailable(Exception):
    """The configured application connection could not complete a query."""


def check_database() -> None:
    """Open a fresh connection so each check reflects current availability."""
    try:
        with pymysql.connect(
            host=os.environ.get("DB_HOST", "db"),
            port=int(os.environ.get("DB_PORT", "3306")),
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            database=os.environ["DB_NAME"],
            charset="utf8mb4",
            connect_timeout=2,
            read_timeout=2,
            write_timeout=2,
            autocommit=True,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                if cursor.fetchone() != (1,):
                    raise DatabaseUnavailable("Unexpected database response")
    except (pymysql.MySQLError, OSError, KeyError, ValueError) as exc:
        raise DatabaseUnavailable("Database unavailable") from exc
