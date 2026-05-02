import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import colors from '../../styles/colors';
import { buildFileUrl } from '../../utils/media';

const TIME_SLOTS = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
];

const OCCASIONS = [
    { key: '', label: 'None' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'anniversary', label: 'Anniversary' },
    { key: 'business', label: 'Business' },
    { key: 'date', label: 'Date Night' },
    { key: 'family', label: 'Family' },
    { key: 'other', label: 'Other' },
];

const FALLBACK_TABLES = [
    { number: 1, capacity: 2, available: true },
    { number: 2, capacity: 2, available: true },
    { number: 3, capacity: 4, available: true },
    { number: 4, capacity: 4, available: true },
    { number: 5, capacity: 6, available: true },
    { number: 6, capacity: 6, available: true },
    { number: 7, capacity: 8, available: true },
    { number: 8, capacity: 10, available: true },
    { number: 9, capacity: 12, available: true },
    { number: 10, capacity: 20, available: true },
];

const mutedPlaceholder = colors.textMuted;
const primarySoft = '#DCFCE7';
const infoSoft = '#DBEAFE';

const pad2 = (value) => String(value).padStart(2, '0');

const toDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getDateOptions = () => {
    const opts = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        opts.push({
            value: toDateKey(d),
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        });
    }
    return opts;
};

const timeSlotToMinutes = (timeSlot) => {
    const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(timeSlot);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (hours === 12) hours = 0;
    if (period === 'PM') hours += 12;

    return hours * 60 + minutes;
};

