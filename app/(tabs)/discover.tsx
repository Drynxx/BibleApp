import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image, Dimensions, Modal, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, X, ChevronRight, BookOpen, Plus, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Palette, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const angerImage = require('../../assets/images/plans/plan-anger.jpg');
const anxietyImage = require('../../assets/images/plans/plan-anxiety.jpg');
const directionImage = require('../../assets/images/plans/plan-direction.jpg');
const griefImage = require('../../assets/images/plans/plan-grief.jpg');

const packs = [
  { title: 'Anxiety & Worry', category: 'Peace', count: 7, description: 'Find peace in God’s presence through every season.', verses: 'Philippians 4:6–7 · Matthew 6:34 · Psalm 56:3', image: anxietyImage },
  { title: 'Grief & Loss', category: 'Comfort', count: 9, description: 'Hope and comfort for the hard days.', verses: 'Psalm 34:18 · Revelation 21:4 · John 11:25', image: griefImage },
  { title: 'A Need for Direction', category: 'Guidance', count: 6, description: 'Seeking God’s wisdom for what’s next.', verses: 'Proverbs 3:5–6 · Psalm 32:8 · Isaiah 30:21', image: directionImage },
  { title: 'Anger & Frustration', category: 'Growth', count: 8, description: 'Words for patience, wisdom, and lasting peace.', verses: 'James 1:19–20 · Proverbs 15:1 · Ephesians 4:26', image: angerImage },
];

const topics = ['All', 'Peace', 'Comfort', 'Guidance', 'Growth'];
const tabsArray = ['Plans', 'Books', 'Verses'];

const recentBooks = ['Psalms', 'John', 'Romans'];
const oldTestament = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
const newTestament = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];

