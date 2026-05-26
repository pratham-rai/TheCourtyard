import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Linking, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';
import api from '../services/api';
import BottomTabBar from '../components/BottomTabBar';

const { width } = Dimensions.get('window');

const mockCourts = [
  { name: 'Court 1', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600' },
  { name: 'Court 2', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600' },
  { name: 'Court 3', surface: 'Professional Acrylic Cushion', basePrice: 800, peakPrice: 1200, image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=600' },
];

const mockCoaches = [
  { name: 'Coach Pratham Raj', specialization: ['Advanced Dinking', 'Spin Serves'], experience: 8, rating: 4.9, pricePerSession: 1500, image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=600' },
  { name: 'Coach Sarah Jenkins', specialization: ['Beginner Foundations', 'Tactical Positioning'], experience: 6, rating: 4.8, pricePerSession: 1200, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600' },
  { name: 'Coach David Miller', specialization: ['Kitchen Reflex Battles', 'Tournament Mindset'], experience: 10, rating: 5.0, pricePerSession: 1800, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600' },
];

const mockTournaments = [
  { title: 'The Courtyard Summer Smash 2026', date: '2026-06-15', prizePool: '₹50,000 Cash + Trophy', entryFee: 999, image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600' },
  { title: 'Kitchen Finesse & Dink Master Cup', date: '2026-07-02', prizePool: '₹25,000 Gear', entryFee: 499, image: 'https://images.unsplash.com/photo-1526676082484-64c99730ee35?q=80&w=600' },
];

const faqData = [
  { q: 'How do I book a court?', a: 'Head to Book Courts, select your court, date, and time slot, then complete payment. You\'ll receive an instant QR check-in pass.' },
  { q: 'What are peak vs off-peak hours?', a: 'Off-peak: 9:00 AM – 5:00 PM. Peak: 6:00–9:00 AM and 5:00–10:00 PM. Peak hours attract higher rates due to floodlight usage and demand.' },
  { q: 'Can I cancel my booking?', a: 'Yes! Cancellations up to 12 hours before your session can be done from your Dashboard under Upcoming Bookings.' },
  { q: 'Do you offer paddle rentals?', a: 'Yes! Premium carbon-fiber paddles available for ₹100/session at the club desk. Tournament-grade balls are complimentary.' },
  { q: 'How do membership discounts work?', a: 'Basic (10%), Pro (25%), and Elite (100% free courts). Discounts apply automatically at checkout based on your active tier.' },
];

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [courts, setCourts] = useState(mockCourts);
  const [coaches, setCoaches] = useState(mockCoaches);
  const [tournaments, setTournaments] = useState(mockTournaments);
  const [activeFaq, setActiveFaq] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for hero glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Fetch live data
    const fetchData = async () => {
      try {
        const [courtsRes, coachesRes, tourRes] = await Promise.all([
          api.get('/api/courts'),
          api.get('/api/coaching/coaches'),
          api.get('/api/tournaments'),
        ]);
        if (courtsRes.data?.length) setCourts(courtsRes.data);
        if (coachesRes.data?.length) setCoaches(coachesRes.data);
        if (tourRes.data?.length) setTournaments(tourRes.data);
      } catch (err) {
        // Use mock fallbacks
      }
    };
    fetchData();
  }, []);

  const navigateTo = (route) => {
    if (!user) {
      router.push('/(auth)/login');
    } else {
      router.push(route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── TOP APP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.topLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.topBrand}>THE COURTYARD</Text>
            <Text style={styles.topTagline}>Mangaluru's #1 Club</Text>
          </View>
        </View>
        {user ? (
          <TouchableOpacity style={styles.topLoginBtn} onPress={logout}>
            <Text style={styles.topLoginText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.topLoginBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.topLoginText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HERO SECTION ── */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200' }}
          style={styles.heroBg}
          blurRadius={2}
        />
        <LinearGradient
          colors={['rgba(8,8,12,0.6)', 'rgba(8,8,12,0.85)', colors.background]}
          style={styles.heroGradient}
        />

        {/* Glow circles */}
        <Animated.View style={[styles.glowCircle1, { transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.glowCircle2, { transform: [{ scale: pulseAnim }] }]} />

        <View style={styles.heroContent}>
          {/* Logo + Badge */}
          <View style={styles.heroLogoRow}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🧭 Redefining Sports Luxury</Text>
          </View>

          <Text style={styles.heroTitle}>
            Welcome to{'\n'}
            <Text style={styles.heroTitleAccent}>The Courtyard</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Step onto pristine glass cushion surfaces, enjoy elite coaching, and join Mangaluru's ultimate pickleball community.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => navigateTo('/(player)/bookings')}
            >
              <Text style={styles.ctaPrimaryText}>📅 Book a Court</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => navigateTo('/(player)/coaching')}
            >
              <Text style={styles.ctaSecondaryText}>🎾 Coaching</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '3 Pro', label: 'Acrylic Courts' },
              { value: '3 Expert', label: 'Certified Coaches' },
              { value: '24/7', label: 'Live Bookings' },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={[styles.statValue, { color: i === 1 ? colors.electricBlue : i === 2 ? '#fff' : colors.neonGreen }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── COURTS SECTION ── */}
      <View style={styles.section}>
        <SectionHeader tag="Live Court Selection" title="Arena Overview" color={colors.neonGreen} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {courts.map((court, idx) => (
            <View key={idx} style={styles.courtCard}>
              <Image source={{ uri: court.image }} style={styles.courtImage} />
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>Live Available</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{court.name}</Text>
                <Text style={styles.cardSurface}>{court.surface}</Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Hourly Price</Text>
                    <Text style={styles.priceValue}>₹{court.basePrice}<Text style={styles.priceUnit}> /hr</Text></Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reserveBtn}
                    onPress={() => navigateTo('/(player)/bookings')}
                  >
                    <Text style={styles.reserveBtnText}>Reserve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── COACHES SECTION ── */}
      <View style={[styles.section, styles.sectionDark]}>
        <SectionHeader tag="Championship Formations" title="Certified Coaches" color={colors.electricBlue} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {coaches.map((coach, idx) => (
            <View key={idx} style={styles.coachCard}>
              <Image source={{ uri: coach.image }} style={styles.coachImage} />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {coach.rating}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{coach.name}</Text>
                <Text style={[styles.cardSurface, { color: colors.electricBlue }]}>
                  {coach.experience}+ Years Experience
                </Text>
                <View style={styles.specRow}>
                  {(coach.specialization || []).slice(0, 2).map((spec, si) => (
                    <View key={si} style={styles.specTag}>
                      <Text style={styles.specText}>{spec}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Session Charge</Text>
                    <Text style={styles.priceValue}>₹{coach.pricePerSession}<Text style={styles.priceUnit}> /hr</Text></Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.reserveBtn, { backgroundColor: colors.electricBlue }]}
                    onPress={() => navigateTo('/(player)/coaching')}
                  >
                    <Text style={styles.reserveBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── MEMBERSHIP PLANS ── */}
      <View style={styles.section}>
        <SectionHeader tag="Exclusive Access Perks" title="Membership Plans" color={colors.neonGreen} />

        {/* Basic */}
        <MembershipCard
          title="Basic Tier"
          subtitle="Perfect for weekend recreational play"
          price="₹999"
          color="rgba(255,255,255,0.1)"
          borderColor="rgba(255,255,255,0.07)"
          btnColor="rgba(255,255,255,0.1)"
          btnTextColor="#fff"
          btnLabel="Join Basic"
          checkColor={colors.neonGreen}
          perks={['10% discount on all court bookings', 'Book up to 3 days in advance', '1 free monthly guest pass']}
          onPress={() => navigateTo('/(player)/membership')}
        />

        {/* Pro */}
        <MembershipCard
          title="Pro Tier"
          subtitle="For dedicated competitive athletes"
          price="₹1,999"
          color="rgba(0,229,255,0.02)"
          borderColor="rgba(0,229,255,0.3)"
          btnColor={colors.electricBlue}
          btnTextColor="#000"
          btnLabel="Upgrade to Pro"
          checkColor={colors.electricBlue}
          badge="Most Popular"
          badgeColor={colors.electricBlue}
          perks={['25% discount on court bookings', '10% off coaching sessions', 'Book up to 7 days in advance', 'Premium locker & shower access']}
          onPress={() => navigateTo('/(player)/membership')}
        />

        {/* Elite */}
        <MembershipCard
          title="Elite Club"
          subtitle="Ultimate sports luxury & freedom"
          price="₹4,999"
          color="rgba(57,255,20,0.02)"
          borderColor="rgba(57,255,20,0.3)"
          btnColor={colors.neonGreen}
          btnTextColor="#000"
          btnLabel="Unlock Elite Club"
          checkColor={colors.neonGreen}
          badge="Ultimate"
          badgeColor={colors.neonGreen}
          perks={['100% FREE court bookings (off-peak)', '20% discount on all coaching', 'Book up to 14 days in advance', 'Free tournament entries']}
          onPress={() => navigateTo('/(player)/membership')}
        />
      </View>

      {/* ── TOURNAMENTS ── */}
      <View style={[styles.section, styles.sectionDark]}>
        <SectionHeader tag="Live Tournament Cups" title="Events & Leagues" color={colors.neonGreen} />
        {tournaments.map((tour, idx) => (
          <View key={idx} style={styles.tournamentCard}>
            <Image source={{ uri: tour.image }} style={styles.tournamentImage} />
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
            <View style={styles.tournamentBody}>
              <Text style={styles.tournamentDate}>📅 {tour.date}</Text>
              <Text style={styles.tournamentTitle}>{tour.title}</Text>
              <View style={styles.tournamentFooter}>
                <View>
                  <Text style={styles.prizeLabel}>Prize Pool</Text>
                  <Text style={styles.prizeValue}>{tour.prizePool}</Text>
                </View>
                <TouchableOpacity
                  style={styles.enterBtn}
                  onPress={() => navigateTo('/(player)/tournaments')}
                >
                  <Text style={styles.enterBtnText}>Enter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── LOCATION ── */}
      <View style={styles.section}>
        <SectionHeader tag="Find The Club" title="Location & Schedule" color={colors.electricBlue} />

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Text style={{ fontSize: 24 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Location Address</Text>
            <Text style={styles.locationText}>
              Megina Mane, Kandettu Rd, Kadri Hills, Bikarnakatte Kaikamba, Padavu, Mangaluru, Karnataka 575005
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://maps.app.goo.gl/pwoVYiwghnCQ6jkc8')}
            >
              <Text style={styles.directionsLink}>Get Directions →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Text style={{ fontSize: 24 }}>🕐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Play Timings</Text>
            <Text style={styles.locationText}>Monday – Sunday: <Text style={{ color: '#fff', fontFamily: 'Outfit_700Bold' }}>6:00 AM – 10:00 PM</Text></Text>
            <Text style={[styles.locationText, { fontSize: 11, marginTop: 4 }]}>
              Floodlights active 5:00 PM – 10:00 PM.
            </Text>
          </View>
        </View>

        {/* Map button */}
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => Linking.openURL('https://maps.app.goo.gl/pwoVYiwghnCQ6jkc8')}
        >
          <LinearGradient
            colors={['rgba(0,229,255,0.1)', 'rgba(0,229,255,0.05)']}
            style={styles.mapBtnInner}
          >
            <Text style={styles.mapBtnText}>🗺️  Open in Google Maps</Text>
            <Text style={styles.mapBtnSub}>Bikarnakatte Club Arena, Mangaluru</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── FAQ SECTION ── */}
      <View style={[styles.section, styles.sectionDark, { paddingBottom: 60 }]}>
        <SectionHeader tag="Have Queries?" title="Club FAQs" color={colors.neonGreen} />
        {faqData.map((faq, idx) => {
          const isOpen = activeFaq === idx;
          return (
            <View key={idx} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => setActiveFaq(isOpen ? null : idx)}
              >
                <Text style={styles.faqQ}>❓ {faq.q}</Text>
                <Text style={styles.faqToggle}>{isOpen ? '−' : '+'}</Text>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqA}>{faq.a}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

// ── Reusable Components ──

function SectionHeader({ tag, title, color }) {
  return (
    <View style={sectionHeaderStyles.container}>
      <Text style={[sectionHeaderStyles.tag, { color }]}>{tag}</Text>
      <Text style={sectionHeaderStyles.title}>{title}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  tag: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Outfit_700Bold' },
  title: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 26, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'center' },
});

function MembershipCard({ title, subtitle, price, color, borderColor, btnColor, btnTextColor, btnLabel, checkColor, badge, badgeColor, perks, onPress }) {
  return (
    <View style={[membershipStyles.card, { backgroundColor: color, borderColor }]}>
      {badge && (
        <View style={[membershipStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={membershipStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={membershipStyles.title}>{title}</Text>
      <Text style={[membershipStyles.subtitle, { color: badgeColor || colors.muted }]}>{subtitle}</Text>
      <Text style={membershipStyles.price}>{price}<Text style={membershipStyles.priceUnit}> / month</Text></Text>
      <View style={membershipStyles.divider} />
      {perks.map((perk, i) => (
        <View key={i} style={membershipStyles.perkRow}>
          <Text style={[membershipStyles.checkmark, { color: checkColor }]}>✓</Text>
          <Text style={membershipStyles.perkText}>{perk}</Text>
        </View>
      ))}
      <TouchableOpacity style={[membershipStyles.btn, { backgroundColor: btnColor }]} onPress={onPress}>
        <Text style={[membershipStyles.btnText, { color: btnTextColor }]}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const membershipStyles = StyleSheet.create({
  card: {
    borderWidth: 1, borderRadius: 20, padding: 24,
    marginBottom: 16, position: 'relative', overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 14, paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  badgeText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },
  price: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 32, marginTop: 16 },
  priceUnit: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  checkmark: { fontFamily: 'Outfit_700Bold', fontSize: 14, marginTop: 1 },
  perkText: { color: '#d1d5db', fontFamily: 'Outfit_400Regular', fontSize: 13, flex: 1 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(8,8,12,0.98)',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLogo: { width: 36, height: 36, borderRadius: 8 },
  topBrand: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  topTagline: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  topLoginBtn: {
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.4)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  topLoginText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Hero
  hero: { minHeight: 680, position: 'relative', justifyContent: 'flex-end' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  glowCircle1: {
    position: 'absolute', top: 100, left: -40,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(57,255,20,0.08)',
  },
  glowCircle2: {
    position: 'absolute', bottom: 100, right: -40,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  heroContent: { padding: 24, paddingTop: 40, paddingBottom: 40, zIndex: 10 },
  heroLogoRow: { alignItems: 'center', marginBottom: 20 },
  heroLogo: { width: 80, height: 80, borderRadius: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20,
  },
  badgeText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  heroTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 40, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 48, marginBottom: 16 },
  heroTitleAccent: { color: 'transparent' },
  heroSubtitle: { color: '#d1d5db', fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 24, marginBottom: 28 },
  ctaRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  ctaPrimary: {
    flex: 1, backgroundColor: colors.neonGreen, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.neonGreen, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  ctaPrimaryText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  ctaSecondary: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  ctaSecondaryText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 16, textAlign: 'center' },
  statLabel: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 },

  // Sections
  section: { padding: 24 },
  sectionDark: { backgroundColor: 'rgba(18,18,26,0.5)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  horizontalScroll: { marginHorizontal: -24, paddingHorizontal: 24 },

  // Court card
  courtCard: {
    width: width * 0.72, marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, overflow: 'hidden',
  },
  courtImage: { width: '100%', height: 180 },
  availableBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  availableBadgeText: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },

  // Coach card
  coachCard: {
    width: width * 0.72, marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, overflow: 'hidden',
  },
  coachImage: { width: '100%', height: 200 },
  ratingBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  ratingText: { color: '#facc15', fontFamily: 'Outfit_700Bold', fontSize: 11 },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  specTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  specText: { color: '#d1d5db', fontFamily: 'Outfit_400Regular', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Shared card body
  cardBody: { padding: 16 },
  cardTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16 },
  cardSurface: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  priceLabel: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  priceValue: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 18, marginTop: 2 },
  priceUnit: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12 },
  reserveBtn: {
    backgroundColor: colors.neonGreen, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  reserveBtnText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Tournament
  tournamentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, overflow: 'hidden', marginBottom: 16,
  },
  tournamentImage: { width: '100%', height: 160 },
  openBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: colors.neonGreen, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  openBadgeText: { color: '#000', fontFamily: 'Outfit_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  tournamentBody: { padding: 16 },
  tournamentDate: { color: colors.neonGreen, fontFamily: 'Outfit_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tournamentTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, marginTop: 4 },
  tournamentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  prizeLabel: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  prizeValue: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, marginTop: 2 },
  enterBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  enterBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Location
  locationCard: {
    flexDirection: 'row', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 20, marginBottom: 14,
  },
  locationIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(0,229,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  locationTitle: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  locationText: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 4, lineHeight: 18 },
  directionsLink: { color: colors.electricBlue, fontFamily: 'Outfit_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  mapBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', marginTop: 8 },
  mapBtnInner: { padding: 20, alignItems: 'center' },
  mapBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14 },
  mapBtnSub: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 4 },

  // FAQ
  faqCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, marginBottom: 12, overflow: 'hidden',
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  faqQ: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 13, flex: 1, paddingRight: 12 },
  faqToggle: { color: colors.muted, fontFamily: 'Outfit_700Bold', fontSize: 20 },
  faqBody: { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  faqA: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 20, marginTop: 12 },
});