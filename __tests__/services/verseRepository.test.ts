import { verseRepository } from "@/services/db/verseRepository";

describe("VerseRepository", () => {
  it("loads starter verses correctly", () => {
    const all = verseRepository.getAll();
    expect(all.length).toBeGreaterThan(10);
  });

  it("filters verses by translation", () => {
    const ro = verseRepository.getAll("VDC");
    const en = verseRepository.getAll("WEB");

    expect(ro.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
    ro.forEach((v) => expect(v.translation).toBe("VDC"));
    en.forEach((v) => expect(v.translation).toBe("WEB"));
  });

  it("filters verses by theme", () => {
    const peaceVerses = verseRepository.getByTheme("Pace", "VDC");
    expect(peaceVerses.length).toBeGreaterThan(0);
    peaceVerses.forEach((v) => expect(v.theme).toBe("Pace"));
  });

  it("retrieves verse by ID", () => {
    const v = verseRepository.getById("v-1");
    expect(v).toBeDefined();
    expect(v?.book).toBe("Proverbe");
    expect(v?.chapter).toBe(3);
    expect(v?.verse_number).toBe(3);
  });
});
