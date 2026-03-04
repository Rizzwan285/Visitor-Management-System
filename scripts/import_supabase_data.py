import os
import json
import psycopg2
from psycopg2.extras import execute_values

# Hardcoded Supabase URL for import execution
SUPABASE_URL = "postgresql://postgres:Rizwan2458!!@db.tcttlpzwqwnqeewuaqhf.supabase.co:5432/postgres"

def main():
    print(f"Connecting to Supabase...")
    try:
        conn = psycopg2.connect(SUPABASE_URL)
        cursor = conn.cursor()
        
        with open('local_db_dump.json', 'r') as f:
            data = json.load(f)
            
        tables = [
            'users',
            'feature_flags',
            'visitor_passes',
            'approval_requests',
            'scan_logs',
            'email_logs',
            'audit_logs'
        ]
        
        cursor.execute("SET session_replication_role = 'replica';")
        
        for table in tables:
            rows = data.get(table, [])
            if not rows:
                print(f"Skipping {table} (no data)")
                continue
                
            print(f"Importing {len(rows)} rows into {table}...")
            
            columns = list(rows[0].keys())
            
            values_list = []
            for row in rows:
                values_list.append(tuple(row[col] for col in columns))
                
            quoted_cols = [f'"{col}"' for col in columns]
            
            insert_query = f"""
                INSERT INTO "{table}" ({', '.join(quoted_cols)}) 
                VALUES %s 
                ON CONFLICT ("id") DO UPDATE SET
                """ + ", ".join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col != 'id'])
            
            # For users table, email is also unique and could conflict if seed ran already
            if table == 'users':
                insert_query = f"""
                    INSERT INTO "{table}" ({', '.join(quoted_cols)}) 
                    VALUES %s 
                    ON CONFLICT ("email") DO UPDATE SET
                    """ + ", ".join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col != 'email'])
            
            execute_values(cursor, insert_query, values_list)
            
        cursor.execute("SET session_replication_role = 'origin';")
        
        conn.commit()
        print("Data imported successfully to Supabase!")
        
    except Exception as e:
        print(f"Error during import: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    main()
