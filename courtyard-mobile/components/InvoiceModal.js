import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors } from '../constants/theme';
import { GlassPanel } from './ui';

export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  if (!isOpen || !invoiceData) return null;

  const handleDownload = () => {
    Alert.alert('Success', 'Invoice downloaded successfully (Simulated).');
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.brandTitle}>THE COURTYARD</Text>
                <Text style={styles.brandTagline}>Premium Sports Club</Text>
              </View>
              <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceBadgeText}>INVOICE</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Info Section */}
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.label}>Invoice No.</Text>
                <Text style={styles.value}>{invoiceData.invoiceNo}</Text>
                <Text style={[styles.label, { marginTop: 8 }]}>Date Issued</Text>
                <Text style={styles.value}>{invoiceData.date}</Text>
              </View>
              <View style={styles.infoColRight}>
                <Text style={styles.label}>Billed To</Text>
                <Text style={styles.value}>{invoiceData.member.name}</Text>
                <Text style={styles.subValue}>{invoiceData.member.email}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>{invoiceData.member.membership} Member</Text>
                </View>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 2 }]}>DESCRIPTION</Text>
              <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
            </View>

            {/* Items */}
            {invoiceData.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.itemText, { flex: 2 }]}>{item.description}</Text>
                <Text style={[styles.itemText, { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
                <Text style={[styles.itemText, { flex: 1.5, textAlign: 'right' }]}>₹{item.rate.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Calculations */}
            <View style={styles.calcContainer}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal</Text>
                <Text style={styles.calcValue}>₹{invoiceData.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>CGST & SGST ({invoiceData.taxRate}%)</Text>
                <Text style={styles.calcValue}>₹{((invoiceData.subtotal * invoiceData.taxRate) / 100).toFixed(2)}</Text>
              </View>
              {invoiceData.discount > 0 && (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.neonGreen }]}>Discount</Text>
                  <Text style={[styles.calcValue, { color: colors.neonGreen }]}>-₹{invoiceData.discount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.calcRowTotal}>
                <Text style={styles.totalLabel}>Total Amount Paid</Text>
                <Text style={styles.totalValue}>₹{invoiceData.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.paymentInfo}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{invoiceData.paymentMethod.toUpperCase()}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>● Paid</Text>
              </View>
            </View>

            {/* CTAs */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Text style={styles.downloadBtnText}>↓ Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
  },
  scroll: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    color: '#000',
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    letterSpacing: 2,
  },
  brandTagline: {
    color: '#666',
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  invoiceBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  invoiceBadgeText: {
    color: '#374151',
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    color: '#6b7280',
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    color: '#111827',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },
  subValue: {
    color: '#6b7280',
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  memberBadge: {
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  memberBadgeText: {
    color: '#000',
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  tableCol: {
    color: '#6b7280',
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemText: {
    color: '#111827',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  calcContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  calcRow: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-between',
  },
  calcLabel: {
    color: '#6b7280',
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
  },
  calcValue: {
    color: '#111827',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  calcRowTotal: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    color: '#111827',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },
  totalValue: {
    color: '#111827',
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
  },
  paymentInfo: {
    marginTop: 24,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  statusRow: {
    marginTop: 8,
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#166534',
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#374151',
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
