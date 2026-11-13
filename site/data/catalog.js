/* Catalog data for the prototype.
   In the real site this comes from Supabase and is edited in the admin page.
   Each item: id (number shown to customers), cat, sub (optional), title, img (file stem in /img). */
window.SARA = {
  phone: '052-447-7261',
  waNumber: '972524477261',
  instagram: 'https://www.instagram.com/sara_cakes_and_sweets/',
  facebook: '', /* TODO: the Facebook page address (after the rename from beauticake) */

  categories: [
    { key: 'cakes',    name: 'עוגות מעוצבות',  blurb: 'ימי הולדת, בר ובת מצווה, חתונות', cover: 'pink-bow-tiers',
      subs: [
        { key: 'birthday', name: 'יום הולדת' },
        { key: 'mitzvah',  name: 'בר ובת מצווה' },
        { key: 'halake',   name: 'חאלקה' },
        { key: 'wedding',  name: 'חתונה ואירוסין' },
        { key: 'brit',     name: 'ברית ולידה' },
        { key: 'holidays', name: 'חגים' },
        { key: 'numbers',  name: 'עוגות מספרים' }
      ] },
    { key: 'tables',   name: 'שולחנות מתוקים', blurb: 'ברי קינוחים לאירועים', cover: 'sweet-bar-pink' },
    { key: 'desserts', name: 'קינוחים',         blurb: 'טארטים, כוסות, פבלובות', cover: 'tarts-meringue',
      subs: [
        { key: 'cups',     name: 'קינוחי כוסות' },
        { key: 'tarts',    name: 'טארטים' },
        { key: 'meringue', name: 'פבלובות ומרנג' },
        { key: 'choux',    name: 'פחזניות' },
        { key: 'cookies',  name: 'עוגיות וממתקים' },
        { key: 'special',  name: 'מיוחדים' }
      ] },
    { key: 'catering', name: 'מגשי אירוח ובופה', blurb: 'בופה מלא לאירועים', cover: 'buffet' },
    { key: 'gifts',    name: 'מארזים ומתנות',   blurb: 'מארזים מעוצבים לכל אירוע' },
    { key: 'workshops',name: 'סדנאות',           blurb: 'סדנאות עיצוב ואפייה' }
  ],

  items: [
    { id: 1,  cat: 'cakes',    sub: 'wedding',  title: 'עוגת חתונה בשלוש קומות עם ורדים', img: 'cake-wedding-roses' },
    { id: 2,  cat: 'cakes',    sub: 'birthday', title: 'עוגת יום הולדת עם כתר זהב',       img: 'cake-crown' },
    { id: 3,  cat: 'cakes',    sub: 'birthday', title: 'עוגת לב וינטג׳ ורודה',             img: 'cake-heart-sweet16' },
    { id: 4,  cat: 'tables',                    title: 'שולחן מתוק בזהב ונחושת',          img: 'sweet-table-gold' },
    { id: 5,  cat: 'tables',                    title: 'בר מתוק בוורוד ולבן',             img: 'sweet-bar-pink' },
    { id: 6,  cat: 'desserts', sub: 'cups',     title: 'כוסות לוטוס וקרמל',               img: 'cups-lotus' },
    { id: 7,  cat: 'desserts', sub: 'cups',     title: 'כוסות לימון ומרנג שרוף',          img: 'cups-lemon-meringue' },
    { id: 8,  cat: 'desserts', sub: 'cups',     title: 'כוס לימון מרנג',                  img: 'cup-lemon-meringue-hand' },
    { id: 9,  cat: 'desserts', sub: 'cups',     title: 'כוסות גבינה ודובדבנים',           img: 'cups-cherry-cheese' },
    { id: 10, cat: 'desserts', sub: 'meringue', title: 'פבלובות עם רוטב פירות יער',       img: 'pavlova-berries' },
    { id: 11, cat: 'desserts', sub: 'tarts',    title: 'מיני טארטים עם מרנג גבוה',        img: 'tarts-meringue-tall' },
    { id: 12, cat: 'desserts', sub: 'tarts',    title: 'מיני טארטים מרנג מסולסל',         img: 'tarts-meringue' },
    { id: 13, cat: 'desserts', sub: 'tarts',    title: 'מיני טארט פקאן',                  img: 'tarts-pecan' },
    { id: 14, cat: 'desserts', sub: 'tarts',    title: 'טארט שקדים מקורמלים',             img: 'tart-almond' },
    { id: 15, cat: 'desserts', sub: 'tarts',    title: 'טארט קרם עם זר קצפת',             img: 'tart-cream' },
    { id: 16, cat: 'desserts', sub: 'choux',    title: 'פחזניות קראקלן',                  img: 'choux-craquelin' },
    { id: 17, cat: 'desserts', sub: 'special',  title: 'קינוח דובאי',                     img: 'dubai-dessert' },
    { id: 18, cat: 'desserts', sub: 'cookies',  title: 'עוגיות שוקולד צ׳יפס',             img: 'cookie-bars' },
    { id: 19, cat: 'catering',                  title: 'מיני קישים ברוקולי ובטטה',        img: 'quiches' },
    { id: 20, cat: 'catering',                  title: 'בופה אירוח מלא',                  img: 'buffet' },
    { id: 21, cat: 'cakes',    sub: 'mitzvah',  title: 'עוגת בת מצווה ורודה עם פרחים',    img: 'mitzvah-pink-12' },
    { id: 22, cat: 'cakes',    sub: 'birthday', title: 'עוגת משאיות וטרקטורים',           img: 'trucks-3' },
    { id: 23, cat: 'cakes',    sub: 'mitzvah',  title: 'עוגת בת מצווה בשתי קומות',        img: 'mitzvah-two-tier-pink' },
    { id: 24, cat: 'cakes',    sub: 'mitzvah',  title: 'עוגת בר מצווה עם תפילין ומגילה',  img: 'barmitzvah-tefillin' },
    { id: 25, cat: 'cakes',    sub: 'birthday', title: 'עוגת וינטג׳ עם ורדים',             img: 'vintage-roses-birthday' },
    { id: 26, cat: 'cakes',    sub: 'birthday', title: 'עוגה לבנה עם סרטים ורודים',       img: 'white-pink-bows' },
    { id: 27, cat: 'cakes',    sub: 'mitzvah',  title: 'עוגת בר מצווה עם ורדים כחולים',   img: 'barmitzvah-blue-roses' },
    { id: 28, cat: 'cakes',    sub: 'birthday', title: 'עוגת חדי קרן',                    img: 'unicorns-5' },
    { id: 29, cat: 'cakes',    sub: 'halake',   title: 'עוגת ספר לחאלקה',                 img: 'halake-book' },
    { id: 30, cat: 'cakes',    sub: 'halake',   title: 'עוגת חאלקה בתכלת',                img: 'halake-blue' },
    { id: 31, cat: 'cakes',    sub: 'birthday', title: 'עוגת קומות בצהוב וזהב',           img: 'yellow-gold-two-tier' },
    { id: 32, cat: 'cakes',    sub: 'birthday', title: 'עוגת פרפר ורודה',                 img: 'butterfly-2' },
    { id: 33, cat: 'cakes',    sub: 'birthday', title: 'עוגת קומות ורודה עם פפיון',       img: 'pink-bow-tiers' },
    { id: 34, cat: 'cakes',    sub: 'birthday', title: 'עוגת יום הולדת ראשון',            img: 'first-birthday-vintage' },
    { id: 35, cat: 'cakes',    sub: 'birthday', title: 'עוגת אתר בנייה',                  img: 'construction-3' },
    { id: 36, cat: 'desserts', sub: 'special',  title: 'עוגת גבינה מוארכת עם קצפת',       img: 'cheesecake-long' },
    { id: 37, cat: 'cakes',    sub: 'wedding',  title: 'עוגת חתונה לבנה עם מונוגרמה',     img: 'wedding-white-monogram' },
    { id: 38, cat: 'cakes',    sub: 'birthday', title: 'עוגת לב וינטג׳ באדום',             img: 'heart-vintage-red' },
    { id: 39, cat: 'cakes',    sub: 'birthday', title: 'עוגת ספורט בשתי קומות',           img: 'sports-two-tier' },
    { id: 40, cat: 'cakes',    sub: 'birthday', title: 'עוגת סוכריות וטפטוף שוקולד',      img: 'candy-drip-7' },
    { id: 41, cat: 'cakes',    sub: 'wedding',  title: 'עוגת אירוסין עם פפיון צהוב',      img: 'engagement-yellow-bow' },
    { id: 42, cat: 'cakes',    sub: 'birthday', title: 'עוגת לב עם ורדים לאמא ואבא',      img: 'heart-roses-parents' },
    { id: 43, cat: 'cakes',    sub: 'birthday', title: 'עוגת ארטיק',                      img: 'popsicle-cake' },
    { id: 44, cat: 'cakes',    sub: 'birthday', title: 'עוגת לק',                         img: 'nail-polish-cake' },
    { id: 45, cat: 'cakes',    sub: 'halake',   title: 'עוגת חאלקה בזהב',                 img: 'halake-gold' },
    { id: 46, cat: 'cakes',    sub: 'halake',   title: 'עוגת חאלקה עם אותיות',            img: 'halake-letters-black' },
    { id: 47, cat: 'cakes',    sub: 'halake',   title: 'עוגת חאלקה עם אותיות בתכלת',      img: 'halake-letters-blue' },
    { id: 48, cat: 'cakes',    sub: 'halake',   title: 'עוגת חאלקה עם כיפה ואותיות',      img: 'halake-letters-kippah' },
    { id: 49, cat: 'cakes',    sub: 'birthday', title: 'עוגה עירומה עם פרחים',            img: 'naked-flowers' },
    { id: 50, cat: 'cakes',    sub: 'birthday', title: 'עוגת פרפרים',                     img: 'butterflies-27' }
  ],

  /* Price list (from Sara's price card). Prices in shekels. */
  prices: [
    { title: 'עוגות מעוצבות', rows: [
      { name: 'עוגה עגולה – קומה אחת', price: '450' },
      { name: 'עוגה קומה וחצי',        price: '650' },
      { name: 'עוגה 2 קומות',          price: '850' } ] },
    { title: 'עוגת גן', rows: [
      { name: 'עוגת גן',               price: '270' } ] },
    { title: 'עוגות מספרים', rows: [
      { name: 'עוגת מספרים',                     price: '400' },
      { name: 'עוגת מספר אחד – שוקולד ופירות',   price: '430' } ] },
    { title: 'קאפקייקס', rows: [
      { name: 'מארז 12 קאפקייקס',               price: '230' },
      { name: 'בהזמנה של מעל 20 יחידות',         price: '15', unit: 'ליחידה' } ] }
  ],

  /* Home page: reviews from customers' WhatsApp messages (text only, emojis removed, no names).
     TODO before launch: get each customer's OK to quote them. */
  reviews: [
    { text: 'תודה רבה על הקינוחים המדהימים והעוגה המושקעת שהכנת לכבוד בת המצווה. תודה על ההשקעה, על תשומת הלב לכל פרט, ועל כך שאפילו קנית מפה במיוחד לכבוד האירוע. המחווה המרגשת והנתינה מכל הלב הוסיפו יופי, חום ומתיקות לחגיגה.', tag: 'בת מצווה' },
    { text: 'תודה על העוגה הנפלאה הזו, היא הייתה מושלמת. 100% מושלמת, היא הייתה מצוינת, היא הייתה פשוט יפהפייה. מעולם לא ראיתי עוגה כל כך יפה בחיי.', tag: 'עוגה מעוצבת' },
    { text: 'כמעט כל הקינוחים נגמרו לפני ראש השנה. מארז מושלם, מפנק וטעים.', tag: 'מארז לראש השנה' },
    { text: 'הפינוקים ששלחת לי יצאו מושלמים, טעימים ברמות! התענגנו על כל ביס, ונשאר לנו גם לשבת. אלופה שאת!', tag: 'פינוקים לשבת' },
    { text: 'העוגה שהכנת לנו הייתה מהממת, ובעיקר טעימה בטירוף! חוסלה לגמרי.', tag: 'עוגה מעוצבת' },
    { text: 'תודה רבה רבה על העוגה! היא הייתה מושלמת. לא הפסקתי לקבל עליה מיליון מחמאות. פשוט טעימה ברמות, והכול היה מהמם, יפה ומדויק.', tag: 'עוגה מעוצבת' }
  ],

  /* Home page: the arch image and the thumbnails in the glass tray */
  hero: [1, 33, 2],
  /* Home page: three round links beside the arch (name shows on hover, under the circle on phones) */
  heroLinks: [
    { cat: 'desserts', title: 'קינוחים',          sub: 'טארטים, כוסות, פבלובות', img: 'pavlova-berries' },
    { cat: 'tables',   title: 'שולחנות מתוקים', sub: 'ברים מעוצבים לאירועים', img: 'sweet-bar-pink' },
    { cat: 'catering', title: 'בופה ומגשי אירוח', sub: 'בופה מלא לאירועים',     img: 'buffet' }
  ]
};
