import React, {Children} from 'react';
import '@/styles/calendar.css'

export default function Modal({children, onClose}) {    

    return (
        <div className="modal" id="eventModal">
            <div className="modal-content">
             <span className="close-btn" onClick={onClose}>&times;</span>
                {Children.map(children, child => {
                    return child
                    })
                }
            </div>
        </div>
    )
}