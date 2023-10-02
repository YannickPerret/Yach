'use client'
import React, {useState} from "react";
import '@/styles/calendar.css'
import Link from 'next/link'
import SideBarUserItem from "./sideBarUserItem";

export default function SideBarUser({username, calendars, selectedIndexCalendar, editSelectedCalendar}) {

    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <Link href={`/users/${username}/dashboard`} >
                        <button>Dashboard</button>
                </Link>
                <div id="miniCalendar"></div>
                <h3>My Calendars</h3>
                <div className="sidebar-userAllCalendars">
                    {calendars?.map((calendar) => (
                        <SideBarUserItem key={calendar.id} calendar={calendar} onCalendarClick={selectedIndexCalendar} onEditClick={editSelectedCalendar}/>
                    ))}
                </div>
            </div>
        </div>
    )
}