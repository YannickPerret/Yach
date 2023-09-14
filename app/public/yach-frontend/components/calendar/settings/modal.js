import React, { useState } from 'react';
import '@/styles/calendar.css'
import Modal from '@/components/modal/modal';


export default function ModalSettings(props) {
    return (
        <Modal onClose={props.onClose}>
            <form method="POST" enctype="application/x-www-form-urlencoded" id="calendarSettings">
                <label>Calendar name :</label><input type="text" name="name" />
                <label>Calendar color :</label><input type="color" name="color" value="#ffffff" />
                <label>Calendar link :</label><input type="text" name="link" />
                <label>Synchronisation : </label><select name="synchronisation">
                    <option value="*/1 * * * *">1 minute</option>
                    <option value="*/5 * * * *">5 minutes</option>
                    <option value="*/15 * * * *">15 minutes</option>
                    <option value="*/30 * * * *">30 minutes</option>
                    <option value="0 */3 * * *">3 hours</option>
                    <option value="0 */12 * * *">12 hours</option>
                    <option value="0 0 * * *">24 hours</option>
                    <option value="0">Never</option>
                </select>
                <label>Calendar visible :</label><select name="class">
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                </select>
                <div class="calendarAssociated">
                    <div class="calendarAssociated__selected">
                        <label>Calendar associated : </label>
                        <ul id="calendarAssociated" class="calendarAssociated__list">

                        </ul>
                    </div>
                    <div class="calendarAssociated__add">
                        <label>Available calendars : </label>
                        <ul class="calendarAssociated__list" id="calendarAssociated__addNew">

                        </ul>
                    </div>
                </div>
                <input type="submit" value="Submit" />
            </form>
        </Modal>
    )
}