import starterVerses from "../../../assets/data/verses.json";

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse_number: number;
  translation: "VDC" | "WEB" | "KJV";
  text: string;
  theme: string;
  difficulty: "easy" | "medium" | "hard";
}

export class VerseRepository {
  private verses: Verse[];

  constructor(initialData?: Verse[]) {
    this.verses = initialData || (starterVerses as Verse[]);
  }

  public getAll(translation?: "VDC" | "WEB"): Verse[] {
    if (!translation) return this.verses;
    return this.verses.filter((v) => v.translation === translation);
  }

  public getById(id: string): Verse | undefined {
    return this.verses.find((v) => v.id === id);
  }

  public getByTheme(theme: string, translation?: "VDC" | "WEB"): Verse[] {
    return this.verses.filter((v) => {
      const matchTheme = v.theme.toLowerCase() === theme.toLowerCase();
      return translation ? matchTheme && v.translation === translation : matchTheme;
    });
  }

  public getRandom(translation: "VDC" | "WEB" = "VDC"): Verse {
    const list = this.getAll(translation);
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }
}

export const verseRepository = new VerseRepository();
