'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import FullCalendarComponent from '@/components/calendar/calendar';
import SideBarUser from '@/components/calendar/sideBar/sideBarUser';
import ModalEvent from '@/components/calendar/events/modal';
import ModalSettings from '@/components/calendar/settings/modal';
import CalendarTemporary from '@/components/calendar/temporary/calendarTemporary';

import { 
    loadAllUserCalendars,
    selectUserCalendars, 
    selectSelectedCalendar, 
    selectCalendarView,
    setCalendarView,
    setSelectedCalendar, 
    updateCalendarEventAsync
} from '@/store/calendarSlice';

import ImportCalendarInput from '@/components/calendar/imports/import';
import ImportModal from '@/components/calendar/imports/importModal';

export default function Calendar() {
    const dispatch = useDispatch();

    const username = localStorage?.getItem('username') || '';
    const calendars = useSelector(selectUserCalendars);
    const selectedCalendar = useSelector(selectSelectedCalendar);
    const calendarComponentRef = useRef(null);
    const calendarView = useSelector(selectCalendarView);

    const [isModalOpen, setModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isConflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictData, setConflictData] = useState([]);


    const [currentEvent, setCurrentEvent] = useState({});
    const [isEdit, setIsEdit] = useState(false);
    const [canEditing, setCanEditing] = useState(true);

    useEffect(() => {
        if (!username) {
            window.location.href = '/';
            return;
        }
        dispatch(loadAllUserCalendars(username));
    }, []);

    useEffect(() => {
        if (calendars?.length > 0 && !selectedCalendar) {
            dispatch(setSelectedCalendar(calendars[0]));
            handleSelectedCalendar(calendars[0].id);
        }
    }, [calendars, selectedCalendar, dispatch]);
    

    useEffect(() => {
        const view = localStorage.getItem('calendarView');
        if (view) {
            dispatch(setCalendarView(view));
        }
    }, [dispatch]);

    const handleSelectedCalendar = (calendarId) => {   
        const selected = calendars.find(calendar => calendar.id === calendarId);
        if(!selected) return;
    
        dispatch(setSelectedCalendar(selected));

        let newEvents = getAllEventsWithChildren(selected).map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start,
            end: event.end,
            rrule: event.rRule ? event.rRule : null,
            description: event.description,
            location: event.location,
            calendarId: event.calendarId,
            backgroundColor: event.calendarColor,
            borderColor: event.calendarColor,
            url: event.url,
        }));
    
        if (selected.right === 'READ') {
            setCanEditing(false);
        } else {
            setCanEditing(true);
        }
    
        calendarComponentRef.current.loadEvents(newEvents);
    };
    
    
    const handleEventClick = (info) => {
        if (isSettingsModalOpen){
            setSettingsModalOpen(false);
        }
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
        
        const now = new Date();
        const end = new Date(now);
        end.setHours(now.getHours() + 1);
        
        setCurrentEvent({
            start: now,
            end: end
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

    const handleSettingsModal = (calendarId) => {
        const selected = calendars.find(calendar => calendar.id === calendarId);
        if(!selected) return;
        if (isModalOpen) {
            setModalOpen(false);
        }
        dispatch(setSelectedCalendar(selected));
        setSettingsModalOpen(true);
    };

    const handleCloseSettingsModal = () => {
        setSettingsModalOpen(false);
    };

    const getAllEventsWithChildren = (calendar) => {
        let allEvents = [];
    
        // Ajouter les événements du calendrier actuel
        if (calendar?.events) {
            allEvents = allEvents.concat(
                calendar.events.map(event => ({ ...event, calendarColor: calendar.color }))
            );
        }
    
        // Si le calendrier a des enfants, les traiter récursivement
        if (calendar.children) {
            for (const child of calendar.children) {
                allEvents = allEvents.concat(getAllEventsWithChildren(child));
            }
        }
        return allEvents;
    };

    const handleRefreshCalendar = () => {

        const newEvents = getAllEventsWithChildren(calendars).map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start,
            end: event.end,
            rrule: event.rRule ? event.rRule : null,
            description: event.description,
            location: event.location,
            calendarId: event.calendarId,
            backgroundColor: event.calendarColor,
            borderColor: event.calendarColor,
            url: event.url,
        }));
        calendarComponentRef.current.loadEvents(newEvents);
    }

    const handleConflicstModal = (conflicts) => {
        setConflictData(conflicts);
        setConflictModalOpen(true);
    }

    const handleConflictResolution = (resolvedConflicts) => {
        setConflictData([]);
        setConflictModalOpen(false);
        const resolvedEventsArray = Object.values(resolvedConflicts);
        
        console.log(username, resolvedEventsArray, selectedCalendar.id)
        
        dispatch(updateCalendarEventAsync({username, events: resolvedEventsArray, calendarId: selectedCalendar.id}));   
    }
    
    const handleCloseConflictModal = () => {
        setConflictModalOpen(false);
        setConflictData([])
    }
    
    return (
        <>
            <SideBarUser username={username} calendars={calendars} selectedIndexCalendar={handleSelectedCalendar} editSelectedCalendar={handleSettingsModal}/>
            <div className="calendar-container">
                <div className='customCalendars'>
                    <FullCalendarComponent 
                        ref={calendarComponentRef} 
                        calendar={selectedCalendar} 
                        initialeView={calendarView} 
                        setCalendarView={setCalendarView}
                        onEventClick={handleEventClick} 
                        onDayClick={handleDayEventClick}
                        onSelect={handleDateRangeSelect}
                        />
                    {isModalOpen && 
                        <ModalEvent 
                            event={currentEvent} onClose={handleCloseModal} 
                            isEdit={isEdit} 
                            canEditing={canEditing} 
                            onEventChange={handleRefreshCalendar}
                            />}
                    {isSettingsModalOpen &&
                        <ModalSettings 
                            calendar={selectedCalendar} 
                            onClose={handleCloseSettingsModal} 
                            username={username}
                        />}
                    
                </div>
                <div className="calendar-header">
                    <div>
                        <h3>Importer un calendrier</h3>
                        <ImportCalendarInput 
                            username={username} 
                            calendar={selectedCalendar} 
                            onImportConflicts={handleConflicstModal} 
                        />        
                        {isConflictModalOpen && 
                            <ImportModal 
                                conflicts={conflictData} 
                                onResolve={handleConflictResolution}
                                onClose={handleCloseConflictModal}
                            />
                        }           
                     </div>
                        <br />
                    <CalendarTemporary 
                        calendarComponentRef={calendarComponentRef} 
                    />
                </div>
            </div>
        </>
    );
}