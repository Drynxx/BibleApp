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
      
      const [remotePlans, dailyVerse] = await Promise.all([
        DiscoverService.getPlans(),
        DiscoverService.getVerseOfTheDay()
      ]);

      // Map remote plans to DiscoverPack format
      const mappedPacks: DiscoverPack[] = remotePlans.map((p: DiscoverPlanRow) => {
        // Just keeping the local dummy images based on some keywords or a default
        let image = require('../../assets/images/plans/plan-direction.jpg');
        if (p.id.includes('anxiety')) image = require('../../assets/images/plans/plan-anxiety.jpg');
        if (p.id.includes('wisdom')) image = require('../../assets/images/plans/plan-grief.jpg');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          verses: p.verses_array.length,
          verses_array: p.verses_array,
          category: 'All', // You could extract a category if you added one to DB
          image
        } as unknown as DiscoverPack; // The components might use custom types, we force it
      });

      // Build library
      let newLibrary: any[] = [
        { id: '2', reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', group: 'Popular', topic: 'Strength', translation: 'KJV' },
        { id: '3', reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', group: 'Popular', topic: 'Comfort', translation: 'KJV' },
      ];

      // Insert daily verse dynamically
      if (dailyVerse) {
        const text = await VerseRepository.getVerse(dailyVerse.book, dailyVerse.chapter, dailyVerse.verse, 'kjv');
        newLibrary.unshift({
          id: dailyVerse.id,
          reference: `${books[dailyVerse.book - 1] || 'Unknown'} ${dailyVerse.chapter}:${dailyVerse.verse}`,
          text: text || 'Could not load verse text.',
          group: 'For today',
          topic: 'Daily',
          translation: 'KJV'
        });
      } else {
        // Fallback if no connection
        newLibrary.unshift({ id: '1', reference: 'Romans 8:28', text: 'And we know that in all things God works for the good...', group: 'For today', topic: 'Hope', translation: 'KJV' });
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
