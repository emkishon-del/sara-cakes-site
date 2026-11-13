/* WhatsApp links. Item messages always carry the item number so Sara knows which cake. */
export const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
export const WA_GENERAL = 'שלום שרה, הגעתי מהאתר ואשמח להצעה לאירוע בתאריך ';
export const WA_PRICES = 'שלום שרה, ראיתי את המחירון באתר ואשמח להצעת מחיר לאירוע בתאריך ';
export const waItemText = (title: string, id: number) => `שלום שרה, ראיתי באתר את "${title}" (עבודה #${id}) ואשמח להצעה לאירוע בתאריך `;
