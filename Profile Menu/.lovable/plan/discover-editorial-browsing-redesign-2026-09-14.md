# Discover — Editorial Browsing Redesign

## Direction

Restructure Discover as a calm, single-column editorial library. Keep the warm ivory, terracotta, sage, and muted-gold palette, but use the same typography as Progress: **Newsreader** for expressive headings and scripture, and **DM Sans** for navigation, labels, search, and actions.

## Page structure

1. **Discover header and universal search**
   - Use a Newsreader “Discover” heading with a short, quiet introduction.
   - Keep search prominent and searchable across plans, Bible books, references, and verse text.
   - Show grouped results in the same order every time: Plans, Bible Books, then Verses.

2. **Featured plan**
   - Keep one large image-led plan at the top, using the existing abstract artwork.
   - Place category, verse count, title, and description in a controlled editorial hierarchy.
   - Rotate the featured plan when a topic filter is selected, rather than showing several oversized images.

3. **More plans**
   - Present the other plans as compact horizontal rows beneath the featured plan.
   - Give each row a small image crop, clear title, topic, verse count, and chevron.
   - Preserve the current plan preview and Add to Queue flow.

4. **Browse by Book**
   - Keep the familiar book shortcuts, but simplify their styling to match Progress.
   - “See all” expands the complete 66-book directory.
   - Selecting a book opens its existing curated preview.

5. **Bible references**
   - Add a dedicated “Bible References” section before the queue tray.
   - Use highly scannable rows: a large reference, a short verse excerpt, a restrained topic label, and a clear add/open control.
   - Keep references visually distinct from plans and books without introducing a new color theme.

6. **Queue and navigation**
   - Keep the John 3:16 queue tray and Home / Discover / Progress navigation.
   - Reduce the tray’s visual weight so it does not obscure the content hierarchy.

## Search behavior

- Search remains local and instant.
- Matching plans use compact plan rows, matching books use clean index rows, and matching verses use the new reference-row format.
- Keep clear-search and no-results states.
- Search results and all preview sheets remain keyboard and screen-reader accessible.

## Technical details

- Update only the Discover presentation and its local content organization.
- Reuse the existing generated plan images, preview sheet, queue state, `/inscribe` link, and 66-book data.
- Replace Discover’s Outfit/Figtree usage with the existing `font-serif` and `font-sans` tokens already used on Progress.
- Preserve semantic color tokens, responsive constraints, focus states, and reduced-motion behavior.
- Verify the finished page at 573×891 and 955×891, including topic changes, plan/book/verse previews, search terms, clear/no-results states, queue actions, navigation, overflow, and console errors.
- Recheck the reported preview module-loading error after implementation; if it remains reproducible, clear only the stale development dependency cache and restart the preview before validation.