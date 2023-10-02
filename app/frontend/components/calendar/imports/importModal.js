import React, { useState } from 'react';
import Modal from '@/components/modal/modal';
import '@/styles/modal.css'

export default function ImportModal({ conflicts, onResolve, onClose }) {
    const [selectedEvents, setSelectedEvents] = useState({});

    const handleEventSelection = (eventId, chosenEvent) => {
        setSelectedEvents(prev => ({ ...prev, [eventId]: chosenEvent }));
    };

    return (
        <Modal onClose={onClose}>
            <div className='modal-imported'>
                <h2>Conflits détectés</h2>
                <div className='modal-imported-list'>
                    {conflicts.map((conflict, index) => (
                        <div key={index} className='modal-imported-list-item'>
                            <div className='modal-item-existing'>
                            <input type="checkbox" onChange={() => handleEventSelection(conflict.existing.id, conflict.existing)}/>
                            <h4>Version existante</h4>
                                <p>title : {conflict.existing.summary}</p>
                                <p>Start : {conflict.existing.start}</p>
                                <p>End : {conflict.existing.end}</p>
                                <p>Location : {conflict.existing.location}</p>
                                
                            </div>
        
                            <div className='modal-item-imported'>
                                <input type="checkbox" onChange={() => handleEventSelection(conflict.imported.id, conflict.imported)} />
                                <h4>Version importée</h4>
                                <p>title : {conflict.imported.summary}</p>
                                <p>Start : {conflict.imported.start}</p>
                                <p>End : {conflict.imported.end}</p>
                                <p>Location : {conflict.imported.location}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                <button onClick={() => onResolve(selectedEvents)}>Soumettre</button>
            </div>
        </Modal>
    );
}