# Local testing 

npm run dev

# local network testing

npm run dev -- --host

# Setup 

Frontend: React + Vite
Hosting: Vercel
Git: Github
Database: Supabase
Backend/API: Vercel
SMTP: Brevo

# supabase check contribution 

SELECT
    action,
    table_name,
    points,
    COUNT(*) AS times
FROM public.contributions
GROUP BY action, table_name, points
ORDER BY table_name, action, points;