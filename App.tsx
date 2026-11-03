import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { blankDraft, dayOptions, initialIdeas } from './src/data'
import type { AppTab, DateIdea, DateKind, IdeaDraft } from './src/types'

const colors = {
  ink: '#30292f',
  muted: '#776d72',
  cream: '#f7f3ed',
  paper: '#fffdf9',
  coral: '#e97968',
  coralSoft: '#f9ded8',
  sage: '#657b6d',
  sageSoft: '#dfe8df',
  line: 'rgba(48, 41, 47, 0.12)',
}

const serif = Platform.OS === 'android' ? 'serif' : 'Georgia'

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'plan', label: 'Our plan', icon: '♡' },
  { id: 'manage', label: 'Manage', icon: '＋' },
  { id: 'profile', label: 'You', icon: '◉' },
]

const filters: { id: 'all' | DateKind; label: string }[] = [
  { id: 'all', label: 'For you' },
  { id: 'event', label: 'Events' },
  { id: 'food', label: 'Food' },
  { id: 'activity', label: 'Play' },
  { id: 'outdoors', label: 'Outside' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('discover')
  const [filter, setFilter] = useState<'all' | DateKind>('all')
  const [ideas, setIdeas] = useState(initialIdeas)
  const [selectedIds, setSelectedIds] = useState(['moonlight-mini-golf', 'sunset-lookout'])
  const [selectedDay, setSelectedDay] = useState('fri')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<IdeaDraft>({ ...blankDraft })
  const [inviteSent, setInviteSent] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const activeIdeas = useMemo(
    () => ideas.filter((idea) => idea.active && (filter === 'all' || idea.kind === filter)),
    [filter, ideas],
  )
  const selectedIdeas = ideas.filter((idea) => selectedIds.includes(idea.id))
  const detail = ideas.find((idea) => idea.id === detailId)

  function goTo(tab: AppTab) {
    setDetailId(null)
    setActiveTab(tab)
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-3),
    )
  }

  function openCreate() {
    setEditingId(null)
    setDraft({ ...blankDraft })
    setEditorVisible(true)
  }

  function openEdit(idea: DateIdea) {
    setEditingId(idea.id)
    setDraft({
      title: idea.title,
      description: idea.description,
      kind: idea.kind,
      location: idea.location,
      area: idea.area,
      price: idea.price,
      duration: idea.duration,
      eventDate: idea.eventDate ?? '',
    })
    setEditorVisible(true)
  }

  function saveDraft() {
    if (!draft.title.trim() || !draft.location.trim()) return
    if (editingId) {
      setIdeas((current) => current.map((idea) => idea.id === editingId ? { ...idea, ...draft } : idea))
    } else {
      setIdeas((current) => [
        {
          ...draft,
          id: 'local-' + Date.now(),
          eyebrow: draft.kind === 'event' ? 'New local event' : 'New date idea',
          image: require('./assets/dates/date-hero.png'),
          tags: ['Just added', draft.kind === 'event' ? 'Local event' : 'Date idea'],
          active: true,
        },
        ...current,
      ])
    }
    setEditorVisible(false)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        {detail ? (
          <DetailScreen
            idea={detail}
            selected={selectedIds.includes(detail.id)}
            onBack={() => setDetailId(null)}
            onToggle={() => toggleSelected(detail.id)}
            onPlan={() => goTo('plan')}
          />
        ) : activeTab === 'discover' ? (
          <DiscoverScreen
            ideas={activeIdeas}
            filter={filter}
            selectedIds={selectedIds}
            onFilter={setFilter}
            onDetail={setDetailId}
            onToggle={toggleSelected}
            onPlan={() => goTo('plan')}
          />
        ) : activeTab === 'plan' ? (
          <PlanScreen
            ideas={selectedIdeas}
            day={selectedDay}
            sent={inviteSent}
            onDay={setSelectedDay}
            onRemove={toggleSelected}
            onDiscover={() => goTo('discover')}
            onSend={() => setInviteSent(true)}
            onReset={() => setInviteSent(false)}
          />
        ) : activeTab === 'manage' ? (
          <ManageScreen
            ideas={ideas}
            onCreate={openCreate}
            onEdit={openEdit}
            onToggleActive={(id) =>
              setIdeas((current) => current.map((idea) => idea.id === id ? { ...idea, active: !idea.active } : idea))
            }
          />
        ) : (
          <ProfileScreen signedIn={signedIn} onSignIn={() => setSignedIn((value) => !value)} />
        )}

        {!detail && (
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <Pressable key={tab.id} style={styles.tabItem} onPress={() => goTo(tab.id)}>
                <View>
                  <Text style={[styles.tabIcon, activeTab === tab.id && styles.tabActive]}>{tab.icon}</Text>
                  {tab.id === 'plan' && selectedIds.length > 0 && (
                    <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{selectedIds.length}</Text></View>
                  )}
                </View>
                <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <EditorModal
        visible={editorVisible}
        editing={Boolean(editingId)}
        draft={draft}
        onDraft={setDraft}
        onClose={() => setEditorVisible(false)}
        onSave={saveDraft}
      />
    </SafeAreaView>
  )
}

function ScreenHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {action}
    </View>
  )
}

