import React from 'react';

export default function EventButton({ isEdit }) {
    return (
        <div>
            <input type="submit" value={isEdit ? "Modifier l'événement" : "Créer l'événement"} />
        </div>
    );
}
