import Image from "next/image";
import Cadenas from "@/public/images/cadenas.png";

export default function CalendarAssociateItem({calendar, action, removeAssociatedCalendar, addAssociatedCalendar}) {
    return (
        <li>
                {calendar.right === 'READ' && <Image src={Cadenas} width={20} height={20} alt="cadenas" />}
                {calendar.name} 
                {action === 'add' && <button type="button" onClick={() => addAssociatedCalendar(calendar)}>Ajouter</button>}
                {action === 'remove' && <button type="button" onClick={() => removeAssociatedCalendar(calendar)}>Supprimer</button>}
        </li>
    )
}