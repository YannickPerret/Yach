'use client'
import React, {Component, createRef, useState} from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import rrule from '@fullcalendar/rrule'
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

class FullCalendarComponent extends Component {
    calendarRef = createRef();

    customButtons = {
        dayGridMonthButton: {
            text: 'Mois',
            click: () => this.changeView('dayGridMonth')
        },
        timeGridWeekButton: {
            text: 'Semaine',
            click: () => this.changeView('timeGridWeek')
        },
        timeGridDayButton: {
            text: 'Jour',
            click: () => this.changeView('timeGridDay')
        }
    };

    render() {
        return (
            <FullCalendar
                ref={this.calendarRef}
                plugins={[dayGridPlugin, rrule, timeGridPlugin, interactionPlugin]}
                initialView={this.props.initialeView || "dayGridMonth"}
                height="auto"
                selectable={true}
                editable={true}
                dayMaxEvents={true}
                firstDay={1}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonthButton,timeGridWeekButton,timeGridDayButton'
                }}
                aspectRatio={6}
                customButtons={this.customButtons}
                eventClick={this.handleEventClick}
                eventDrop={this.props.eventDrop}
                eventResize={this.props.eventResize}
                dateClick={this.handleDateClick}
                select={this.handleDateRangeSelect}
                />
        )
    }

    changeView(view) {
        this.calendarRef.current.getApi().changeView(view);
        localStorage.setItem('calendarView', view);
    }

    addEvent(event) {
        this.calendarRef.current.getApi().addEvent(event);
    }

    loadEvents(events) {
        this.calendarRef.current.getApi().removeAllEvents();
        this.calendarRef.current.getApi().addEventSource(events);
    }

    handleEventClick = (info) => {
        info.jsEvent.preventDefault();
        this.props.onEventClick && this.props.onEventClick(info);
    }
    
    handleDateClick = (info) => {
        this.props.onDayClick && this.props.onDayClick(info);
    }

    handleDateRangeSelect = (info) => {
        this.props.onSelect && this.props.onSelect(info);
    };
}


export default FullCalendarComponent;
