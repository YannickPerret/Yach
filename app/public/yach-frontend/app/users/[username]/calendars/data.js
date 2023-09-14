export async function getServerData(context) {
    const username = context.params.username;
    let calendars = [];

    if (username) {
        try {
            const response = await fetch(`http://localhost:3000/users/${username}/calendars`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            calendars = data.calendars;
        } catch (err) {
            console.error(err);
        }
    }

    return {
        calendars
    };
}
