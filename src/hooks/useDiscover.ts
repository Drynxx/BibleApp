import { DiscoverPack, LibraryVerse } from '../types/models';

export function useDiscover() {
  const packs: DiscoverPack[] = [
    { id: '1', title: 'Anxiety', verses: 12, image: require('../../assets/images/plans/plan-anxiety.jpg') },
    { id: '2', title: 'Morning', verses: 8, image: require('../../assets/images/plans/plan-direction.jpg') },
    { id: '3', title: 'Wisdom', verses: 24, image: require('../../assets/images/plans/plan-grief.jpg') },
  ];

  const library: LibraryVerse[] = [
    { id: '1', reference: 'Romans 8:28', snippet: 'And we know that in all things God works for the good...' },
    { id: '2', reference: 'Philippians 4:13', snippet: 'I can do all this through him who gives me strength.' },
    { id: '3', reference: 'Psalm 23:1', snippet: 'The Lord is my shepherd, I lack nothing.' },
  ];

  return { packs, library };
}
