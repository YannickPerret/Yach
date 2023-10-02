import React, { useEffect, useState } from "react";
import "@/styles/calendar.css";
import Modal from "@/components/modal/modal";
import DeleteButton from "@/components/modal/deleteButton";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserCalendarAsync,
  removeUserCalendar,
  selectUserCalendars,
  removeCalendarAsync,
} from "@/store/calendarSlice";
import CalendarAssociateItem from "./calendarAssociateItem";

export default function ModalSettings({ calendar, onClose, username }) {
  const dispatch = useDispatch();

  const [calendarName, setCalendarName] = useState(calendar.name);
  const [calendarColor, setCalendarColor] = useState(
    calendar.color || "#000000"
  );
  const [calendarLink, setCalendarLink] = useState(calendar.url || "");
  const [calendarSynchronisation, setCalendarSynchronisation] = useState(
    calendar.synch
  );
  const [calendarClass, setCalendarClass] = useState(calendar.class);
  const [calendarClassification, setCalendarClassification] = useState(
    calendar.classification
  );

  const [associatedCalendars, setAssociatedCalendars] = useState(
    calendar.children || []
  );
  const allCalendars = useSelector(selectUserCalendars);
  const availableCalendars = allCalendars.filter(
    (c) =>
      !associatedCalendars.map((calendar) => calendar.id).includes(c.id) &&
      c.id !== calendar.id
  );

  const handleCalendarUpdate = (e) => {
    e.preventDefault();

    const data = {
      id: calendar.id,
      name: calendarName,
      color: calendarColor,
      url: calendarLink,
      class: calendarClass,
      classification: calendarClassification,
      childrens: associatedCalendars.map((calendar) => calendar.id),
      syncExpressionCron: calendarSynchronisation,
      username: username,
    };

    dispatch(updateUserCalendarAsync(data));
    onClose();
  };

  const handleCalendarDelete = () => {
    if (confirm("Do you really want to delete this calendar ?")) {
      dispatch(
        removeCalendarAsync({ calendarId: calendar.id, username: username })
      );
      onClose();
    }
  };

  const addAssociatedCalendar = (calendarToAdd) => {
    setAssociatedCalendars((prev) => [...prev, calendarToAdd]);
  };

  const removeAssociatedCalendar = (calendarToRemove) => {
    setAssociatedCalendars((prev) =>
      prev.filter((c) => c.id !== calendarToRemove.id)
    );
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleCalendarUpdate}>
        <label>Calendar name :</label>
        <input
          type="text"
          name="name"
          value={calendarName}
          onChange={(e) => setCalendarName(e.target.value)}
        />
        <label>Calendar color :</label>
        <input
          type="color"
          name="color"
          value={calendarColor}
          onChange={(e) => setCalendarColor(e.target.value)}
        />
        <label>Calendar link :</label>
        <input
          type="text"
          name="link"
          value={calendarLink}
          onChange={(e) => setCalendarLink(e.target.value)}
        />
        <label>Synchronisation : </label>
        <select
          name="synchronisation"
          defaultChecked={calendarSynchronisation}
          onChange={(e) => setCalendarSynchronisation(e.target.value)}
        >
          <option value="*/1 * * * *">1 minute</option>
          <option value="*/5 * * * *">5 minutes</option>
          <option value="*/15 * * * *">15 minutes</option>
          <option value="*/30 * * * *">30 minutes</option>
          <option value="0 */3 * * *">3 hours</option>
          <option value="0 */12 * * *">12 hours</option>
          <option value="0 0 * * *">24 hours</option>
          <option value="0">Never</option>
        </select>
        <div>
          <label>Calendar visible :</label>
          <select
            name="class"
            defaultChecked={calendarClass}
            onChange={(e) => {
              setCalendarClass(e.target.value);
            }}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <label>Calendar classification :</label>
          <select
            name="classification"
            defaultChecked={calendarClassification}
            onChange={(e) => {
              setCalendarClassification(e.target.value);
            }}
          >
            <option value="PERSONAL">Personnel</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="calendarAssociated">
          <div className="calendarAssociated__selected">
            <label>Calendar associated : </label>
            <ul id="calendarAssociated" className="calendarAssociated__list">
              {associatedCalendars.map((calendarItem) => (
                <CalendarAssociateItem
                  key={calendarItem.id}
                  calendar={calendarItem}
                  action="remove"
                  removeAssociatedCalendar={removeAssociatedCalendar}
                />
              ))}
            </ul>
          </div>
          <div className="calendarAssociated__add">
            <label>Available calendars : </label>
            <ul
              className="calendarAssociated__list"
              id="calendarAssociated__addNew"
            >
              {availableCalendars
                .filter((calendar) => calendar.type !== "SHARED")
                .map((availableCalendar) => (
                  <CalendarAssociateItem
                    key={availableCalendar.id}
                    calendar={availableCalendar}
                    action="add"
                    addAssociatedCalendar={addAssociatedCalendar}
                  />
                ))}
            </ul>
          </div>
        </div>
        <div>
          <button type="submit"> Save </button>
          <DeleteButton text="Delete calendar" onClick={handleCalendarDelete} />
        </div>
      </form>
    </Modal>
  );
}
