import React, { useEffect, useState } from 'react';
import '@/styles/calendar.css'
import Modal from '@/components/modal/modal';
import EventButton from '@/components/modal/eventButton';
import { formatDateToDatetimeLocal } from '@/utils/dateTime';
import { handleRecurrenceOptionsChange } from '@/utils/rRule';
import { RRule } from 'rrule';


export default function ModalEvent({ calendar, event, onClose, isEdit = false, doesEventOverlap, canEditing, onEventChange }) {

    const [eventData, setEventData] = useState({
        calendarId: calendar?.id,
        eventId: event?.id || null,
        summary: event?.title || '',
        startDate: event && event.start ? formatDateToDatetimeLocal(event.start) : '',
        endDate: event && event.end ? formatDateToDatetimeLocal(event.end) : '',
        interval: event && event.interval !== undefined && event.interval >= 1 ? event.interval : 1,
        description: event ? event.description : '',
        location: event ? event.location : '',
        recurrenceType: event ? event.recurrenceType : '',
        childrenCalendar: [],
    });
    const [errorMessage, setErrorMessage] = useState('');


    useEffect(() => {
        if (calendar && calendar.type === 'SHARED') {
            setEventData(prevState => ({
                ...prevState,
                childrenCalendar: calendar.children.map(child => ({ id: child.id, name: child.name }))
            }));
        }
    }, [calendar]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setEventData(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSelectChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        setEventData(prevState => ({ ...prevState, childrenCalendar: selectedOptions }));
    };

    const handleRecurrenceTypeChange = () => {
        const selectedType = document.getElementById('recurrence-type').value;
        const options = document.querySelectorAll('.recurrence-options');
        const endDateContainer = document.getElementById('end-date-container');

        options.forEach(option => option.style.display = 'none');

        const selectedOptions = document.getElementById(`${selectedType}-options`);
        if (selectedOptions) {
            selectedOptions.style.display = 'block';
        }
        if (selectedType !== 'none') {
            endDateContainer.style.display = 'block';
        } else {
            endDateContainer.style.display = 'none';
        }
    }

    const handleEndDateChange = () => {
        const endDateCheckbox = document.getElementById('end-date-checkbox');
        const endDateInput = document.getElementById('end-date');
    
        if (endDateCheckbox.checked) {
            endDateInput.style.display = 'block';
        } else {
            endDateInput.style.display = 'none';
        }
    }

    const handleSubmitEvent = async (e) => {
        e.preventDefault();

        if (doesEventOverlap(eventData.startDate, eventData.endDate)) {
            setErrorMessage("Un événement existe déjà pour cette plage horaire!");
        }

        const recurrenceType = document.getElementById('recurrence-type').value;
        const recurrenceOptions = document.getElementById(`${recurrenceType}-options`) !== null ? document.getElementById(`${recurrenceType}-options`) : false;
        
        const options = handleRecurrenceOptionsChange(recurrenceType, recurrenceOptions);
        eventData.recurrence = new RRule(options).toString();

        try {
            const response = await fetch(`http://localhost:3000/api/v1/calendar/${eventData.calendarId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });
            const data = await response.json();
            onClose();
            onEventChange();
            setErrorMessage(data.message);
        } catch (error) {
            setErrorMessage(error.error);
        }
    };

    return (
        <Modal onClose={onClose}>
            <h2>{isEdit ? "Editing event" : "Create new event"}</h2>
            <form id="eventForm" className="eventFormModal" onSubmit={handleSubmitEvent}>
                <div>
                    <label htmlFor="summary">Summary:</label>
                    <input type="text" id="summary" name="summary" value={eventData.summary} onChange={handleInputChange} disabled={!canEditing} required/>
                </div>
                <div>
                    <div>
                        <label htmlFor="startDate">Start Date:</label>
                        <input type="datetime-local" id="startDate" name="startDate" value={eventData.startDate} onChange={handleInputChange} disabled={!canEditing} required/>
                    </div>
                    <div>
                        <label htmlFor="endDate">End Date:</label>
                        <input type="datetime-local" id="endDate" name="endDate" value={eventData.endDate} onChange={handleInputChange} disabled={!canEditing} required/>
                    </div>
                </div>

                <div className="eventModel__frequency">
                    <fieldset htmlFor="frequency">
                        <legend>Frequency</legend>
                        <div id="recurrence-settings">
                            <label htmlFor="recurrence-type">Récurrence:</label>
                            <select id="recurrence-type" defaultValue={eventData.recurrenceType} onChange={handleRecurrenceTypeChange} disabled={!canEditing}>
                                <option value="none">Jamais</option>
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                                <option value="workdays">Chaque jour ouvrable</option>
                                <option value="bi-weekly">Toutes les deux semaines</option>
                                <option value="monthly">Mensuelle</option>
                                <option value="yearly">Annuelle</option>
                                <option value="custom">Personnalisé</option>
                            </select>

                            <div id="daily-options" className="recurrence-options">
                                Chaque <input type="number" id="interval" value={eventData.interval} min="1" onChange={handleInputChange} /> jour(s)
                                <input type="radio" id="everyDay" name="daily" /> Chaque jour
                                <input type="radio" id="everyWeekDay" name="daily" /> Chaque jour ouvrable
                            </div>

                            <div id="weekly-options" className="recurrence-options">
                                Chaque <input type="number" id="interval" value={eventData.interval} min="1" onChange={handleInputChange} /> semaine(s)
                                <div>
                                    <input type="checkbox" id="monday" value="MO" /> Lundi
                                    <input type="checkbox" id="tuesday" value="TU" /> Mardi
                                    <input type="checkbox" id="wednesday" value="WE" /> Mercredi
                                    <input type="checkbox" id="thursday" value="TH" /> Jeudi
                                    <input type="checkbox" id="friday" value="FR" /> Vendredi
                                    <input type="checkbox" id="saturday" value="SA" /> Samedi
                                    <input type="checkbox" id="sunday" value="SU" /> Dimanche
                                </div>
                            </div>

                            <div id="monthly-options" className="recurrence-options">
                                Chaque <input type="number" id="interval" value={eventData.interval} min="1" onChange={handleInputChange} /> mois
                                <input type="radio" id="byweekday" name="monthly" />
                                <select id="weekday-in-month">
                                    <option value="0">Chaque</option>
                                    <option value="1">premier</option>
                                    <option value="2">deuxième</option>
                                    <option value="3">troisième</option>
                                    <option value="4">quatrième</option>
                                    <option value="-1">dernier</option>
                                </select>
                                <select id="weekday">
                                    <option value="MO">Lundi</option>
                                    <option value="TU">Mardi</option>
                                    <option value="WE">Mercredi</option>
                                    <option value="TH">Jeudi</option>
                                    <option value="FR">Vendredi</option>
                                    <option value="SA">Samedi</option>
                                    <option value="SU">Dimanche</option>
                                </select>
                                <input type="radio" id="bymonthday" name="monthly" /> Se répète le(s) jour(s)
                                <input type="text" id="monthdays" />
                            </div>

                            <div id="yearly-options" className="recurrence-options">
                                Pendant <input type="number" id="interval" value={eventData.interval} min="1" onChange={handleInputChange} /> année(s)
                                <input type="radio" id="byYearWeekDay" name="yearly" />
                                <select id="weekdayInYear">
                                    <option value="0">chaque</option>
                                    <option value="1">premier</option>
                                    <option vlaue="2">deuxième</option>
                                    <option value="3">troisième</option>
                                    <option value="4">quatrième</option>
                                    <option value="-1">dernier</option>
                                </select>
                                <select id="weekday">
                                    <option value="MO">Lundi</option>
                                    <option value="TU">Mardi</option>
                                    <option value="WE">Mercredi</option>
                                    <option value="TH">Jeudi</option>
                                    <option value="FR">Vendredi</option>
                                    <option value="SA">Samedi</option>
                                    <option value="SU">Dimanche</option>
                                </select>
                                de <select id="month">
                                    <option value="1">Janvier</option>
                                    <option value="2">Février</option>
                                    <option value="3">Mars</option>
                                    <option value="4">Avril</option>
                                    <option value="5">Mai</option>
                                    <option value="6">Juin</option>
                                    <option value="7">Juillet</option>
                                    <option value="8">Août</option>
                                    <option value="9">Septembre</option>
                                    <option value="10">Octobre</option>
                                    <option value="11">Novembre</option>
                                    <option value="12">Décembre</option>
                                </select>

                            </div>

                            <div id="end-date-container" style={{display: 'none'}}>
                                <input type="checkbox" id="end-date-checkbox" onChange={handleEndDateChange} />
                                <label htmlFor="end-date-checkbox">Jusqu'à:</label>
                                <input type="date" id="end-date" style={{display: 'none'}} />
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div>
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description" value={eventData.description} onChange={handleInputChange} disabled={!canEditing}></textarea>
                </div>

                <div>
                    <label htmlFor="location">Location :</label>
                    <input type="text" id="location" name="location" value={eventData.location} onChange={handleInputChange} disabled={!canEditing}/>
                </div>

                <div>
                    <label htmlFor="eventCalendarSelection">Sélectionner des calendriers :</label>
                    <select id="eventCalendarSelection" name="eventCalendarSelection" multiple onChange={handleSelectChange} disabled={!canEditing}>
                    </select>
                </div>
                {
                    canEditing ? 
                    <EventButton isEdit={isEdit} /> :
                    <p>Le calendrier est en lecture seule.</p>
                }

            </form>
        </ Modal>
    )
}