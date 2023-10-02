export async function getServerData(context) {
    const username = context.params.username;
    let calendars = [];
    let title = 'Yach - Dashboard';
    
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
            title = `Yach - ${username} - Dashboard`;
        } catch (err) {
            console.error(err);
        }
    }

    return {
        data: {
            title,
            calendars
        }
    };
}
