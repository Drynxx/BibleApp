import { useState, useEffect } from 'react';
import { DiscoverPack } from '../types/models';
import { DiscoverService, DiscoverPlanRow, DailyVerseRow } from '../services/discoverService';
import { VerseRepository } from '../services/db/verseRepository';

// Book name mapping
const books = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];

export function useDiscover() {
  const [packs, setPacks] = useState<DiscoverPack[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const [remotePlans, dailyVerse, discoverVerses] = await Promise.all([
        DiscoverService.getPlans(),
        DiscoverService.getVerseOfTheDay(),
        DiscoverService.getDiscoverVerses()
      ]);

      // Map remote plans to DiscoverPack format
      const mappedPacks: DiscoverPack[] = remotePlans.map((p: DiscoverPlanRow) => {
        // Just keeping the local dummy images based on some keywords or a default
        let image = require('../../assets/images/plans/plan-direction.jpg');
        if (p.id.includes('anxiety')) image = require('../../assets/images/plans/plan-anxiety.jpg');
        if (p.id.includes('wisdom') || p.id.includes('trust')) image = require('../../assets/images/plans/plan-grief.jpg');

        // Format the verses array into a readable string (e.g., "John 14:27, Philippians 4:6")
        let versesArray = p.verses_array;
        if (typeof versesArray === 'string') {
          try { versesArray = JSON.parse(versesArray); } catch (e) {}
        }
        
        const formattedVersesString = (Array.isArray(versesArray) ? versesArray : []).map((v: any) => 
          `${books[v.b - 1]} ${v.c}:${v.v}`
        ).join(', ');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          verses: Array.isArray(versesArray) ? versesArray.length : 0,
          verses_array: versesArray,
          category: 'All', 
          image,
          verses_preview_string: formattedVersesString 
        } as unknown as DiscoverPack; 
      });

      // Build library from dynamic discover_verses
      let newLibrary: any[] = discoverVerses.map(v => ({
        id: v.id,
        reference: v.reference,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        group: v.group_name,
        topic: v.topic,
        translation: v.translation
      }));

      // Insert daily verse dynamically
      if (dailyVerse) {
        const text = await VerseRepository.getVerse(dailyVerse.book, dailyVerse.chapter, dailyVerse.verse, 'kjv');
        newLibrary.unshift({
          id: dailyVerse.id,
          reference: `${books[dailyVerse.book - 1] || 'Unknown'} ${dailyVerse.chapter}:${dailyVerse.verse}`,
          book: dailyVerse.book,
          chapter: dailyVerse.chapter,
          verse: dailyVerse.verse,
          text: text || 'Could not load verse text.',
          group: 'For today',
          topic: 'Daily',
          translation: 'KJV'
        });
      } else if (newLibrary.length === 0) {
        // Fallback if no connection and no discover verses
        newLibrary.unshift({ id: '1', reference: 'Romans 8:28', book: 45, chapter: 8, verse: 28, text: 'And we know that in all things God works for the good...', group: 'For today', topic: 'Hope', translation: 'KJV' });
      }

      setPacks(mappedPacks.length > 0 ? mappedPacks : [
        { id: '1', title: 'Anxiety', verses: 12, image: require('../../assets/images/plans/plan-anxiety.jpg') } as any,
        { id: '2', title: 'Morning', verses: 8, image: require('../../assets/images/plans/plan-direction.jpg') } as any,
        { id: '3', title: 'Wisdom', verses: 24, image: require('../../assets/images/plans/plan-grief.jpg') } as any,
      ]);
      setLibrary(newLibrary);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return { packs, library, isLoading };
}
