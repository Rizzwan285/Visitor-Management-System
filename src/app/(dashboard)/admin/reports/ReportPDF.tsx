import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    color: '#555',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryBox: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  col1: { width: '22%', paddingRight: 4 },
  col2: { width: '18%', paddingRight: 4 },
  col3: { width: '12%', paddingRight: 4 },
  col4: { width: '18%', paddingRight: 4 },
  col5: { width: '18%', paddingRight: 4 },
  col6: { width: '12%', paddingRight: 4 },
  th: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#475569',
  },
  td: {
    fontSize: 9,
    color: '#334155',
  },
});

type SummaryData = {
    total: number;
    byType: {
        STUDENT_GUEST: number;
        EMPLOYEE_GUEST: number;
        OFFICIAL: number;
        STUDENT_EXIT: number;
        WALKIN: number;
    };
    byStatus: {
        ACTIVE: number;
        APPROVED: number;
        PENDING_APPROVAL: number;
        EXPIRED: number;
        CANCELLED: number;
        REJECTED: number;
        DRAFT: number;
    };
};

export const ReportPDF = ({ summary, passes }: { summary: SummaryData | null, passes: any[] }) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>Visitor Management System</Text>
                    <Text style={styles.subtitle}>Analytics & Report - {new Date().toLocaleDateString()}</Text>
                </View>

                {summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Summary</Text>
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLabel}>Total Passes Generate</Text>
                                <Text style={styles.summaryValue}>{summary.total}</Text>
                            </View>
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLabel}>Guest Passes</Text>
                                <Text style={styles.summaryValue}>{summary.byType.STUDENT_GUEST + summary.byType.EMPLOYEE_GUEST}</Text>
                            </View>
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLabel}>Exit / Walk-in / Official</Text>
                                <Text style={styles.summaryValue}>{summary.byType.STUDENT_EXIT} / {summary.byType.WALKIN} / {summary.byType.OFFICIAL}</Text>
                            </View>
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryLabel}>Active / Pending / Rejected</Text>
                                <Text style={styles.summaryValue}>{summary.byStatus.ACTIVE} / {summary.byStatus.PENDING_APPROVAL} / {summary.byStatus.REJECTED}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detailed Pass Logs</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.col1, styles.th]}>Pass Number</Text>
                            <Text style={[styles.col2, styles.th]}>Pass Type</Text>
                            <Text style={[styles.col3, styles.th]}>Status</Text>
                            <Text style={[styles.col4, styles.th]}>Visitor Name</Text>
                            <Text style={[styles.col5, styles.th]}>Created By</Text>
                            <Text style={[styles.col6, styles.th]}>Date</Text>
                        </View>
                        {passes.map((pass, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.col1, styles.td]}>{pass.passNumber}</Text>
                                <Text style={[styles.col2, styles.td]}>{pass.passType.replace('_', ' ')}</Text>
                                <Text style={[styles.col3, styles.td]}>{pass.status}</Text>
                                <Text style={[styles.col4, styles.td]}>{pass.visitorName || '-'}</Text>
                                <Text style={[styles.col5, styles.td]}>{pass.createdBy?.name || pass.createdBy?.email || '-'}</Text>
                                <Text style={[styles.col6, styles.td]}>{new Date(pass.createdAt).toLocaleDateString()}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
