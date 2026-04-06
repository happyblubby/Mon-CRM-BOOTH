import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kolttrdnxkimtegolahm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHR0cmRueGtpbXRlZ29sYWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODgxMjMsImV4cCI6MjA5MTA2NDEyM30.T0c1pLyC8dG6xnOPWj5bAssi5OPpqPeIqoHQY1Vz5Bs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)