#!/usr/bin/env python3
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
url = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
key = os.getenv('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url:
    print("❌ EXPO_PUBLIC_SUPABASE_URL not found in .env file")
    sys.exit(1)

if not key:
    print("⚠️  Service role key not found. Using anon key instead.")
    key = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

if not key:
    print("❌ No Supabase key found in .env file")
    sys.exit(1)

# Create Supabase client
print(f"🔗 Connecting to Supabase at {url}")
supabase: Client = create_client(url, key)

# Read SQL file
sql_file = 'fix-database-errors.sql'
try:
    with open(sql_file, 'r') as f:
        sql_content = f.read()
except FileNotFoundError:
    print(f"❌ SQL file '{sql_file}' not found")
    sys.exit(1)

# Split SQL into individual statements
sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip() and not stmt.strip().startswith('--')]

print(f"📝 Executing {len(sql_statements)} SQL statements...")

# Execute each statement
for i, statement in enumerate(sql_statements, 1):
    try:
        print(f"\n🔧 Statement {i}/{len(sql_statements)}:")
        print(f"   {statement[:60]}{'...' if len(statement) > 60 else ''}")
        
        # For Supabase, we need to use the REST API with RPC or direct SQL execution
        # Since we're using anon key, we'll need to handle this differently
        
        print("   ⚠️  Note: Direct SQL execution requires service role key or database access.")
        print("   Please run these SQL commands in your Supabase SQL Editor:")
        print(f"\n{statement};\n")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n📋 Summary:")
print("Since we don't have direct database access, please copy the SQL statements above")
print("and run them in your Supabase dashboard SQL Editor.")
print("\nTo do this:")
print("1. Go to https://app.supabase.com/project/riesezhwmiklpcnrbjkb/sql/new")
print("2. Copy and paste the SQL from fix-database-errors.sql")
print("3. Click 'Run' to execute the statements")
