# Sara Cakes & Sweets – האתר ועמוד הניהול

האתר בנוי ב-Astro, ולכל עמוד, קטגוריה ועבודה יש כתובת משלו. התוכן והתמונות נשמרים ב-Supabase, והאתר מתארח ב-Netlify. שרה ומני מעדכנים את התוכן בעמוד הניהול, `/admin/`.

עד שמחברים את Supabase, האתר נבנה מהתוכן של אב הטיפוס (`src/data/seed.json` והתמונות ב-`public/img`). כך אפשר לראות אותו ולהעלות אותו לאוויר כבר עכשיו.

## הכתובות באתר

| עמוד | כתובת |
|---|---|
| בית | `/` |
| קטלוג | `/catalog/` |
| קטגוריה | `/catalog/cakes/`, `/catalog/sweet-tables/`, `/catalog/desserts/`, `/catalog/catering/` |
| סוג בתוך קטגוריה | למשל `/catalog/cakes/bar-bat-mitzvah/` או `/catalog/desserts/tarts/` |
| עבודה | `/cake/42/` (המספר לא משתנה, ולא חוזר אחרי מחיקה) |
| מחירון, אודות, צור קשר | `/prices/`, `/about/`, `/contact/` |
| נגישות ופרטיות | `/accessibility/`, `/privacy/` |
| ניהול | `/admin/` (לא מקושר מהאתר, וגוגל לא סורק אותו) |

## הקמה, פעם אחת

כל החשבונות נפתחים על המייל של שרה, ומני מצורף כמנהל נוסף.

### 1. Supabase (התוכן, התמונות והכניסה לניהול)
1. נכנסים ל-supabase.com, פותחים פרויקט חדש ובוחרים אזור באירופה (למשל Frankfurt).
2. ב-**SQL Editor** מדביקים את כל הקובץ `supabase/schema.sql` ולוחצים Run.
3. באותו מקום מריצים את השורה הבאה, עם המיילים האמיתיים:
   ```sql
   insert into public.admins (email) values ('sara@...'), ('mani@...');
   ```
4. ב-**Authentication → Users → Add user** יוצרים משתמש לשרה ומשתמש למני, עם אותם מיילים וסיסמה.
5. ב-**Authentication → Sign In / Providers** מכבים את האפשרות "Allow new users to sign up", כדי שאף אחד אחר לא יוכל להירשם.
6. ב-**Authentication → URL Configuration** כותבים ב-Site URL את `https://saracakes.co.il`, ומוסיפים ב-Redirect URLs את `https://saracakes.co.il/admin/`. זה נדרש בשביל "שכחתי סיסמה".
7. ב-**Project Settings → API** מעתיקים את ה-Project URL ואת ה-anon public key.

### 2. העברת התוכן הקיים ל-Supabase
מריצים במחשב, מתוך התיקייה `web`. צריך את ה-service_role key מ-Project Settings → API. **זה מפתח סודי: לא שומרים אותו בקבצים, לא מכניסים אותו ל-Git ולא מגדירים אותו ב-Netlify.**
```bash
npm install
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxxx npm run seed
```
הפקודה מעלה את 50 העבודות עם התמונות, את הקטגוריות, הביקורות והמחירון.

### 3. Netlify (האחסון)
1. מעלים את הקוד ל-GitHub, למאגר פרטי.
2. ב-netlify.com: **Add new site → Import from Git** ובוחרים את המאגר. אם הקוד לא נמצא בשורש המאגר, כותבים `web` בשדה Base directory. שאר ההגדרות כבר מוגדרות ב-`netlify.toml`.
3. ב-**Site configuration → Environment variables** מוסיפים את `PUBLIC_SUPABASE_URL` ואת `PUBLIC_SUPABASE_ANON_KEY`.
4. ב-**Site configuration → Build & deploy → Build hooks** יוצרים hook בשם "publish" ומעתיקים את הקישור. ב-Supabase, ב-SQL Editor, מריצים:
   ```sql
   insert into public.private_config (key, value) values ('build_hook', 'https://api.netlify.com/build_hooks/...')
   on conflict (key) do update set value = excluded.value;
   ```
   מעכשיו הכפתור "פרסום השינויים לאתר" בעמוד הניהול מעדכן את האתר תוך דקה או שתיים.

### 4. הדומיין saracakes.co.il
1. קונים את הדומיין אצל רשם ישראלי מוסמך. הרשימה המלאה באתר איגוד האינטרנט הישראלי.
2. ב-Netlify: **Domain management → Add a domain** וכותבים saracakes.co.il.
3. אצל הרשם מעדכנים את שרתי השמות (Name servers) לאלה ש-Netlify מציגה. Netlify מוסיפה אבטחה (HTTPS) לבד.

### 5. מדידת ביקורים (לא חובה)
פותחים אתר ב-Umami Cloud, ומוסיפים ב-Netlify את `PUBLIC_UMAMI_SRC` ואת `PUBLIC_UMAMI_ID`. Umami לא משתמש בעוגיות. כל לחיצה על וואטסאפ נספרת כאירוע `whatsapp`, עם המקום בעמוד ומספר העבודה.

## עבודה יומיומית (לשרה ולמני)
1. נכנסים ל-saracakes.co.il/admin ומתחברים.
2. **עבודות:** גוררים תמונות או לוחצים "בחירת תמונות", בוחרים קטגוריה וסוג ומתקנים את הכותרת אם צריך. אחר כך לוחצים "העלאה ושמירה", והתמונות מוקטנות לבד. באותו מסך אפשר לגרור כדי לשנות את הסדר, להסתיר עבודה, לערוך אותה או למחוק.
3. **עמוד הבית וקטגוריות:** בוחרים את שלוש התמונות בקשת ואת שלושת העיגולים, ומשנים שמות של קטגוריות.
4. **ביקורות** ו**מחירון:** מוסיפים, עורכים ומסתירים.
5. בסוף לוחצים **"פרסום השינויים לאתר"**.

## פיתוח
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # בונה לתיקייה dist
```
עם הקובץ `.env` (העתק של `.env.example`) האתר נבנה מ-Supabase. בלי הקובץ הוא נבנה מ-`src/data/seed.json`.

| קובץ | תפקיד |
|---|---|
| `src/lib/data.ts` | קריאת התוכן מ-Supabase או מ-seed.json, וכתובות התמונות |
| `src/pages/` | העמודים (כל קובץ הוא כתובת) |
| `src/components/Catalog.astro`, `src/scripts/catalog.ts` | הקטלוג: בחירת קטגוריה, רשת, תצוגה מוגדלת |
| `src/scripts/admin.ts`, `src/pages/admin/index.astro` | עמוד הניהול |
| `supabase/schema.sql` | הטבלאות, הרשאות הגישה, אחסון התמונות וכפתור הפרסום |
| `scripts/seed.mjs` | העברת התוכן הקיים ל-Supabase |