const isPastSameDayTime = (dateKey, timeSlot) => {
    if (dateKey !== toDateKey(new Date())) return false;

    const slotMinutes = timeSlotToMinutes(timeSlot);
    if (slotMinutes === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= currentMinutes;
};

const getInitialReservationDateTime = () => {
    const dates = getDateOptions();
    const todaySlot = TIME_SLOTS.find((slot) => !isPastSameDayTime(dates[0].value, slot));

    if (todaySlot) {
        return { date: dates[0].value, timeSlot: todaySlot };
    }

    return { date: dates[1].value, timeSlot: TIME_SLOTS[0] };
};

const formatDate = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

export default function ReservationScreen({ navigation }) {
    const { user } = useAuth();
    const dateOptions = getDateOptions();
    const [myReservations, setMyReservations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availableTables, setAvailableTables] = useState(FALLBACK_TABLES);
    const [formErrors, setFormErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [confirmationPdf, setConfirmationPdf] = useState(null);
    const initialDateTime = useMemo(getInitialReservationDateTime, []);
    const [form, setForm] = useState({
        guestName: user?.name || '',
        guestPhone: user?.phone || '',
        guestEmail: user?.email || '',
        date: initialDateTime.date,
        timeSlot: initialDateTime.timeSlot,
        partySize: 2,
        tableNumber: '',
        specialRequests: '',
        occasion: '',
    });

    const availableTableCount = availableTables.filter((table) => table.available).length;
    const selectedTableLabel = useMemo(() => {
        if (!form.tableNumber) return 'Auto assign';
        const table = availableTables.find((item) => String(item.number) === String(form.tableNumber));
        return table ? `Table ${table.number}` : 'Selected table';
    }, [availableTables, form.tableNumber]);

    const updateForm = (updates) => {
        setMessage(null);
        setForm((current) => ({ ...current, ...updates }));
    };

    const pickConfirmationPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!result.canceled && result.assets?.[0]) {
                setConfirmationPdf(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Upload Error', 'Could not select the PDF file.');
        }
    };

    const validateForm = (currentForm, tables = availableTables) => {
        const errors = {};
        const partySize = Number(currentForm.partySize);
        const today = toDateKey(new Date());

        if (!currentForm.guestName.trim()) errors.guestName = 'Please enter your name';
        if (!currentForm.guestPhone.trim()) {
            errors.guestPhone = 'Please enter your phone number';
        } else if (!/^[0-9+\-\s()]{7,25}$/.test(currentForm.guestPhone.trim())) {
            errors.guestPhone = 'Enter a valid phone number';
        }
        if (currentForm.guestEmail.trim() && !/^\S+@\S+\.\S+$/.test(currentForm.guestEmail.trim())) {
            errors.guestEmail = 'Enter a valid email address';
        }
        if (!currentForm.date) errors.date = 'Please select a date';
        if (currentForm.date && currentForm.date < today) errors.date = 'Date cannot be in the past';
        if (!currentForm.timeSlot) errors.timeSlot = 'Please select a time';
        if (currentForm.timeSlot && !TIME_SLOTS.includes(currentForm.timeSlot)) {
            errors.timeSlot = 'Please select a valid time';
        }
        if (currentForm.date && currentForm.timeSlot && isPastSameDayTime(currentForm.date, currentForm.timeSlot)) {
            errors.timeSlot = 'Please select a future time for today';
        }
        if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
            errors.partySize = 'Guests must be a number from 1 to 20';
        }
        if (currentForm.tableNumber) {
            const selectedTable = tables.find((table) => String(table.number) === String(currentForm.tableNumber));
            if (!selectedTable) {
                errors.tableNumber = 'Please select a valid table';
            } else if (!selectedTable.available) {
                errors.tableNumber = `Table ${selectedTable.number} is not available at this time`;
            } else if (selectedTable.capacity < partySize) {
                errors.tableNumber = `Table ${selectedTable.number} only seats ${selectedTable.capacity}`;
            }
        }
        if (currentForm.specialRequests.length > 500) {
            errors.specialRequests = 'Special requests must be 500 characters or less';
        }

        return errors;
    };

    const fetchMyReservations = async () => {
        try {
            const res = await api.get('/api/reservations/my');
            setMyReservations(res.data.data || []);
        } catch (e) {
            setMessage({ type: 'error', text: e.userMessage || 'Could not load reservations' });
        } finally {
            setLoadingList(false);
        }
    };

    const fetchAvailability = async () => {
        if (!form.date || !form.timeSlot) return;

        setLoadingAvailability(true);
        try {
            const res = await api.get('/api/reservations/availability', {
                params: {
                    date: form.date,
                    timeSlot: form.timeSlot,
                    partySize: form.partySize,
                },
            });
            const tables = res.data?.data?.tables || FALLBACK_TABLES;
            setAvailableTables(tables);
            setFormErrors(validateForm(form, tables));
            if (form.tableNumber) {
                const selected = tables.find((table) => String(table.number) === String(form.tableNumber));
                if (!selected?.available) {
                    setForm((current) => ({ ...current, tableNumber: '' }));
                }
            }
        } catch (e) {
            const unavailable = FALLBACK_TABLES.map((table) => ({ ...table, available: false }));
            setAvailableTables(unavailable);
            setMessage({ type: 'error', text: e.userMessage || 'Could not check table availability' });
        } finally {
            setLoadingAvailability(false);
        }
    };

    useEffect(() => {
        fetchMyReservations();
    }, []);

    useEffect(() => {
        setFormErrors(validateForm(form));
    }, [form, availableTables]);

    useEffect(() => {
        const timer = setTimeout(fetchAvailability, 250);
        return () => clearTimeout(timer);
    }, [form.date, form.timeSlot, form.partySize]);

    const submitReservation = async () => {
        const errors = validateForm(form);
        setFormErrors(errors);
        setMessage(null);

        if (Object.keys(errors).length > 0) {
            setMessage({ type: 'error', text: Object.values(errors)[0] });
            return;
        }

        if (availableTableCount === 0) {
            setMessage({ type: 'error', text: 'No tables are available for the selected date and time' });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                guestName: form.guestName.trim(),
                guestPhone: form.guestPhone.trim(),
                guestEmail: form.guestEmail.trim(),
                tableNumber: form.tableNumber || undefined,
            };
            let res;
            if (confirmationPdf?.uri) {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;
                    formData.append(key, String(value));
                });

                const fileName = confirmationPdf.name || confirmationPdf.uri.split('/').pop() || `reservation-${Date.now()}.pdf`;
                formData.append('confirmationPdf', {
                    uri: confirmationPdf.uri,
                    name: fileName,
                    type: confirmationPdf.mimeType || 'application/pdf',
                });

                res = await api.post('/api/reservations', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                res = await api.post('/api/reservations', payload);
            }
            const reserved = res.data?.data;
            const tableText = reserved?.tableNumber ? ` at Table ${reserved.tableNumber}` : '';

            setMessage({
                type: 'success',
                text: `Reservation confirmed${tableText} for ${form.partySize} ${Number(form.partySize) === 1 ? 'guest' : 'guests'}.`,
            });
            Alert.alert('Reservation Confirmed', `Your table is booked for ${form.date} at ${form.timeSlot}${tableText}.`);
            setShowForm(false);
            setConfirmationPdf(null);
            await fetchMyReservations();
            await fetchAvailability();
        } catch (e) {
            const serverErrors = e.response?.data?.errors;
            if (serverErrors) setFormErrors(serverErrors);
            setMessage({ type: 'error', text: e.userMessage || e.response?.data?.message || 'Could not create reservation' });
        } finally {
            setSubmitting(false);
        }
    };

    const cancelReservation = (id) => {
        Alert.alert('Cancel Reservation', 'Are you sure you want to cancel this reservation?', [
            { text: 'Keep It' },
            {
                text: 'Cancel Reservation',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/api/reservations/${id}`);
                        setMessage({ type: 'success', text: 'Reservation cancelled' });
                        fetchMyReservations();
                        fetchAvailability();
                    } catch (e) {
                        Alert.alert('Error', e.userMessage || e.response?.data?.message || 'Could not cancel');
                    }
                },
            },
        ]);
    };

    const STATUS_DISPLAY = {
        pending: { label: 'Pending', color: colors.pending, icon: 'time-outline' },
        confirmed: { label: 'Confirmed', color: colors.confirmed, icon: 'checkmark-circle-outline' },
        seated: { label: 'Seated', color: colors.preparing, icon: 'restaurant-outline' },
        completed: { label: 'Completed', color: colors.success, icon: 'checkmark-done-outline' },
        cancelled: { label: 'Cancelled', color: colors.cancelled, icon: 'close-circle-outline' },
        'no-show': { label: 'No Show', color: colors.danger, icon: 'alert-circle-outline' },
    };

    const isSubmitDisabled = submitting || loadingAvailability || Object.keys(formErrors).length > 0 || availableTableCount === 0;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1A4F7A', '#0D3457']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>Table Reservation</Text>
                        <Text style={styles.headerSub}>Book your dining experience</Text>
                    </View>
                    <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(!showForm)}>
                        <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#FFF" />
                        <Text style={styles.newBtnText}>{showForm ? 'Cancel' : 'New'}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {message ? (
                    <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
                        <Ionicons
                            name={message.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                            size={18}
                            color={message.type === 'success' ? colors.success : colors.danger}
                        />
                        <Text style={[styles.messageText, { color: message.type === 'success' ? colors.success : colors.danger }]}>
                            {message.text}
                        </Text>
                    </View>
                ) : null}

                {showForm && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>New Reservation</Text>

                        <Text style={styles.fieldLabel}>Your Name</Text>
                        <View style={[styles.inputWrap, formErrors.guestName && styles.inputError]}>
                            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                value={form.guestName}
                                onChangeText={(v) => updateForm({ guestName: v })}
                                placeholder="Full name"
                                placeholderTextColor={mutedPlaceholder}
                            />
                        </View>
                        {formErrors.guestName ? <Text style={styles.errorText}>{formErrors.guestName}</Text> : null}

                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <View style={[styles.inputWrap, formErrors.guestPhone && styles.inputError]}>
                            <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                value={form.guestPhone}
                                onChangeText={(v) => updateForm({ guestPhone: v })}
                                placeholder="+94 xxx xxx xxxx"
                                placeholderTextColor={mutedPlaceholder}
                                keyboardType="phone-pad"
                            />
                        </View>
                        {formErrors.guestPhone ? <Text style={styles.errorText}>{formErrors.guestPhone}</Text> : null}

                        <Text style={styles.fieldLabel}>Email (Optional)</Text>
                        <View style={[styles.inputWrap, formErrors.guestEmail && styles.inputError]}>
                            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                value={form.guestEmail}
                                onChangeText={(v) => updateForm({ guestEmail: v })}
                                placeholder="you@example.com"
                                placeholderTextColor={mutedPlaceholder}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {formErrors.guestEmail ? <Text style={styles.errorText}>{formErrors.guestEmail}</Text> : null}

                        <Text style={styles.fieldLabel}>Select Date</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                            {dateOptions.map((d) => (
                                <TouchableOpacity
                                    key={d.value}
                                    style={[styles.datePill, form.date === d.value && styles.datePillActive]}
                                    onPress={() => updateForm({ date: d.value })}
                                >
                                    <Text style={[styles.datePillText, form.date === d.value && styles.datePillTextActive]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {formErrors.date ? <Text style={styles.errorText}>{formErrors.date}</Text> : null}

                        <Text style={styles.fieldLabel}>Select Time</Text>
                        <View style={styles.timeGrid}>
                            {TIME_SLOTS.map((t) => {
                                const disabled = isPastSameDayTime(form.date, t);
                                return (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.timeSlot, form.timeSlot === t && styles.timeSlotActive, disabled && styles.timeSlotDisabled]}
                                    onPress={() => updateForm({ timeSlot: t })}
                                    disabled={disabled}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        form.timeSlot === t && styles.timeSlotTextActive,
                                        disabled && styles.timeSlotTextDisabled,
                                    ]}>
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                                );
                            })}
                        </View>
                        {formErrors.timeSlot ? <Text style={styles.errorText}>{formErrors.timeSlot}</Text> : null}

                        <Text style={styles.fieldLabel}>Party Size</Text>
                        <View style={styles.partySizeRow}>
                            <TouchableOpacity
                                style={styles.sizeBtn}
                                onPress={() => updateForm({ partySize: Math.max(1, Number(form.partySize) - 1), tableNumber: '' })}
                            >
                                <Ionicons name="remove" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.sizeDisplay}>
                                <Text style={styles.sizeNum}>{form.partySize}</Text>
                                <Text style={styles.sizeLabel}>{Number(form.partySize) === 1 ? 'guest' : 'guests'}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.sizeBtn}
                                onPress={() => updateForm({ partySize: Math.min(20, Number(form.partySize) + 1), tableNumber: '' })}
                            >
                                <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {formErrors.partySize ? <Text style={styles.errorText}>{formErrors.partySize}</Text> : null}

                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.fieldLabel}>Table</Text>
                            {loadingAvailability ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Text style={styles.availabilityText}>{availableTableCount} available</Text>
                            )}
                        </View>
                        <Text style={styles.helperText}>{selectedTableLabel} will be used for this booking.</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableRow}>
                            <TouchableOpacity
                                style={[styles.tablePill, !form.tableNumber && styles.tablePillActive, availableTableCount === 0 && styles.tablePillDisabled]}
                                onPress={() => updateForm({ tableNumber: '' })}
                                disabled={availableTableCount === 0}
                            >
                                <Text style={[styles.tablePillText, !form.tableNumber && styles.tablePillTextActive]}>Auto</Text>
                            </TouchableOpacity>
                            {availableTables.map((table) => {
                                const isActive = String(form.tableNumber) === String(table.number);
                                return (
                                    <TouchableOpacity
                                        key={table.number}
                                        style={[
                                            styles.tablePill,
                                            isActive && styles.tablePillActive,
                                            !table.available && styles.tablePillDisabled,
                                        ]}
                                        onPress={() => updateForm({ tableNumber: table.number })}
                                        disabled={!table.available}
                                    >
                                        <Text style={[
                                            styles.tablePillText,
                                            isActive && styles.tablePillTextActive,
                                            !table.available && styles.tablePillTextDisabled,
                                        ]}>
                                            T{table.number} ({table.capacity})
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        {formErrors.tableNumber ? <Text style={styles.errorText}>{formErrors.tableNumber}</Text> : null}
                        {availableTableCount === 0 ? <Text style={styles.errorText}>No tables are available for this date, time, and party size.</Text> : null}

                        <Text style={styles.fieldLabel}>Occasion (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasionRow}>
                            {OCCASIONS.map((o) => (
                                <TouchableOpacity
                                    key={o.key}
                                    style={[styles.occasionPill, form.occasion === o.key && styles.occasionPillActive]}
                                    onPress={() => updateForm({ occasion: o.key })}
                                >
                                    <Text style={[styles.occasionText, form.occasion === o.key && styles.occasionTextActive]}>
                                        {o.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.fieldLabel}>Special Requests (Optional)</Text>
                        <TextInput
                            style={[styles.textArea, formErrors.specialRequests && styles.inputError]}
                            value={form.specialRequests}
                            onChangeText={(v) => updateForm({ specialRequests: v })}
                            placeholder="Allergies, dietary requirements, seating preferences..."
                            placeholderTextColor={mutedPlaceholder}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        {formErrors.specialRequests ? <Text style={styles.errorText}>{formErrors.specialRequests}</Text> : null}

                        <Text style={styles.fieldLabel}>Confirmation PDF (Optional)</Text>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickConfirmationPdf}>
                            <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                            <Text style={styles.uploadBtnText} numberOfLines={1}>
                                {confirmationPdf?.name || 'Attach PDF'}
                            </Text>
                        </TouchableOpacity>
                        {confirmationPdf ? <Text style={styles.uploadHint}>Selected file will be uploaded with this reservation.</Text> : null}

                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitDisabled && { opacity: 0.6 }]}
                            onPress={submitReservation}
                            disabled={isSubmitDisabled}
                        >
                            <LinearGradient colors={['#1A4F7A', '#0D3457']} style={styles.submitGrad}>
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="calendar-outline" size={18} color="#FFF" />
                                        <Text style={styles.submitText}>Confirm Reservation</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.sectionTitle}>My Reservations</Text>
                {loadingList ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : myReservations.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="calendar-outline" size={52} color={colors.textMuted} />
                        <Text style={styles.emptyTitle}>No reservations yet</Text>
                        <Text style={styles.emptySub}>Tap New to book a table</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
                            <Text style={styles.emptyBtnText}>Book a Table</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    myReservations.map((r) => {
                        const display = STATUS_DISPLAY[r.status] || STATUS_DISPLAY.pending;
                        return (
                            <View key={r._id} style={styles.resCard}>
                                <View style={styles.resCardHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: `${display.color}18` }]}>
                                        <Ionicons name={display.icon} size={14} color={display.color} />
                                        <Text style={[styles.statusText, { color: display.color }]}>{display.label}</Text>
                                    </View>
                                    {r.tableNumber ? (
                                        <View style={styles.tableBadge}>
                                            <Ionicons name="grid-outline" size={13} color={colors.info} />
                                            <Text style={styles.tableBadgeText}>Table {r.tableNumber}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.resInfo}>
                                    <View style={styles.resInfoItem}>
                                        <Ionicons name="calendar" size={16} color={colors.textMuted} />
                                        <Text style={styles.resInfoText}>{formatDate(r.date)}</Text>
                                    </View>
                                    <View style={styles.resInfoItem}>
                                        <Ionicons name="time" size={16} color={colors.textMuted} />
                                        <Text style={styles.resInfoText}>{r.timeSlot}</Text>
                                    </View>
                                    <View style={styles.resInfoItem}>
                                        <Ionicons name="people" size={16} color={colors.textMuted} />
                                        <Text style={styles.resInfoText}>{r.partySize} guests</Text>
                                    </View>
                                    {r.occasion ? (
                                        <View style={styles.resInfoItem}>
                                            <Ionicons name="gift" size={16} color={colors.textMuted} />
                                            <Text style={styles.resInfoText}>{r.occasion}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                {r.specialRequests ? <Text style={styles.resNotes}>{r.specialRequests}</Text> : null}
                                {r.confirmationPdfUrl ? (
                                    <TouchableOpacity style={styles.fileLink} onPress={() => Alert.alert('Confirmation PDF', r.confirmationPdfUrl)}>
                                        <Ionicons name="document-outline" size={14} color={colors.primary} />
                                        <Text style={styles.fileLinkText}>Confirmation PDF uploaded</Text>
                                    </TouchableOpacity>
                                ) : null}
                                {r.qrCodeUrl ? (
                                    <View style={styles.qrWrap}>
                                        <Text style={styles.qrLabel}>QR Code URL</Text>
                                        <Text style={styles.qrUrl}>{buildFileUrl(r.qrCodeUrl, r.updatedAt || r.createdAt || r._id)}</Text>
                                    </View>
                                ) : null}
                                {['pending', 'confirmed'].includes(r.status) && (
                                    <TouchableOpacity style={styles.cancelResBtn} onPress={() => cancelReservation(r._id)}>
                                        <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                                        <Text style={styles.cancelResBtnText}>Cancel Reservation</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                )}

                <View style={{ height: 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
    backBtn: { marginBottom: 10 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    headerTextWrap: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
    newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    scroll: { padding: 16, paddingBottom: 50 },
    messageBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
    successBox: { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}35` },
    errorBox: { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}35` },
    messageText: { flex: 1, fontSize: 13, fontWeight: '700' },
    formCard: {
        backgroundColor: colors.glassBg,
        borderRadius: 18,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    formTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginTop: 14 },
    helperText: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        minHeight: 50,
        borderWidth: 1.5,
        borderColor: colors.glassBorder,
    },
    inputError: { borderColor: colors.danger },
    input: { flex: 1, fontSize: 15, color: colors.textPrimary, minHeight: 46 },
    errorText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginTop: 6 },
    dateRow: { gap: 8, paddingRight: 4 },
    datePill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: colors.glassBorder, backgroundColor: colors.backgroundLight },
    datePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    datePillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    datePillTextActive: { color: '#FFF' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeSlot: { minWidth: 92, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.glassBorder, backgroundColor: colors.backgroundLight },
    timeSlotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    timeSlotDisabled: { opacity: 0.45 },
    timeSlotText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    timeSlotTextActive: { color: '#FFF' },
    timeSlotTextDisabled: { color: colors.textMuted },
    partySizeRow: { flexDirection: 'row', alignItems: 'center' },
    sizeBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.glassBorder, justifyContent: 'center', alignItems: 'center' },
    sizeDisplay: { flex: 1, alignItems: 'center' },
    sizeNum: { fontSize: 28, fontWeight: '900', color: colors.primary },
    sizeLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    tableHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    availabilityText: { fontSize: 12, color: colors.textMuted, fontWeight: '700', marginTop: 14 },
    tableRow: { gap: 8, paddingRight: 4 },
    tablePill: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: colors.glassBorder, backgroundColor: colors.backgroundLight },
    tablePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tablePillDisabled: { opacity: 0.45 },
    tablePillText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    tablePillTextActive: { color: '#FFF' },
    tablePillTextDisabled: { color: colors.textMuted },
    occasionRow: { gap: 8, paddingRight: 4 },
    occasionPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: colors.glassBorder, backgroundColor: colors.backgroundLight },
    occasionPillActive: { backgroundColor: primarySoft, borderColor: colors.primary },
    occasionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    occasionTextActive: { color: colors.primary },
    textArea: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        minHeight: 86,
        fontSize: 14,
        color: colors.textPrimary,
        borderWidth: 1.5,
        borderColor: colors.glassBorder,
        textAlignVertical: 'top',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        minHeight: 50,
        borderWidth: 1.5,
        borderColor: colors.glassBorder,
    },
    uploadBtnText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    uploadHint: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
    submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
    submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary, marginTop: 14 },
    emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    emptyBtn: { marginTop: 16, backgroundColor: primarySoft, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    emptyBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    resCard: {
        backgroundColor: colors.glassBg,
        borderRadius: 16,
        marginBottom: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    resCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { fontSize: 12, fontWeight: '700' },
    tableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: infoSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    tableBadgeText: { fontSize: 12, fontWeight: '700', color: colors.info },
    resInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    resInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.backgroundElevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    resInfoText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    resNotes: { fontSize: 12, color: colors.textMuted, marginTop: 10, fontStyle: 'italic' },
    fileLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    fileLinkText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    qrWrap: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.backgroundElevated },
    qrLabel: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
    qrUrl: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    cancelResBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: `${colors.danger}30`, justifyContent: 'center' },
    cancelResBtnText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
});
