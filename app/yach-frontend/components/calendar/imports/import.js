export default function ImportCalendarInput({ username, calendar, onImportConflicts }) {

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && confirm('Voulez-vous vraiment importer ce fichier ?')) {
            const formData = new FormData();
            formData.append('file', file);

            await fetch(`http://localhost:3000/users/${username}/calendars/${calendar.id}/import`, {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.conflicts?.length > 0) {
                    onImportConflicts(data.conflicts);
                    e.target.value = null
                    
                } else {
                   window.location.reload();
                }                
            })
        }
        else {
            e.target.value = null;
        }
    };

    return (
        <>
            <input type="file" accept=".ics" onChange={handleFileChange} />
        </>
    );
}
