import { DiscoverPack, LibraryVerse } from '../types/models';

export function useDiscover() {
  const packs: DiscoverPack[] = [
    { id: '1', title: 'Anxiety', verses: 12, image: require('../../assets/images/plans/plan-anxiety.jpg') },
    { id: '2', title: 'Morning', verses: 8, image: require('../../assets/images/plans/plan-direction.jpg') },
    { id: '3', title: 'Wisdom', verses: 24, image: require('../../assets/images/plans/plan-grief.jpg') },
  ];

  const library: any[] = [
    { id: '1', reference: 'Romans 8:28', text: 'And we know that in all things God works for the good...', group: 'For today', topic: 'Hope', translation: 'KJV' },
    { id: '2', reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', group: 'Popular', topic: 'Strength', translation: 'KJV' },
    { id: '3', reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', group: 'Popular', topic: 'Comfort', translation: 'KJV' },
  ];

  return { packs, library };
}
