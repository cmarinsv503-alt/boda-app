import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rvpeatgbryuywthnjely.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cGVhdGdicnl1eXd0aG5qZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMjk4MTAsImV4cCI6MjEwOTgwNTgxMH0.xNFvQpHBxJ6yYyrH6xXBxLB-Vl1eltKdnq_fhPgzon0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)