function DiscoverScreen({ ideas, filter, selectedIds, onFilter, onDetail, onToggle, onPlan }: { ideas: DateIdea[]; filter: 'all' | DateKind; selectedIds: string[]; onFilter: (value: 'all' | DateKind) => void; onDetail: (id: string) => void; onToggle: (id: string) => void; onPlan: () => void }) {
  const featured = ideas[0] ?? initialIdeas[0]
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="Tuesday, September 8"
        title="What should we do next?"
        action={<View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>}
      />
      <ImageBackground source={featured.image} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <View style={styles.heroPill}><Text style={styles.heroPillText}>CURATED FOR THE TWO OF YOU</Text></View>
          <Text style={styles.heroTitle}>A little adventure is overdue.</Text>
          <Text style={styles.heroText}>Pick two or three ideas. Your guest chooses the winner and the day.</Text>
          <PrimaryButton label="Build this week’s invite" onPress={onPlan} />
        </View>
      </ImageBackground>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item.id} style={[styles.chip, filter === item.id && styles.chipActive]} onPress={() => onFilter(item.id)}>
            <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <View><Text style={styles.eyebrow}>FRESH POSSIBILITIES</Text><Text style={styles.sectionTitle}>Made for your shortlist</Text></View>
        <Text style={styles.countLabel}>{ideas.length} ideas</Text>
      </View>
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} selected={selectedIds.includes(idea.id)} onDetail={() => onDetail(idea.id)} onToggle={() => onToggle(idea.id)} />
      ))}
    </ScrollView>
  )
}

