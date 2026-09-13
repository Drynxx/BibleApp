import xml.etree.ElementTree as ET
import sqlite3
import os
import re

book_map = {
    'GEN': 1, 'EXO': 2, 'LEV': 3, 'NUM': 4, 'DEU': 5, 'JOS': 6, 'JDG': 7, 'RUT': 8,
    '1SA': 9, '2SA': 10, '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, 'EZR': 15,
    'NEH': 16, 'EST': 17, 'JOB': 18, 'PSA': 19, 'PRO': 20, 'ECC': 21, 'SNG': 22,
    'ISA': 23, 'JER': 24, 'LAM': 25, 'EZK': 26, 'DAN': 27, 'HOS': 28, 'JOL': 29,
    'AMO': 30, 'OBA': 31, 'JON': 32, 'MIC': 33, 'NAM': 34, 'HAB': 35, 'ZEP': 36,
    'HAG': 37, 'ZEC': 38, 'MAL': 39, 'MAT': 40, 'MRK': 41, 'LUK': 42, 'JHN': 43,
    'ACT': 44, 'ROM': 45, '1CO': 46, '2CO': 47, 'GAL': 48, 'EPH': 49, 'PHP': 50,
    'COL': 51, '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55, 'TIT': 56, 'PHM': 57,
    'HEB': 58, 'JAS': 59, '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64,
    'JUD': 65, 'REV': 66
}

def clean_text(text):
    if not text:
        return ""
    # Remove excessive whitespace
    return re.sub(r'\s+', ' ', text).strip()

def main():
    db_path = 'assets/db/better_romanian.sqlite'
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE "verses" (
            "id" integer not null primary key autoincrement, 
            "book" integer not null, 
            "chapter" integer not null, 
            "verse" integer not null, 
            "text" text not null
        )
    ''')

    print("Parsing XML...")
    # The USFX namespace must be stripped or ignored. Let's just strip namespaces for easier parsing.
    it = ET.iterparse('ron-rccv.usfx.xml')
    for _, el in it:
        _, _, el.tag = el.tag.rpartition('}') # strip namespace
    root = it.root

    verses_data = []

    for book_elem in root.findall('.//book'):
        book_id_str = book_elem.get('id')
        if book_id_str not in book_map:
            continue
        book_num = book_map[book_id_str]
        
        current_chapter = 0
        current_verse = 0
        current_text = []

        # Iterate over all elements inside the book sequentially
        for elem in book_elem.iter():
            if elem.tag == 'c':
                if current_verse > 0 and current_text:
                    verses_data.append((book_num, current_chapter, current_verse, clean_text(''.join(current_text))))
                current_chapter = int(elem.get('id'))
                current_verse = 0
                current_text = []
            elif elem.tag == 'v':
                if current_verse > 0 and current_text:
                    verses_data.append((book_num, current_chapter, current_verse, clean_text(''.join(current_text))))
                current_verse = int(elem.get('id'))
                current_text = []
                if elem.tail:
                    current_text.append(elem.tail)
            else:
                if current_verse > 0:
                    if elem.text and elem.tag != 'v':
                        # avoid appending inner tags if they shouldn't be printed, but usually text inside a <w> or <q> is needed.
                        current_text.append(elem.text)
                    if elem.tail:
                        current_text.append(elem.tail)

        # Save the very last verse in the book
        if current_verse > 0 and current_text:
            verses_data.append((book_num, current_chapter, current_verse, clean_text(''.join(current_text))))

    # Clean up empty texts
    final_data = [(b, c, v, t) for b, c, v, t in verses_data if t]

    print(f"Inserting {len(final_data)} verses into database...")
    cursor.executemany('INSERT INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)', final_data)

    conn.commit()
    conn.close()
    print("Success! Saved to assets/db/better_romanian.sqlite")

if __name__ == '__main__':
    main()
