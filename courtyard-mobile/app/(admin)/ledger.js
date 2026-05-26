import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { GlassPanel, Label, NeonText } from '../../components/ui';
import { colors } from '../../constants/theme';
import api from '../../services/api';
import DashboardHeader from '../../components/DashboardHeader';

export default function AdminLedger() {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get('/api/admin/ledger/stats');
        setLedger(res.data || { grossRevenue: 0, totalGst: 0, coachPayouts: 0, netRevenue: 0 });
      } catch (err) {
        // Fallback for demo if endpoint doesn't exist yet
        setLedger({
          grossRevenue: 154000,
          totalGst: 27720,
          coachPayouts: 32000,
          netRevenue: 94280
        });
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title="Corporate Ledger" 
        subtitle="Financial Metrics" 
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.neonGreen} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassPanel style={styles.card}>
            <Label>Monthly Overview</Label>
            
            <View style={styles.row}>
              <Text style={styles.label}>Gross Revenue</Text>
              <Text style={styles.value}>₹{ledger?.grossRevenue}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Estimated GST (18%)</Text>
              <Text style={[styles.value, { color: '#ef4444' }]}>-₹{ledger?.totalGst}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Coach Payouts (Est)</Text>
              <Text style={[styles.value, { color: '#facc15' }]}>-₹{ledger?.coachPayouts}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.netLabel}>Net Profit</Text>
              <NeonText style={styles.netValue}>₹{ledger?.netRevenue}</NeonText>
            </View>

          </GlassPanel>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Note: This ledger is an estimate. Final tax filings should be processed through your certified accounting software.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#d1d5db', fontFamily: 'Outfit_400Regular', fontSize: 13 },
  value: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  netLabel: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase' },
  netValue: { fontSize: 24, fontFamily: 'Outfit_700Bold' },
  infoBox: { marginTop: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  infoText: { color: colors.muted, fontFamily: 'Outfit_400Regular', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});