const verseLibrary = [
  { reference: 'John 3:16', translation: 'NIV', text: 'For God so loved the world that he gave his one and only Son.', topic: 'Love', group: 'For today', tags: 'love salvation John' },
  { reference: 'Philippians 4:6–7', translation: 'NIV', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.', topic: 'Peace', group: 'For today', tags: 'anxiety peace prayer Philippians' },
  { reference: 'Psalm 34:18', translation: 'NIV', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', topic: 'Comfort', group: 'Popular', tags: 'grief comfort Psalms' },
  { reference: 'Proverbs 3:5–6', translation: 'NIV', text: 'Trust in the Lord with all your heart and lean not on your own understanding.', topic: 'Guidance', group: 'Popular', tags: 'direction wisdom trust Proverbs' },
  { reference: 'James 1:19–20', translation: 'NIV', text: 'Everyone should be quick to listen, slow to speak and slow to become angry.', topic: 'Growth', group: 'Popular', tags: 'anger patience James' },
  { reference: 'Romans 8:28', translation: 'NIV', text: 'In all things God works for the good of those who love him.', topic: 'Hope', group: 'For today', tags: 'hope purpose Romans' },
];

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Plans');
  const [activeTopic, setActiveTopic] = useState('All');
  const [preview, setPreview] = useState<any>(null);
  const [queuedItem, setQueuedItem] = useState('John 3:16');
  const [queued, setQueued] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return { plans: [], books: [], verses: [] };
    const includes = (val: string) => val.toLowerCase().includes(normalized);
    return {
      plans: packs.filter(p => includes(`${p.title} ${p.category} ${p.description} ${p.verses}`)),
      books: [...oldTestament, ...newTestament].filter(includes),
      verses: verseLibrary.filter(v => includes(`${v.reference} ${v.text} ${v.topic} ${v.tags}`)),
    };
  }, [query]);

  const visiblePacks = activeTopic === 'All' ? packs : packs.filter(p => p.category === activeTopic);
  const featuredPack = visiblePacks[0] || packs[0];
  const remainingPacks = visiblePacks.filter(p => p.title !== featuredPack?.title);
  const isSearching = query.trim().length > 0;
  const resultCount = searchResults.plans.length + searchResults.books.length + searchResults.verses.length;

  const handleQueue = (title: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQueuedItem(title);
    setQueued(true);
    setQueueExpanded(true);
  };

  const beginNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/practice');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20) }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>{t('discover.buildPractice', 'Build your practice')}</Text>
          <Text style={styles.headerTitle}>{t('discover.title', 'Discover')}</Text>
          <Text style={styles.headerSubtitle}>{t('discover.subtitle', 'Find scripture for where you are today.')}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search color={Palette.mutedForeground} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('discover.searchPlaceholder', 'Search plans, books, or verses...')}
            placeholderTextColor={Palette.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {isSearching && (
            <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
              <X color={Palette.mutedForeground} size={16} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        {!isSearching && (
          <View style={styles.tabsRow}>
            {tabsArray.map(tab => {
              const isActive = activeTab === tab;
              const tabTranslated = t(`discover.${tab.toLowerCase()}`, tab);
              return (
                <Pressable key={tab} style={styles.tabBtn} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tabTranslated}</Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Content */}
        <View style={styles.contentSection}>
          {isSearching ? (
            <View style={styles.searchResults}>
              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultTitle}>{t('discover.resultsFor', { query: query })}</Text>
                <Text style={styles.searchResultCount}>{t('discover.foundCount', { count: resultCount })}</Text>
              </View>
              {resultCount === 0 ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsTitle}>{t('discover.noResults', 'No matching content')}</Text>
                  <Text style={styles.noResultsSubtitle}>{t('discover.trySearch', 'Try a Bible book, topic, or verse reference.')}</Text>
                </View>
              ) : (
                <View style={styles.resultsWrapper}>
                  {searchResults.plans.length > 0 && (
                    <View style={styles.resultGroup}>
                      <Text style={styles.resultGroupTitle}>{t('discover.plans', 'Plans')}</Text>
                      {searchResults.plans.map(p => <PlanRow key={p.title} pack={p} onOpen={() => setPreview({ kind: 'plan', ...p })} />)}
                    </View>
                  )}
                  {searchResults.books.length > 0 && (
                    <View style={styles.resultGroup}>
                      <Text style={styles.resultGroupTitle}>{t('discover.books', 'Bible books')}</Text>
                      {searchResults.books.map(b => <BookRow key={b} book={b} onOpen={() => setPreview({ kind: 'book', title: b, description: 'Read a book', verses: b })} />)}
                    </View>
                  )}
                  {searchResults.verses.length > 0 && (
                    <View style={styles.resultGroup}>
                      <Text style={styles.resultGroupTitle}>{t('discover.verses', 'Verses')}</Text>
                      {searchResults.verses.map(v => <ReferenceRow key={v.reference} verse={v} onOpen={() => setPreview({ kind: 'verse', title: v.reference, description: v.text, verses: v.reference })} onQueue={() => handleQueue(v.reference)} />)}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View>
              {/* Plans Tab */}
              {activeTab === 'Plans' && (
                <View>
                  <Text style={styles.eyebrow}>{t('discover.chooseByNeed', 'Choose by need')}</Text>
                  <Text style={styles.sectionTitle}>{t('discover.whatDoYouNeed', 'What do you need today?')}</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
                    {topics.map(topic => {
                      const isActive = activeTopic === topic;
                      const topicTrans = t(`discover.topics.${topic}`, topic);
                      return (
                        <Pressable key={topic} onPress={() => setActiveTopic(topic)} style={[styles.topicPill, isActive ? styles.topicPillActive : styles.topicPillInactive]}>
                          <Text style={[styles.topicPillText, isActive ? styles.topicPillTextActive : styles.topicPillTextInactive]}>{topicTrans}</Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>

                  {featuredPack && (
                    <View style={styles.featuredSection}>
                      <View style={styles.featuredHeader}>
                        <Text style={styles.featuredTitle}>{t('discover.featuredPlan', 'Featured plan')}</Text>
                        <Text style={styles.featuredCount}>{t('discover.versesCount', { count: featuredPack.count })}</Text>
                      </View>
                      <Pressable style={styles.featuredCard} onPress={() => setPreview({ kind: 'plan', ...featuredPack })}>
                        <Image source={featuredPack.image} style={styles.featuredImage} />
                        <View style={styles.featuredOverlay} />
                        <View style={styles.featuredContent}>
                          <Text style={styles.featuredCategory}>{featuredPack.category} · {featuredPack.count} verses</Text>
                          <Text style={styles.featuredCardTitle}>{featuredPack.title}</Text>
                          <Text style={styles.featuredCardDesc}>{featuredPack.description}</Text>
                        </View>
                      </Pressable>
                    </View>
                  )}

                  {remainingPacks.length > 0 && (
                    <View style={styles.moreSection}>
                      <View style={styles.featuredHeader}>
                        <Text style={styles.featuredTitle}>{t('discover.morePlans', 'More plans')}</Text>
                        <Text style={styles.featuredCount}>{t('discover.plansCount', { count: remainingPacks.length })}</Text>
                      </View>
                      <View style={styles.moreList}>
                        {remainingPacks.map((p, i) => (
                          <View key={p.title} style={[i < remainingPacks.length - 1 && styles.moreRowBorder]}>
                            <PlanRow pack={p} onOpen={() => setPreview({ kind: 'plan', ...p })} />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Books Tab */}
              {activeTab === 'Books' && (
                <View>
                  <Text style={styles.eyebrow}>{t('discover.theBible', 'The Bible')}</Text>
                  <Text style={styles.sectionTitle}>{t('discover.browseByBook', 'Browse by Book')}</Text>

                  <View style={styles.recentBooks}>
                    <Text style={styles.eyebrow}>{t('discover.recentlyViewed', 'Recently viewed')}</Text>
                    <View style={styles.recentBooksGrid}>
                      {recentBooks.map(b => (
                        <Pressable key={b} style={styles.recentBookBtn} onPress={() => setPreview({ kind: 'book', title: b, description: 'Book', verses: b })}>
                          <Text style={styles.recentBookText}>{b}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.bookGroup}>
                    <View style={styles.bookGroupHeader}>
                      <Text style={styles.bookGroupTitle}>{t('discover.oldTestament', 'Old Testament')}</Text>
                      <BookOpen color={Palette.gold} size={16} />
                    </View>
                    <View style={styles.booksGrid}>
                      {oldTestament.map(b => <BookRow key={b} book={b} onOpen={() => setPreview({ kind: 'book', title: b, description: 'Book', verses: b })} />)}
                    </View>
                  </View>

                  <View style={styles.bookGroup}>
                    <View style={styles.bookGroupHeader}>
                      <Text style={styles.bookGroupTitle}>{t('discover.newTestament', 'New Testament')}</Text>
                      <BookOpen color={Palette.gold} size={16} />
                    </View>
                    <View style={styles.booksGrid}>
                      {newTestament.map(b => <BookRow key={b} book={b} onOpen={() => setPreview({ kind: 'book', title: b, description: 'Book', verses: b })} />)}
                    </View>
                  </View>
                </View>
              )}

              {/* Verses Tab */}
              {activeTab === 'Verses' && (
                <View>
                  <Text style={styles.eyebrow}>{t('discover.scriptureIndex', 'Scripture index')}</Text>
                  <Text style={styles.sectionTitle}>{t('discover.bibleReferences', 'Bible References')}</Text>

                  {['For today', 'Popular'].map(group => (
                    <View key={group} style={styles.verseGroup}>
                      <Text style={styles.eyebrow}>{t(`discover.${group === 'For today' ? 'forToday' : 'popular'}`, group)}</Text>
                      <View style={styles.versesList}>
                        {verseLibrary.filter(v => v.group === group).map(v => (
                          <ReferenceRow key={v.reference} verse={v} onOpen={() => setPreview({ kind: 'verse', title: v.reference, description: v.text, verses: v.reference })} onQueue={() => handleQueue(v.reference)} />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Queue Widget */}
      <View style={styles.queueWidget}>
        {queueExpanded && (
          <Text style={styles.queueReadyText}>{t('discover.readyNextSession', 'Ready to continue your next memorization session?')}</Text>
        )}
        <View style={styles.queueRow}>
          <Pressable style={styles.queueExpandBtn} onPress={() => setQueueExpanded(!queueExpanded)}>
            {queueExpanded ? <ChevronDown color={Palette.primary} size={18} /> : <ChevronUp color={Palette.primary} size={18} />}
          </Pressable>
          <Pressable style={styles.queueInfo} onPress={() => setQueueExpanded(!queueExpanded)}>
            <Text style={styles.queueEyebrow}>{t('discover.nextInQueue', 'Next in queue')}</Text>
            <Text style={styles.queueTitle} numberOfLines={1}>{queuedItem}</Text>
          </Pressable>
          {queued ? (
            <Pressable style={styles.queueActionBtn} onPress={beginNow}>
              <Text style={styles.queueActionText}>{t('discover.beginNow', 'Begin now')}</Text>
              <ArrowRight color="#FFF" size={16} />
            </Pressable>
          ) : (
            <Pressable style={styles.queueActionBtn} onPress={() => handleQueue(queuedItem)}>
              <Text style={styles.queueActionText}>{t('discover.addToQueue', 'Add to Queue')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <BottomSheet visible={!!preview} onClose={() => setPreview(null)}>
        <Pressable style={styles.modalContent} onPress={() => { }}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalEyebrow}>
            {preview?.kind === 'verse' ? t('discover.memoryVerse', 'Memory verse') : preview?.kind === 'plan' ? t('discover.versePlan', { count: preview.count }) : t('discover.bibleBook', 'Bible book')}
          </Text>
          <Text style={styles.modalTitle}>{preview?.title}</Text>
          <Text style={styles.modalDesc}>{preview?.description}</Text>

          <View style={styles.modalPreviewBox}>
            <Text style={styles.modalPreviewEyebrow}>{t('discover.preview', 'Preview')}</Text>
            <Text style={styles.modalPreviewVerses}>{preview?.verses}</Text>
          </View>

          {queued && queuedItem === preview?.title ? (
            <View style={styles.modalAddedState}>
              <Text style={styles.modalAddedText}>{t('discover.addedToQueue', 'Added to your practice queue.')}</Text>
              <Pressable style={styles.modalBeginBtn} onPress={beginNow}>
                <Text style={styles.modalBeginText}>{t('discover.beginNow', 'Begin now')}</Text>
                <ArrowRight color="#FFF" size={16} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.modalQueueBtn} onPress={() => handleQueue(preview?.title)}>
              <Text style={styles.modalQueueText}>{t('discover.addToQueue', 'Add to Queue')}</Text>
            </Pressable>
          )}
        </Pressable>
      </BottomSheet>
    </View>
  );
}

// Subcomponents
function PlanRow({ pack, onOpen }: { pack: any, onOpen: () => void }) {
  return (
    <Pressable style={styles.planRow} onPress={onOpen}>
      <Image source={pack.image} style={styles.planRowImg} />
      <View style={styles.planRowInfo}>
        <Text style={styles.planRowEyebrow}>{pack.category} · {pack.count} verses</Text>
        <Text style={styles.planRowTitle} numberOfLines={1}>{pack.title}</Text>
        <Text style={styles.planRowDesc} numberOfLines={1}>{pack.description}</Text>
      </View>
      <ChevronRight color={Palette.mutedForeground} size={18} />
    </Pressable>
  );
}

function BookRow({ book, onOpen }: { book: string, onOpen: () => void }) {
  return (
    <Pressable style={styles.bookRow} onPress={onOpen}>
      <Text style={styles.bookRowText}>{book}</Text>
      <ChevronRight color={Palette.mutedForeground} size={16} />
    </Pressable>
  );
}

function ReferenceRow({ verse, onOpen, onQueue }: { verse: any, onOpen: () => void, onQueue: () => void }) {
  return (
    <View style={styles.refRow}>
      <Pressable style={styles.refRowMain} onPress={onOpen}>
        <Text style={styles.refRowEyebrow}>{verse.topic} · {verse.translation}</Text>
        <Text style={styles.refRowTitle}>{verse.reference}</Text>
        <Text style={styles.refRowDesc} numberOfLines={1}>{verse.text}</Text>
      </Pressable>
      <Pressable style={styles.refRowAddBtn} onPress={onQueue}>
        <Plus color={Palette.foreground} size={20} />
      </Pressable>
    </View>
  );
}

function BottomSheet({ visible, onClose, children }: { visible: boolean, onClose: () => void, children: React.ReactNode }) {
  const [show, setShow] = React.useState(visible);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true })
      ]).start(() => setShow(false));
    }
  }, [visible]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1.2) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  if (!show) return null;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View 
        {...panResponder.panHandlers}
        style={{ flex: 1, justifyContent: 'flex-end', transform: [{ translateY: slideAnim }] }}
        pointerEvents="box-none"
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  headerEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.primary,
  },
  headerTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 44,
    lineHeight: 48,
    color: Palette.foreground,
    marginTop: 6,
  },
  headerSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 10,
  },
  searchContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 44,
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.foreground,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontFamily: Typography.sansBold,
    fontSize: 13,
    color: Palette.mutedForeground,
  },
  tabTextActive: {
    color: Palette.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: Palette.primary,
  },
  contentSection: {
    marginTop: 0,
    backgroundColor: 'rgba(0,0,0,0.015)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 240,
  },
  eyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.primary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 29,
    color: Palette.foreground,
    lineHeight: 34,
  },
  topicsScroll: {
    paddingVertical: 12,
    gap: 8,
  },
  topicPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topicPillActive: {
    backgroundColor: Palette.foreground,
    borderColor: Palette.foreground,
  },
  topicPillInactive: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
  },
  topicPillText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
  },
  topicPillTextActive: {
    color: '#FFF',
  },
  topicPillTextInactive: {
    color: Palette.mutedForeground,
  },
  featuredSection: {
    marginTop: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  featuredTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 21,
    color: Palette.foreground,
  },
  featuredCount: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Palette.mutedForeground,
  },
  featuredCard: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  featuredCategory: {
    fontFamily: Typography.sansBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.75)',
  },
  featuredCardTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 28,
    color: '#FFF',
    marginTop: 6,
  },
  featuredCardDesc: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  moreSection: {
    marginTop: 24,
  },
  moreList: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
  },
  moreRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  planRowImg: {
    width: 62,
    height: 62,
    borderRadius: 8,
  },
  planRowInfo: {
    flex: 1,
  },
  planRowEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: Palette.primary,
  },
  planRowTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 19,
    color: Palette.foreground,
    marginTop: 4,
  },
  planRowDesc: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Palette.mutedForeground,
    marginTop: 2,
  },
  recentBooks: {
    marginTop: 24,
  },
  recentBooksGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  recentBookBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBookText: {
    fontFamily: Typography.serifMedium,
    fontSize: 17,
    color: Palette.foreground,
  },
  bookGroup: {
    marginTop: 28,
  },
  bookGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  bookGroupTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 22,
    color: Palette.foreground,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 24,
  },
  bookRow: {
    width: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  bookRowText: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 18,
    color: Palette.foreground,
  },
  verseGroup: {
    marginTop: 24,
  },
  versesList: {
    gap: 10,
    marginTop: 10,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  refRowMain: {
    flex: 1,
  },
  refRowEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: Palette.primary,
  },
  refRowTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 24,
    color: Palette.foreground,
    marginTop: 4,
  },
  refRowDesc: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
    lineHeight: 18,
    marginTop: 6,
  },
  refRowAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  searchResults: {
    marginTop: 0,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
  },
  searchResultTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 25,
    color: Palette.foreground,
    flex: 1,
  },
  searchResultCount: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
  },
  noResults: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 24,
    color: Palette.foreground,
  },
  noResultsSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 8,
  },
  resultsWrapper: {
    marginTop: 24,
    gap: 36,
  },
  resultGroup: {},
  resultGroupTitle: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Palette.mutedForeground,
    marginBottom: 12,
  },
  queueWidget: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  queueReadyText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
    marginBottom: 12,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueExpandBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueInfo: {
    flex: 1,
  },
  queueEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: Palette.primary,
  },
  queueTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 18,
    color: Palette.foreground,
  },
  queueActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(158, 67, 36)',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    gap: 8,
  },
  queueActionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: '#FFF',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: Palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    color: Palette.gold,
  },
  modalTitle: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 32,
    color: Palette.foreground,
    marginTop: 4,
  },
  modalDesc: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.mutedForeground,
    lineHeight: 24,
    marginTop: 8,
  },
  modalPreviewBox: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
  },
  modalPreviewEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    color: Palette.primary,
  },
  modalPreviewVerses: {
    fontFamily: Typography.serifMedium,
    fontSize: 20,
    color: Palette.foreground,
    lineHeight: 28,
    marginTop: 12,
  },
  modalAddedState: {
    marginTop: 24,
  },
  modalAddedText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.mutedForeground,
    textAlign: 'center',
  },
  modalBeginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(158, 67, 36)',
    height: 56,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  modalBeginText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#FFF',
  },
  modalQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(158, 67, 36)',
    height: 56,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  modalQueueText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: '#FFF',
  }
});
