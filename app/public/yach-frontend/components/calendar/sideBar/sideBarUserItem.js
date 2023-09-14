import Image from 'next/image'
import cadenas from '@/public/images/cadenas.png'
import shared from '@/public/images/shared.png'

export default function SideBarUserItem({calendar, onCalendarClick}) {
    return (
        <div key={calendar.id} onClick={() => onCalendarClick(calendar.id)}>
            {calendar.right === 'READ' && <Image src={cadenas} alt="cadenas" width={20} height={20} />}
            {calendar.type === 'SHARED' && <Image src={shared} alt="shared" width={20} height={20} />}
            {calendar.name}
            <button data-id={calendar.id} className="sidebar-userAllCalendars-editBtn">Editer</button>
        </div>
    )
}