// src/components/EventFormModal.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { createEvent, updateEvent, generateRecurringTurnos } from '../services/eventService';
import { AuthContext } from '../context/AuthContext';

export default function EventFormModal({ isVisible, onClose, eventToEdit }) {
    const { user } = useContext(AuthContext);
    const coordinatorUid = user?.uid;

    const [eventId, setEventId] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState('Turno'); // Default type
    const [maxCapacity, setMaxCapacity] = useState(''); // Max capacity for single events

    // For single event date/time
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // For recurring event generation
    const [isRecurringGeneration, setIsRecurringGeneration] = useState(false);
    const [recurringStartDate, setRecurringStartDate] = useState(new Date());
    const [recurringEndDate, setRecurringEndDate] = useState(new Date());
    const [showRecurringStartDatePicker, setShowRecurringStartDatePicker] = useState(false);
    const [showRecurringEndDatePicker, setShowRecurringEndDatePicker] = useState(false);
    const [restrictions, setRestrictions] = useState([]); // [{type: 'day', date: Date}, {type: 'period', startDate: Date, endDate: Date}]
    const [isPeriodRestriction, setIsPeriodRestriction] = useState(false);
    const [currentRestrictionDate, setCurrentRestrictionDate] = useState(new Date());
    const [periodStartDate, setPeriodStartDate] = useState(new Date());
    const [periodEndDate, setPeriodEndDate] = useState(new Date());
    const [showRestrictionDatePicker, setShowRestrictionDatePicker] = useState(false);
    const [showPeriodStartDatePicker, setShowPeriodStartDatePicker] = useState(false);
    const [showPeriodEndDatePicker, setShowPeriodEndDatePicker] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventToEdit) {
            // Populate form for editing a single event
            setEventId(eventToEdit.id);
            setTitle(eventToEdit.title || '');
            setDescription(eventToEdit.description || '');
            setEventType(eventToEdit.eventType || 'Turno');
            setStartTime(eventToEdit.startTime instanceof Date ? eventToEdit.startTime : eventToEdit.startTime?.toDate());
            setEndTime(eventToEdit.endTime instanceof Date ? eventToEdit.endTime : eventToEdit.endTime?.toDate());
            setMaxCapacity(eventToEdit.maxCapacity !== null && eventToEdit.maxCapacity !== undefined ? String(eventToEdit.maxCapacity) : '');
            setIsRecurringGeneration(false); // Always false when editing an existing event
            setRestrictions([]); // Clear restrictions for editing
        } else {
            // Reset form for new event creation (single or recurring)
            setEventId(null);
            setTitle('');
            setDescription('');
            setEventType('Turno');
            setStartTime(new Date());
            setEndTime(new Date());
            setMaxCapacity('');
            setIsRecurringGeneration(false); // Default to single event creation
            setRecurringStartDate(new Date());
            setRecurringEndDate(new Date());
            setRestrictions([]);
            setCurrentRestrictionDate(new Date());
            setPeriodStartDate(new Date());
            setPeriodEndDate(new Date());
        }
    }, [eventToEdit, isVisible]); // Re-run when eventToEdit or visibility changes

    // --- Date/Time Picker Handlers for Single Event ---
    const onChangeStartTime = (event, selectedDate) => {
        const currentDate = selectedDate || startTime;
        setShowStartTimePicker(false);
        setStartTime(currentDate);
    };

    const onChangeEndTime = (event, selectedDate) => {
        const currentDate = selectedDate || endTime;
        setShowEndTimePicker(false);
        setEndTime(currentDate);
    };

    // --- Date Picker Handlers for Recurring Event Period ---
    const onRecurringStartDateChange = (event, selectedDate) => {
        setShowRecurringStartDatePicker(false);
        if (selectedDate) {
            setRecurringStartDate(selectedDate);
            if (selectedDate > recurringEndDate) {
                setRecurringEndDate(selectedDate); // Ensure end date is not before start date
            }
        }
    };

    const onRecurringEndDateChange = (event, selectedDate) => {
        setShowRecurringEndDatePicker(false);
        if (selectedDate) {
            setRecurringEndDate(selectedDate);
            if (selectedDate < recurringStartDate) {
                setRecurringStartDate(selectedDate); // Ensure start date is not after end date
            }
        }
    };

    // --- Restriction Handlers ---
    const onRestrictionDateChange = (event, selectedDate) => {
        setShowRestrictionDatePicker(false);
        if (selectedDate) {
            setCurrentRestrictionDate(selectedDate);
        }
    };

    const onPeriodStartDateChange = (event, selectedDate) => {
        setShowPeriodStartDatePicker(false);
        if (selectedDate) {
            setPeriodStartDate(selectedDate);
            if (selectedDate > periodEndDate) {
                setPeriodEndDate(selectedDate);
            }
        }
    };

    const onPeriodEndDateChange = (event, selectedDate) => {
        setShowPeriodEndDatePicker(false);
        if (selectedDate) {
            setPeriodEndDate(selectedDate);
            if (selectedDate < periodStartDate) {
                setPeriodStartDate(selectedDate);
            }
        }
    };

    const handleAddRestriction = useCallback(() => {
        if (isPeriodRestriction) {
            if (!periodStartDate || !periodEndDate || periodStartDate > periodEndDate) {
                Alert.alert("Erro", "Selecione um período de início e fim válidos para a restrição.");
                return;
            }
            // Check for overlapping periods or exact duplicates (simplified check)
            const isDuplicate = restrictions.some(r =>
                r.type === 'period' &&
                r.startDate.getTime() === periodStartDate.getTime() &&
                r.endDate.getTime() === periodEndDate.getTime()
            );
            if (isDuplicate) {
                Alert.alert("Aviso", "Restrição para este período já existe.");
                return;
            }
            setRestrictions(prev => [...prev, { type: 'period', startDate: periodStartDate, endDate: periodEndDate }]);
        } else {
            if (!currentRestrictionDate) {
                Alert.alert("Erro", "Por favor, selecione uma data para a restrição.");
                return;
            }
            // Check for duplicate day restrictions
            const isDuplicate = restrictions.some(r =>
                r.type === 'day' && isSameDay(r.date, currentRestrictionDate)
            );
            if (isDuplicate) {
                Alert.alert("Aviso", "Restrição para este dia já existe.");
                return;
            }
            setRestrictions(prev => [...prev, { type: 'day', date: currentRestrictionDate }]);
        }
        // Reset restriction specific states after adding
        setCurrentRestrictionDate(new Date());
        setPeriodStartDate(new Date());
        setPeriodEndDate(new Date());
    }, [isPeriodRestriction, currentRestrictionDate, periodStartDate, periodEndDate, restrictions]);

    const handleRemoveRestriction = useCallback((indexToRemove) => {
        Alert.alert(
            "Remover Restrição",
            "Tem certeza que deseja remover esta restrição?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    onPress: () => {
                        setRestrictions(prev => prev.filter((_, index) => index !== indexToRemove));
                    },
                },
            ]
        );
    }, []);


    const handleSubmit = useCallback(async () => {
        if (!title || !eventType) {
            Alert.alert("Erro", "Por favor, preencha o título e o tipo de evento.");
            return;
        }

        setLoading(true);
        try {
            if (eventId) {
                // Editing existing single event
                if (!startTime || !endTime || endTime <= startTime) {
                    Alert.alert("Erro", "Para eventos únicos, a hora de fim deve ser posterior à hora de início.");
                    return;
                }
                const eventData = {
                    title,
                    description,
                    eventType,
                    startTime,
                    endTime,
                    maxCapacity: maxCapacity !== '' ? parseInt(maxCapacity) : null,
                    // coordinatorUid is already set from AuthContext, no need to update unless it changes
                };
                await updateEvent(eventId, eventData);
                Alert.alert("Sucesso", "Evento atualizado com sucesso!");
            } else {
                // Creating new event (single or recurring)
                if (isRecurringGeneration) {
                    if (!recurringStartDate || !recurringEndDate || recurringEndDate < recurringStartDate) {
                        Alert.alert("Erro", "Para eventos recorrentes, selecione um período de início e fim válidos.");
                        return;
                    }
                    const baseEventData = {
                        title,
                        description,
                        eventType,
                        maxCapacity: maxCapacity !== '' ? parseInt(maxCapacity) : null, // Base maxCapacity for recurring
                    };
                    const createdCount = await generateRecurringTurnos(
                        baseEventData,
                        recurringStartDate,
                        recurringEndDate,
                        restrictions,
                        coordinatorUid
                    );
                    Alert.alert("Sucesso", `${createdCount} turnos recorrentes gerados com sucesso!`);
                } else {
                    if (!startTime || !endTime || endTime <= startTime) {
                        Alert.alert("Erro", "Para eventos únicos, a hora de fim deve ser posterior à hora de início.");
                        return;
                    }
                    const eventData = {
                        title,
                        description,
                        eventType,
                        startTime,
                        endTime,
                        maxCapacity: maxCapacity !== '' ? parseInt(maxCapacity) : null,
                        coordinatorUid: coordinatorUid,
                        status: 'draft', // New single events start as draft
                    };
                    await createEvent(eventData);
                    Alert.alert("Sucesso", "Evento criado com sucesso!");
                }
            }
            onClose(true); // Close modal and indicate success to parent to refresh events
        } catch (error) {
            console.error("Error saving event:", error);
            Alert.alert("Erro", `Não foi possível salvar o evento: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [
        title, description, eventType, maxCapacity, startTime, endTime, eventId,
        isRecurringGeneration, recurringStartDate, recurringEndDate, restrictions, coordinatorUid,
        onClose, // Include onClose in dependencies
    ]);

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={() => onClose(false)}
        >
            <View style={styles.modalContent}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.modalTitle}>{eventId ? "Editar Evento" : "Criar Novo Evento"}</Text>

                    <Text style={styles.label}>Título do Evento:</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Título do Evento"
                    />

                    <Text style={styles.label}>Descrição:</Text>
                    <TextInput
                        style={styles.input}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Descrição (Opcional)"
                        multiline
                    />

                    <Text style={styles.label}>Tipo de Evento:</Text>
                    <Picker
                        selectedValue={eventType}
                        onValueChange={(itemValue) => setEventType(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Turno" value="Turno" />
                        <Picker.Item label="Teambuilding" value="Teambuilding" />
                        <Picker.Item label="Reunião" value="Reunião" />
                        <Picker.Item label="Evento Aberto" value="Evento Aberto" />
                        <Picker.Item label="Reunião Geral" value="Reunião Geral" />
                    </Picker>

                    <Text style={styles.label}>Capacidade Máxima (0 ou vazio para ilimitado):</Text>
                    <TextInput
                        style={styles.input}
                        value={maxCapacity}
                        onChangeText={text => setMaxCapacity(text.replace(/[^0-9]/g, ''))} // Only allow numbers
                        keyboardType="numeric"
                        placeholder="Ex: 10"
                    />

                    {!eventId && ( // Only show recurring options for new events
                        <>
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setIsRecurringGeneration(!isRecurringGeneration)}
                                >
                                    {isRecurringGeneration && <Text style={styles.checkboxChecked}>✓</Text>}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Gerar Eventos Recorrentes</Text>
                            </View>
                        </>
                    )}

                    {isRecurringGeneration && !eventId ? ( // Recurring event generation fields
                        <>
                            <Text style={styles.label}>Período de Geração:</Text>
                            <TouchableOpacity onPress={() => setShowRecurringStartDatePicker(true)} style={styles.dateTimePickerButton}>
                                <Text style={styles.dateTimePickerText}>Início: {format(recurringStartDate, 'dd/MM/yyyy', { locale: pt })}</Text>
                            </TouchableOpacity>
                            {showRecurringStartDatePicker && (
                                <DateTimePicker
                                    value={recurringStartDate}
                                    mode="date"
                                    display="default"
                                    onChange={onRecurringStartDateChange}
                                />
                            )}

                            <TouchableOpacity onPress={() => setShowRecurringEndDatePicker(true)} style={styles.dateTimePickerButton}>
                                <Text style={styles.dateTimePickerText}>Fim: {format(recurringEndDate, 'dd/MM/yyyy', { locale: pt })}</Text>
                            </TouchableOpacity>
                            {showRecurringEndDatePicker && (
                                <DateTimePicker
                                    value={recurringEndDate}
                                    mode="date"
                                    display="default"
                                    onChange={onRecurringEndDateChange}
                                />
                            )}

                            <Text style={styles.label}>Restrições (Datas/Períodos a Excluir):</Text>
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setIsPeriodRestriction(!isPeriodRestriction)}
                                >
                                    {isPeriodRestriction && <Text style={styles.checkboxChecked}>✓</Text>}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Restrição por Período</Text>
                            </View>

                            {isPeriodRestriction ? (
                                <>
                                    <Text style={styles.label}>Início do Período de Restrição:</Text>
                                    <TouchableOpacity onPress={() => setShowPeriodStartDatePicker(true)} style={styles.dateTimePickerButton}>
                                        <Text style={styles.dateTimePickerText}>{format(periodStartDate, 'dd/MM/yyyy', { locale: pt })}</Text>
                                    </TouchableOpacity>
                                    {showPeriodStartDatePicker && (
                                        <DateTimePicker
                                            value={periodStartDate}
                                            mode="date"
                                            display="default"
                                            onChange={onPeriodStartDateChange}
                                        />
                                    )}

                                    <Text style={styles.label}>Fim do Período de Restrição:</Text>
                                    <TouchableOpacity onPress={() => setShowPeriodEndDatePicker(true)} style={styles.dateTimePickerButton}>
                                        <Text style={styles.dateTimePickerText}>{format(periodEndDate, 'dd/MM/yyyy', { locale: pt })}</Text>
                                    </TouchableOpacity>
                                    {showPeriodEndDatePicker && (
                                        <DateTimePicker
                                            value={periodEndDate}
                                            mode="date"
                                            display="default"
                                            onChange={onPeriodEndDateChange}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>Data da Restrição:</Text>
                                    <TouchableOpacity onPress={() => setShowRestrictionDatePicker(true)} style={styles.dateTimePickerButton}>
                                        <Text style={styles.dateTimePickerText}>{format(currentRestrictionDate, 'dd/MM/yyyy', { locale: pt })}</Text>
                                    </TouchableOpacity>
                                    {showRestrictionDatePicker && (
                                        <DateTimePicker
                                            value={currentRestrictionDate}
                                            mode="date"
                                            display="default"
                                            onChange={onRestrictionDateChange}
                                        />
                                    )}
                                </>
                            )}
                            <TouchableOpacity style={styles.addRestrictionButton} onPress={handleAddRestriction}>
                                <Text style={styles.addRestrictionButtonText}>Adicionar Restrição</Text>
                            </TouchableOpacity>

                            {restrictions.length > 0 ? (
                                <View style={styles.restrictionsList}>
                                    {restrictions.map((r, index) => (
                                        <View key={index} style={styles.restrictionItem}>
                                            <Text style={styles.restrictionText}>
                                                {r.type === 'day' ?
                                                    `Dia: ${format(r.date, 'dd/MM/yyyy', { locale: pt })}` :
                                                    `Período: ${format(r.startDate, 'dd/MM/yyyy', { locale: pt })} a ${format(r.endDate, 'dd/MM/yyyy', { locale: pt })}`}
                                            </Text>
                                            <TouchableOpacity onPress={() => handleRemoveRestriction(index)}>
                                                <Text style={styles.removeRestrictionButton}>Remover</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.noRestrictionsText}>Nenhuma restrição adicionada.</Text>
                            )}
                        </>
                    ) : ( // Single event creation/editing fields
                        <>
                            <Text style={styles.label}>Hora de Início:</Text>
                            <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.dateTimePickerButton}>
                                <Text style={styles.dateTimePickerText}>{format(startTime, 'dd/MM/yyyy HH:mm', { locale: pt })}</Text>
                            </TouchableOpacity>
                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="datetime"
                                    display="default"
                                    onChange={onChangeStartTime}
                                />
                            )}

                            <Text style={styles.label}>Hora de Fim:</Text>
                            <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.dateTimePickerButton}>
                                <Text style={styles.dateTimePickerText}>{format(endTime, 'dd/MM/yyyy HH:mm', { locale: pt })}</Text>
                            </TouchableOpacity>
                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="datetime"
                                    display="default"
                                    onChange={onChangeEndTime}
                                />
                            )}
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.modalButtonText}>{eventId ? "Salvar Alterações" : (isRecurringGeneration ? "Gerar Turnos" : "Criar Evento")}</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.closeModalButton]}
                        onPress={() => onClose(false)} // Pass false as no changes were made/committed
                        disabled={loading}
                    >
                        <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 20,
        paddingTop: 50, // To avoid status bar
    },
    scrollViewContent: {
        width: '100%',
        maxWidth: 600, // Optional: constrain width for larger screens
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        marginTop: 10,
        fontWeight: 'bold',
        color: '#333',
        width: '100%',
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    picker: {
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
    },
    dateTimePickerButton: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    dateTimePickerText: {
        fontSize: 16,
        color: '#333',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#007bff',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        color: '#007bff',
        fontSize: 18,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    addRestrictionButton: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 10,
        alignSelf: 'flex-start', // Align to left within scrollview
    },
    addRestrictionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    restrictionsList: {
        width: '100%',
        marginTop: 10,
    },
    restrictionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e9ecef', // Light grey background
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    restrictionText: {
        fontSize: 15,
        color: '#333',
        flexShrink: 1, // Allow text to shrink
    },
    removeRestrictionButton: {
        color: '#dc3545',
        fontWeight: 'bold',
        marginLeft: 10, // Space between text and button
    },
    noRestrictionsText: {
        fontStyle: 'italic',
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
        width: '100%',
    },
    modalButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeModalButton: {
        backgroundColor: '#6c757d', // Grey for cancel/close
        marginTop: 10,
    },
});