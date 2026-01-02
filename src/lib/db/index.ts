import { neon } from '@neondatabase/serverless'

// Create the SQL query function
export const sql = neon(process.env.DATABASE_URL!)
