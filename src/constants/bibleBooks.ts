export const BOOKS_EN = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", 
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

export const BOOKS_RO = [
  "Geneza", "Exodul", "Leviticul", "Numeri", "Deuteronomul", "Iosua", "Judecători", "Rut", "1 Samuel", "2 Samuel", "1 Împărați", "2 Împărați", "1 Cronici", "2 Cronici", "Ezra", "Neemia", "Estera", "Iov", "Psalmii", "Proverbele", "Eclesiastul", "Cântarea Cântărilor", "Isaia", "Ieremia", "Plângerile lui Ieremia", "Ezechiel", "Daniel", "Osea", "Ioel", "Amos", "Obadia", "Iona", "Mica", "Naum", "Habacuc", "Țefania", "Hagai", "Zaharia", "Maleahi", 
  "Matei", "Marcu", "Luca", "Ioan", "Faptele Apostolilor", "Romani", "1 Corinteni", "2 Corinteni", "Galateni", "Efeseni", "Filipeni", "Coloseni", "1 Tesaloniceni", "2 Tesaloniceni", "1 Timotei", "2 Timotei", "Tit", "Filimon", "Evrei", "Iacov", "1 Petru", "2 Petru", "1 Ioan", "2 Ioan", "3 Ioan", "Iuda", "Apocalipsa"
];

export const getBookName = (bookId: number, translation: string) => {
  const array = (translation === 'vdcc' || translation === 'cornilescu') ? BOOKS_RO : BOOKS_EN;
  return array[bookId - 1] || "Unknown";
};
