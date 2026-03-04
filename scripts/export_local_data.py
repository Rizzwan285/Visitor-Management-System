import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import date, datetime

class CustomEncoder(json.JSONEncoder):
    """Custom JSON encoder for handling dates and decimals."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

# Local connection string (since .env.local was updated, we hardcode the target local one)
LOCAL_DB_URL = "postgresql://postgres:postgres@localhost:5432/vms_db"

def main():
    print(f"Connecting to local database: {LOCAL_DB_URL}")
    try:
        conn = psycopg2.connect(LOCAL_DB_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Define tables in dependency order (parents first)
        tables = [
            'users',
            'feature_flags',
            'visitor_passes',
            'approval_requests',
            'scan_logs',
            'email_logs',
            'audit_logs'
        ]
        
        export_data = {}
        
        for table in tables:
            print(f"Exporting table: {table}")
            cursor.execute(f'SELECT * FROM "{table}"')
            rows = cursor.fetchall()
            export_data[table] = [dict(row) for row in rows]
            print(f"  -> Exported {len(rows)} records.")
            
        with open('local_db_dump.json', 'w') as f:
            json.dump(export_data, f, cls=CustomEncoder, indent=2)
            
        print("Data exported successfully to local_db_dump.json")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    main()
