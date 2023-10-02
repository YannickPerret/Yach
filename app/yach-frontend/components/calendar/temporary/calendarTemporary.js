import React, { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { loadTemporaryCalendar, removeTemporaryCalendar, selectTemporaryCalendars } from '@/store/calendarSlice';


export default function CalendarTemporary({calendarComponentRef}) {
    const dispatch = useDispatch();

    const temporaryCalendars = useSelector(selectTemporaryCalendars);
    const [temporaryCalendarInput, setTemporaryCalendarInput] = useState('');
    const [temporaryCalendarName, setTemporaryCalendarName] = useState('');

    const handleTemporaryCalendar = async (e) => {
        e.preventDefault();

        dispatch(loadTemporaryCalendar({ calendarURL: temporaryCalendarInput, calendarName: temporaryCalendarName })).then((data) => {
            if (data.payload) {
                const events = data.payload.events.map(event => ({
                    title: event.summary,
                    start: event.start,
                    end: event.end,
                    description: event.description,
                    backgroundColor: '#378006',
                    borderColor: '#378006',
                    editable: false
                }));
                calendarComponentRef.current.addEventSource({id: data.payload.id, events});
            }
        });
        setTemporaryCalendarInput('');
        setTemporaryCalendarName('');
    }

    const handleRemoveTemporaryCalendar = (calendarId) => {
        dispatch(removeTemporaryCalendar(calendarId));
        calendarComponentRef.current.removeEventSource(calendarId);
    }    


    return (
        <div className="calendar-Temporary-view">
            <h3>Calendrier temporaire : </h3>
            <form onSubmit={handleTemporaryCalendar}>
                <label htmlFor="temporaryCalendarUrl">Lien .ICS</label><input type="text" id="temporaryCalendarUrl" placeholder='Temporary calendar URL' value={temporaryCalendarInput} onChange={(e) => setTemporaryCalendarInput(e.target.value)} /><br />
                <label htmlFor="temporaryCalendarName">Nom du calendrier</label><input type="text" id="temporaryCalendarName" value={temporaryCalendarName} onChange={(e) => setTemporaryCalendarName(e.target.value)} />
                <button type="submit">Ajouter</button>
            </form>

            {temporaryCalendars.map((calendar, index) => {
                return (<div key={calendar.id}>{index} {calendar.name}
                        <button onClick={() => handleRemoveTemporaryCalendar(calendar.id)}>Effacer</button>
                </div>)
            })}
        </div>
        
    )
}
