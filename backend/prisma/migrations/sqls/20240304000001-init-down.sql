-- Drop triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_mapping_configurations_updated_at ON mapping_configurations;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS upload_history;
DROP TABLE IF EXISTS mapping_configurations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- Drop enum types
DROP TYPE IF EXISTS upload_status;
DROP TYPE IF EXISTS company_status;
DROP TYPE IF EXISTS user_role;

-- Drop UUID extension if no other tables are using it
-- DROP EXTENSION IF EXISTS "uuid-ossp";