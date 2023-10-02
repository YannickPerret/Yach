import cadenas from "../../public/images/cadenas.png";
import shared from "../../public/images/shared.png";
import Link from "next/link";
import Image from "next/image";

export default function DashboardItem({
  data,
  username,
  setSelectedCalendars,
}) {
  return (
    <div key={data.id}>
      <input
        type="checkbox"
        id={data.id}
        name="calendars"
        value={data.id}
        onChange={setSelectedCalendars}
      />
      <label htmlFor={data.id}>
        {data.type === "SHARED" && (
          <Image src={shared} alt="shared" width={25} height={25} />
        )}
        {data.name}-{" "}
        <Link href={`http://localhost:3000/api/v1/calendar/${data.id}`}>
          ics
        </Link>
      </label>
    </div>
  );
}
