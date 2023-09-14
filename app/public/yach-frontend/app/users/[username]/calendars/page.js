'use client'
import React, {useEffect, useRef, useState} from 'react';
import FullCalendarComponent from '@/components/calendar/calendar';
import SideBarUser from '@/components/calendar/sideBar/sideBarUser';
import { getServerData } from './data';
import { useRouter } from 'next/navigation';
import ModalEvent from '@/components/calendar/events/modal';

export default function Calendar() {
    const calendarComponentRef = useRef();
    const [username, setUsername] = useState('');
    const [calendars, setCalendars] = useState([]);
    const [selectedIndexCalendar, setSelectedIndexCalendar] = useState(0);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState({});
    const [calendarView, setCalendarView] = useState('dayGridMonth');
    const [isEdit, setIsEdit] = useState(false);
    const [canEditing, setCanEditing] = useState(true);

    
    useEffect(() => {
        if(localStorage.getItem('username') === null) {
            window.location.href = '/login';
            return
        }
        setUsername(localStorage.getItem('username'));

        if(localStorage.getItem('calendarView') !== null) {
            setCalendarView(localStorage.getItem('calendarView'));
        }

        loadAllUserCalendars();
    }, []);

    /*useEffect(() => {
       if (calendars.length > 0) {
            calendarComponentRef.current.loadEvents(calendars[selectedIndexCalendar].events);
        }

    }, [selectedIndexCalendar]);*/

    useEffect(() => {
        if (calendars.length > 0) {
            handleSelectedCalendar(calendars[selectedIndexCalendar].id);
        }
    }, [calendars]);
    

    const loadAllUserCalendars = () => {
        getServerData({ params: { username: localStorage.getItem('username') } })
            .then(data => {
                setCalendars(data.calendars);
        });
    };

    const handleSelectedCalendar = (calendarId) => {   
        const selectedCalendar = calendars.find(calendar => calendar.id === calendarId);
        if(!selectedCalendar) return;
        
        const newEvents = selectedCalendar.events.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start,
            end: event.end,
            rrule: event.rRule ? event.rRule : null,
            description: event.description,
            location: event.location,
            calendarId: event.calendarId,
            backgroundColor: selectedCalendar.color,
            borderColor: selectedCalendar.color,
            url: event.url,
        }));

        if (selectedCalendar.right === 'READ') {
            setCanEditing(false);
        }
        else {
            setCanEditing(true);
        }

        calendarComponentRef.current.loadEvents(newEvents);
        setSelectedIndexCalendar(calendars.indexOf(selectedCalendar));
    };
    
    const handleEventClick = (info) => {
        setIsEdit(true);
        setCurrentEvent(info.event);
        setModalOpen(true);
    }

    const handleCloseModal = () => {
        setCurrentEvent(null);
        setModalOpen(false);
    }

    const handleDayEventClick = (info) => {
        if (!canEditing) return;
        setIsEdit(false);
        setCurrentEvent({
            start: info.date
        });
        setModalOpen(true);
    };
    

    const handleDateRangeSelect = (info) => {
        if (!canEditing) return;
        setIsEdit(false);
        setCurrentEvent({
            start: info.start,
            end: info.end
        });
        setModalOpen(true);
    };
    
    
    const doesEventOverlap = (newStartDate, newEndDate) => {
        const existingEvents = calendars[selectedIndexCalendar].events;
    
        for (let event of existingEvents) {
            if (new Date(newStartDate) < new Date(event.end) && new Date(newEndDate) > new Date(event.start)) {
                return true;
            }
        }
        return false;
    };

    return (
        <>
            <SideBarUser username={username} calendars={calendars} selectedIndexCalendar={handleSelectedCalendar}/>
            <div className="calendar-container">
                <div className='customCalendars'>
                    <FullCalendarComponent 
                        ref={calendarComponentRef} 
                        calendar={calendars[selectedIndexCalendar]} 
                        initialeView={calendarView} 
                        onEventClick={handleEventClick} 
                        onDayClick={handleDayEventClick}
                        onSelect={handleDateRangeSelect}
                        />
                    {isModalOpen && 
                        <ModalEvent 
                            calendar={calendars[selectedIndexCalendar]} 
                            event={currentEvent} onClose={handleCloseModal} 
                            isEdit={isEdit} 
                            doesEventOverlap={doesEventOverlap} 
                            canEditing={canEditing} 
                            onEventChange={loadAllUserCalendars}
                            />}
                </div>
            </div>
        </>
    );
}