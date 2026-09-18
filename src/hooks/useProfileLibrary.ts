import { LibraryVerse, DiscoverPack, Reflection } from '../types/models';

export function useProfileLibrary() {
  const savedVerses: LibraryVerse[] = [
    { id: '1', reference: 'Romans 8:28', snippet: 'And we know that in all things...' },
    { id: '2', reference: 'Philippians 4:13', snippet: 'I can do all this through him...' },
  ];

  const customPacks: DiscoverPack[] = [
    { id: '1', title: 'My Morning', verses: 5, image: require('../../assets/images/plans/plan-direction.jpg') },
    { id: '2', title: 'Anxiety', verses: 12, image: require('../../assets/images/plans/plan-anxiety.jpg') },
  ];

  const reflections: Reflection[] = [
    {
      id: '1',
      title: 'Finding peace in chaos',
      date: 'Today, 8:00 AM',
      snippet: 'This verse really spoke to me this morning. I need to remember that God is in control.'
    },
    {
      id: '2',
      title: 'Strength for the day',
      date: 'Yesterday, 7:30 AM',
      snippet: 'I can do all things through Christ who strengthens me. A powerful reminder.'
    }
  ];

  return { savedVerses, customPacks, reflections };
}