function IdeaCard({ idea, selected, onDetail, onToggle }: { idea: DateIdea; selected: boolean; onDetail: () => void; onToggle: () => void }) {
  return (
    <View style={styles.ideaCard}>
      <Pressable onPress={onDetail}>
        <ImageBackground source={idea.image} style={styles.cardPhoto} imageStyle={styles.cardPhotoImage}>
          {idea.eventDate && <View style={styles.dateBadge}><Text style={styles.badgeText}>{idea.eventDate}</Text></View>}
          <View style={styles.priceBadge}><Text style={styles.badgeText}>{idea.price}</Text></View>
        </ImageBackground>
      </Pressable>
      <View style={styles.cardCopy}>
        <Text style={styles.eyebrow}>{idea.eyebrow.toUpperCase()}</Text>
        <Pressable onPress={onDetail}><Text style={styles.cardTitle}>{idea.title}</Text></Pressable>
        <Text style={styles.cardMeta}>{idea.location} · {idea.area}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDuration}>{idea.duration}</Text>
          <Pressable style={[styles.addButton, selected && styles.addButtonSelected]} onPress={onToggle}>
            <Text style={[styles.addButtonText, selected && styles.addButtonTextSelected]}>{selected ? '✓  Added' : '+  Add'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function DetailScreen({ idea, selected, onBack, onToggle, onPlan }: { idea: DateIdea; selected: boolean; onBack: () => void; onToggle: () => void; onPlan: () => void }) {
  return (
    <View style={styles.detailScreen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
        <ImageBackground source={idea.image} style={styles.detailPhoto}>
          <View style={styles.detailShade} />
          <Pressable style={styles.backButton} onPress={onBack}><Text style={styles.backButtonText}>←</Text></Pressable>
          <View style={styles.kindBadge}><Text style={styles.kindBadgeText}>{idea.kind.toUpperCase()}</Text></View>
        </ImageBackground>
        <View style={styles.detailCopy}>
          <Text style={styles.eyebrow}>{idea.eyebrow.toUpperCase()}</Text>
          <Text style={styles.detailTitle}>{idea.title}</Text>
          <Text style={styles.detailDescription}>{idea.description}</Text>
          <View style={styles.factCard}>
            <Fact label="WHERE" value={idea.location} note={idea.area} />
            <View style={styles.factDivider} />
            <Fact label="TIME" value={idea.duration} note={idea.eventDate ?? 'Flexible date'} />
            <View style={styles.factDivider} />
            <Fact label="BUDGET" value={idea.price} note="Estimate for two" />
          </View>
          <View style={styles.tagRow}>{idea.tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}</View>
        </View>
      </ScrollView>
      <View style={styles.detailActions}>
        <Pressable style={styles.secondaryButton} onPress={onToggle}><Text style={styles.secondaryButtonText}>{selected ? 'Remove' : 'Add to invite'}</Text></Pressable>
        <Pressable style={styles.darkButton} onPress={onPlan}><Text style={styles.darkButtonText}>Review invite  →</Text></Pressable>
      </View>
    </View>
  )
}

function Fact({ label, value, note }: { label: string; value: string; note: string }) {
  return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text><Text style={styles.factNote}>{note}</Text></View>
}

function PlanScreen({ ideas, day, sent, onDay, onRemove, onDiscover, onSend, onReset }: { ideas: DateIdea[]; day: string; sent: boolean; onDay: (value: string) => void; onRemove: (id: string) => void; onDiscover: () => void; onSend: () => void; onReset: () => void }) {
  const [note, setNote] = useState('I picked a few things that made me think of us. Choose your favourite?')
  const chosenDay = dayOptions.find((item) => item.id === day)

  if (sent) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.successContent}>
        <View style={styles.successMark}><Text style={styles.successMarkText}>✓</Text></View>
        <Text style={styles.eyebrow}>INVITATION READY</Text>
        <Text style={styles.successTitle}>Now the fun part.</Text>
        <Text style={styles.successText}>Your private invitation is ready for NAME_OF_GUEST. She can choose from {ideas.length} ideas and confirm {chosenDay?.day}, {chosenDay?.date}.</Text>
        <View style={styles.shareCard}><Text style={styles.shareLabel}>PRIVATE PREVIEW LINK</Text><Text style={styles.shareLink}>datebook.local/invite/d8f2</Text></View>
        <PrimaryButton label="Share prototype link" onPress={() => Share.share({ message: 'A mock Datebook invitation: https://datebook.local/invite/d8f2' })} dark />
        <Pressable style={styles.resetButton} onPress={onReset}><Text style={styles.resetButtonText}>Back to invitation</Text></Pressable>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader eyebrow="PRIVATE INVITATION" title="Plan our next date" />
      <StepHeader number="1" title="Give them good choices" subtitle="Choose up to three possibilities." />
      <View style={styles.planList}>
        {ideas.map((idea) => (
          <View key={idea.id} style={styles.planItem}>
            <Image source={idea.image} style={styles.planImage} />
            <View style={styles.planCopy}><Text style={styles.planTitle}>{idea.title}</Text><Text style={styles.planMeta}>{idea.location} · {idea.price}</Text></View>
            <Pressable style={styles.removeButton} onPress={() => onRemove(idea.id)}><Text style={styles.removeText}>×</Text></Pressable>
          </View>
        ))}
        {ideas.length < 3 && <Pressable style={styles.addOption} onPress={onDiscover}><Text style={styles.addOptionText}>＋  Add another possibility</Text></Pressable>}
      </View>
      <StepHeader number="2" title="Suggest a day" subtitle="Your guest can still ask for another." />
      <View style={styles.dayRow}>
        {dayOptions.map((item) => (
          <Pressable key={item.id} style={[styles.dayOption, day === item.id && styles.dayOptionActive]} onPress={() => onDay(item.id)}>
            <Text style={[styles.dayName, day === item.id && styles.onDark]}>{item.day}</Text>
            <Text style={[styles.dayDate, day === item.id && styles.onDark]}>{item.date}</Text>
            <Text style={[styles.dayTime, day === item.id && styles.onDarkMuted]}>{item.time}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.inputLabel}>PERSONAL NOTE</Text>
      <TextInput style={styles.noteInput} value={note} onChangeText={setNote} multiline textAlignVertical="top" />
      <View style={styles.privacyNote}><Text style={styles.privacyIcon}>⌁</Text><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Only your invited person can respond</Text><Text style={styles.privacyText}>Public accounts and community sharing are intentionally outside this prototype.</Text></View></View>
      <PrimaryButton label="Preview private invitation" onPress={onSend} disabled={ideas.length === 0} />
    </ScrollView>
  )
}

function StepHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <View style={styles.stepHeader}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepSubtitle}>{subtitle}</Text></View></View>
}

function ManageScreen({ ideas, onCreate, onEdit, onToggleActive }: { ideas: DateIdea[]; onCreate: () => void; onEdit: (idea: DateIdea) => void; onToggleActive: (id: string) => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="PRIVATE CURATOR TOOLS" title="Manage Datebook" action={<Pressable style={styles.headerAdd} onPress={onCreate}><Text style={styles.headerAddText}>＋</Text></Pressable>} />
      <View style={styles.statsRow}>
        <Stat value={ideas.filter((idea) => idea.active).length} label="Live ideas" />
        <Stat value={ideas.filter((idea) => idea.kind === 'event').length} label="Events" />
        <Stat value={ideas.filter((idea) => !idea.active).length} label="Drafts" />
      </View>
      <View style={styles.managementList}>
        {ideas.map((idea) => (
          <View key={idea.id} style={styles.managementItem}>
            <Image source={idea.image} style={styles.managementImage} />
            <View style={styles.managementCopy}>
              <View style={[styles.status, idea.active && styles.statusLive]}><Text style={[styles.statusText, idea.active && styles.statusTextLive]}>{idea.active ? 'LIVE' : 'DRAFT'}</Text></View>
              <Text style={styles.managementTitle} numberOfLines={1}>{idea.title}</Text>
              <Text style={styles.managementMeta} numberOfLines={1}>{idea.kind} · {idea.location}</Text>
            </View>
            <View style={styles.managementButtons}>
              <Pressable onPress={() => onEdit(idea)}><Text style={styles.actionText}>Edit</Text></Pressable>
              <Pressable onPress={() => onToggleActive(idea.id)}><Text style={styles.actionText}>{idea.active ? 'Archive' : 'Publish'}</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>
}

function ProfileScreen({ signedIn, onSignIn }: { signedIn: boolean; onSignIn: () => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="YOUR PRIVATE CORNER" title="The two of us" />
      <View style={styles.coupleCard}>
        <View style={styles.avatarStack}><View style={[styles.memberAvatar, styles.firstAvatar]}><Text style={styles.memberAvatarText}>M</Text></View><View style={[styles.memberAvatar, styles.secondAvatar]}><Text style={styles.memberAvatarText}>J</Text></View></View>
        <Text style={styles.coupleTitle}>Manfred & GUEST_NAME</Text>
        <Text style={styles.coupleText}>A small shared space for plans worth looking forward to.</Text>
        <View style={styles.memberPill}><Text style={styles.memberPillText}>Private · 2 members</Text></View>
      </View>
      <View style={styles.googleCard}>
        <View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View>
        <View style={styles.googleCopy}><Text style={styles.googleTitle}>{signedIn ? 'Connected as Manfred' : 'Connect your Google account'}</Text><Text style={styles.googleText}>{signedIn ? 'manfred@example.com · Prototype identity' : 'Save plans across devices and identify the curator.'}</Text></View>
        <Pressable onPress={onSignIn}><Text style={styles.googleAction}>{signedIn ? 'Disconnect' : 'Continue'}</Text></Pressable>
      </View>
      <View style={styles.settingsList}>
        <Setting icon="♡" title="Invite member" note="Private invitation links" />
        <Setting icon="▣" title="Calendar preferences" note="Not connected in this prototype" />
        <Setting icon="⌁" title="Privacy" note="Only members see your plans" last />
      </View>
      <Text style={styles.prototypeCaption}>Google sign-in is intentionally simulated. No account data leaves this app.</Text>
    </ScrollView>
  )
}

function Setting({ icon, title, note, last }: { icon: string; title: string; note: string; last?: boolean }) {
  return <Pressable style={[styles.setting, last && styles.settingLast]}><Text style={styles.settingIcon}>{icon}</Text><View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingNote}>{note}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
}

function EditorModal({ visible, editing, draft, onDraft, onClose, onSave }: { visible: boolean; editing: boolean; draft: IdeaDraft; onDraft: (draft: IdeaDraft) => void; onClose: () => void; onSave: () => void }) {
  const kinds: DateKind[] = ['event', 'food', 'activity', 'outdoors']
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={styles.modalSafe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalTop}><Pressable onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></Pressable><Text style={styles.modalTitle}>{editing ? 'Edit idea' : 'Add possibility'}</Text><Pressable onPress={onSave}><Text style={styles.saveText}>Save</Text></Pressable></View>
            <Text style={styles.eyebrow}>WHAT KIND OF DATE?</Text>
            <View style={styles.kindRow}>{kinds.map((kind) => <Pressable key={kind} style={[styles.kindChip, draft.kind === kind && styles.kindChipActive]} onPress={() => onDraft({ ...draft, kind })}><Text style={[styles.kindChipText, draft.kind === kind && styles.kindChipTextActive]}>{kind}</Text></Pressable>)}</View>
            <Input label="TITLE" value={draft.title} placeholder="Night market wander" onChangeText={(title) => onDraft({ ...draft, title })} />
            <Input label="WHY IT WOULD MAKE A GOOD DATE" value={draft.description} placeholder="Describe the mood, not just the venue..." multiline onChangeText={(description) => onDraft({ ...draft, description })} />
            <Input label="LOCATION" value={draft.location} placeholder="Venue or trail" onChangeText={(location) => onDraft({ ...draft, location })} />
            <Input label="AREA" value={draft.area} placeholder="Neighbourhood" onChangeText={(area) => onDraft({ ...draft, area })} />
            <View style={styles.editorPair}><View style={styles.editorHalf}><Input label="BUDGET" value={draft.price} onChangeText={(price) => onDraft({ ...draft, price })} /></View><View style={styles.editorHalf}><Input label="DURATION" value={draft.duration} onChangeText={(duration) => onDraft({ ...draft, duration })} /></View></View>
            <Input label="EVENT DATE (OPTIONAL)" value={draft.eventDate} placeholder="Saturday · 6:00 PM" onChangeText={(eventDate) => onDraft({ ...draft, eventDate })} />
            <View style={styles.prototypeNote}><Text style={styles.prototypeNoteTitle}>Prototype shortcut</Text><Text style={styles.prototypeNoteText}>The saved item uses a placeholder image and remains in memory until the app reloads. Uploads, source links, and precise dates come with the real backend.</Text></View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

function Input({ label, multiline, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.inputGroup}><Text style={styles.inputLabel}>{label}</Text><TextInput style={[styles.textInput, multiline && styles.multilineInput]} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} placeholderTextColor="#a59ba0" {...props} /></View>
}

function PrimaryButton({ label, onPress, dark, disabled }: { label: string; onPress: () => void; dark?: boolean; disabled?: boolean }) {
  return <Pressable style={[styles.primaryButton, dark && styles.primaryButtonDark, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{label}  →</Text></Pressable>
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  app: { flex: 1 },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.sage, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.35 },
  pageTitle: { marginTop: 6, color: colors.ink, fontFamily: serif, fontSize: 42, lineHeight: 43, fontWeight: '500', letterSpacing: -1.5 },
  avatar: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.paper, borderRadius: 23, backgroundColor: colors.sage },
  avatarText: { color: 'white', fontWeight: '800' },
  hero: { height: 470, justifyContent: 'flex-end' },
  heroImage: { borderRadius: 24 },
  heroShade: { position: 'absolute', inset: 0, borderRadius: 24, backgroundColor: 'rgba(40, 31, 35, 0.34)' },
  heroCopy: { padding: 24 },
  heroPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroPillText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { maxWidth: 330, marginTop: 16, color: 'white', fontFamily: serif, fontSize: 39, lineHeight: 39, fontWeight: '500', letterSpacing: -1.2 },
  heroText: { maxWidth: 330, marginTop: 9, marginBottom: 20, color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 21 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingHorizontal: 17, backgroundColor: colors.coral },
  primaryButtonDark: { backgroundColor: colors.ink },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  filters: { gap: 9, paddingVertical: 26 },
  chip: { height: 39, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 99, backgroundColor: colors.paper },
  chipActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: 'white' },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { marginTop: 3, color: colors.ink, fontFamily: serif, fontSize: 27, fontWeight: '500' },
  countLabel: { color: colors.muted, fontSize: 11 },
  ideaCard: { overflow: 'hidden', marginBottom: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.paper },
  cardPhoto: { height: 205, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 12 },
  cardPhotoImage: { borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  dateBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(36,30,34,0.75)' },
  priceBadge: { marginLeft: 'auto', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(36,30,34,0.75)' },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
  cardCopy: { padding: 16 },
  cardTitle: { marginTop: 4, color: colors.ink, fontFamily: serif, fontSize: 23, fontWeight: '600' },
  cardMeta: { marginTop: 5, color: colors.muted, fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.line },
  cardDuration: { color: colors.muted, fontSize: 11 },
  addButton: { minHeight: 33, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.coralSoft },
  addButtonSelected: { backgroundColor: colors.sage },
  addButtonText: { color: colors.coral, fontSize: 11, fontWeight: '800' },
  addButtonTextSelected: { color: 'white' },
  tabBar: { height: 74, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: { color: colors.muted, fontSize: 20, lineHeight: 22 },
  tabLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  tabActive: { color: colors.coral },
  tabBadge: { position: 'absolute', top: -5, right: -11, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.coral },
  tabBadgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
  detailScreen: { flex: 1, backgroundColor: colors.paper },
  detailContent: { paddingBottom: 105 },
  detailPhoto: { height: 390, justifyContent: 'space-between', padding: 20 },
  detailShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(30,22,26,0.12)' },
  backButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.9)' },
  backButtonText: { color: colors.ink, fontSize: 23 },
  kindBadge: { alignSelf: 'flex-end', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(48,41,47,0.75)' },
  kindBadgeText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  detailCopy: { padding: 22 },
  detailTitle: { marginTop: 5, color: colors.ink, fontFamily: serif, fontSize: 42, lineHeight: 43, letterSpacing: -1.3 },
  detailDescription: { marginTop: 16, color: colors.muted, fontSize: 15, lineHeight: 24 },
  factCard: { marginTop: 22, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.cream },
  fact: { padding: 15 },
  factLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  factValue: { marginTop: 4, color: colors.ink, fontSize: 14, fontWeight: '700' },
  factNote: { marginTop: 2, color: colors.muted, fontSize: 11 },
  factDivider: { height: 1, marginHorizontal: 15, backgroundColor: colors.line },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 18 },
  tag: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, backgroundColor: colors.sageSoft },
  tagText: { color: colors.sage, fontSize: 10, fontWeight: '700' },
  detailActions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 9, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper },
  secondaryButton: { flex: 0.8, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
  secondaryButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  darkButton: { flex: 1.2, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.ink },
  darkButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9, marginBottom: 13 },
  stepNumber: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.sage },
  stepNumberText: { color: 'white', fontSize: 11, fontWeight: '800' },
  stepTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  stepSubtitle: { marginTop: 2, color: colors.muted, fontSize: 11 },
  planList: { gap: 8, marginBottom: 23 },
  planItem: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.paper },
  planImage: { width: 64, height: 60, borderRadius: 11 },
  planCopy: { flex: 1 },
  planTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  planMeta: { marginTop: 4, color: colors.muted, fontSize: 10 },
  removeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.cream },
  removeText: { color: colors.muted, fontSize: 20 },
  addOption: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(48,41,47,0.26)', borderRadius: 15 },
  addOptionText: { color: colors.sage, fontSize: 12, fontWeight: '800' },
  dayRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  dayOption: { flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.paper },
  dayOptionActive: { borderColor: colors.sage, backgroundColor: colors.sage },
  dayName: { color: colors.muted, fontSize: 10 },
  dayDate: { marginTop: 3, color: colors.ink, fontFamily: serif, fontSize: 17, fontWeight: '600' },
  dayTime: { marginTop: 3, color: colors.muted, fontSize: 9 },
  onDark: { color: 'white' },
  onDarkMuted: { color: 'rgba(255,255,255,0.76)' },
  inputLabel: { marginBottom: 7, color: colors.ink, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  noteInput: { minHeight: 105, padding: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 14, color: colors.ink, backgroundColor: colors.paper, fontSize: 13, lineHeight: 20 },
  privacyNote: { flexDirection: 'row', gap: 12, marginVertical: 18, padding: 15, borderRadius: 15, backgroundColor: colors.sageSoft },
  privacyIcon: { color: colors.sage, fontSize: 22 },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: '#405248', fontSize: 12, fontWeight: '800' },
  privacyText: { marginTop: 3, color: '#607166', fontSize: 10, lineHeight: 15 },
  successContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 70 },
  successMark: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderRadius: 35, backgroundColor: colors.sage },
  successMarkText: { color: 'white', fontSize: 30 },
  successTitle: { marginTop: 8, color: colors.ink, fontFamily: serif, fontSize: 43, letterSpacing: -1.3 },
  successText: { marginTop: 15, marginBottom: 22, color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  shareCard: { width: '100%', marginBottom: 12, padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.paper },
  shareLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  shareLink: { marginTop: 5, color: colors.ink, fontSize: 14, fontWeight: '700' },
  resetButton: { marginTop: 10, padding: 12 },
  resetButtonText: { color: colors.sage, fontSize: 12, fontWeight: '800' },
  headerAdd: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.coral },
  headerAddText: { color: 'white', fontSize: 23 },
  statsRow: { flexDirection: 'row', gap: 7, marginBottom: 21 },
  stat: { flex: 1, padding: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.paper },
  statValue: { color: colors.ink, fontFamily: serif, fontSize: 26 },
  statLabel: { marginTop: 2, color: colors.muted, fontSize: 9 },
  managementList: { gap: 9 },
  managementItem: { minHeight: 91, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.paper },
  managementImage: { width: 66, height: 68, borderRadius: 11 },
  managementCopy: { flex: 1, minWidth: 0 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.cream },
  statusLive: { backgroundColor: colors.sageSoft },
  statusText: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  statusTextLive: { color: colors.sage },
  managementTitle: { marginTop: 5, color: colors.ink, fontSize: 12, fontWeight: '800' },
  managementMeta: { marginTop: 3, color: colors.muted, fontSize: 9, textTransform: 'capitalize' },
  managementButtons: { alignItems: 'flex-end', gap: 10 },
  actionText: { color: colors.sage, fontSize: 10, fontWeight: '800' },
  coupleCard: { alignItems: 'center', padding: 33, borderRadius: 23, backgroundColor: colors.coralSoft },
  avatarStack: { flexDirection: 'row', marginLeft: 18 },
  memberAvatar: { width: 67, height: 67, alignItems: 'center', justifyContent: 'center', marginLeft: -18, borderWidth: 4, borderColor: 'rgba(255,255,255,0.78)', borderRadius: 34 },
  firstAvatar: { backgroundColor: colors.coral },
  secondAvatar: { backgroundColor: colors.sage },
  memberAvatarText: { color: 'white', fontFamily: serif, fontSize: 21 },
  coupleTitle: { marginTop: 15, color: colors.ink, fontFamily: serif, fontSize: 28 },
  coupleText: { marginTop: 6, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  memberPill: { marginTop: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.58)' },
  memberPillText: { color: colors.ink, fontSize: 9, fontWeight: '800' },
  googleCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 17, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.paper },
  googleMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  googleLetter: { color: '#4285f4', fontSize: 17, fontWeight: '900' },
  googleCopy: { flex: 1 },
  googleTitle: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  googleText: { marginTop: 3, color: colors.muted, fontSize: 9, lineHeight: 13 },
  googleAction: { color: colors.coral, fontSize: 10, fontWeight: '800' },
  settingsList: { overflow: 'hidden', marginTop: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 16 },
  setting: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paper },
  settingLast: { borderBottomWidth: 0 },
  settingIcon: { width: 28, color: colors.sage, fontSize: 19, textAlign: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  settingNote: { marginTop: 2, color: colors.muted, fontSize: 9 },
  chevron: { color: colors.muted, fontSize: 24 },
  prototypeCaption: { marginTop: 14, color: colors.muted, fontSize: 9, textAlign: 'center' },
  modalSafe: { flex: 1, backgroundColor: colors.cream },
  editorContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 45 },
  modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingVertical: 7 },
  modalTitle: { color: colors.ink, fontFamily: serif, fontSize: 20, fontWeight: '600' },
  cancelText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  saveText: { color: colors.coral, fontSize: 12, fontWeight: '800' },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9, marginBottom: 9 },
  kindChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 99, backgroundColor: colors.paper },
  kindChipActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  kindChipText: { color: colors.ink, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  kindChipTextActive: { color: 'white' },
  inputGroup: { marginTop: 15 },
  textInput: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 13, color: colors.ink, backgroundColor: colors.paper, fontSize: 13 },
  multilineInput: { minHeight: 105, paddingTop: 13, lineHeight: 19 },
  editorPair: { flexDirection: 'row', gap: 10 },
  editorHalf: { flex: 1 },
  prototypeNote: { marginTop: 19, padding: 15, borderRadius: 14, backgroundColor: colors.sageSoft },
  prototypeNoteTitle: { color: '#405248', fontSize: 11, fontWeight: '800' },
  prototypeNoteText: { marginTop: 4, color: '#607166', fontSize: 10, lineHeight: 15 },
})
