"""
One-time script: creates all tables in Supabase.
Run once: python init_db.py
"""
from database import engine, Base
import models  # noqa: F401 — importing registers all models with Base


def main():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")


if __name__ == "__main__":
    main()
