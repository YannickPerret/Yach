'use client'
import { Provider, useSelector } from "react-redux";
import { store } from "@/store/store";

const ErrorMessage = () => {
    const errorMessage = useSelector((state) => state.error.message);
    return errorMessage ? <div className="error-message">{errorMessage}</div> : null;
}

export default function CalendarLayout({ children }) {
    return (
        <Provider store={store}>
            <ErrorMessage />
            <main className={'container'}>
                {children}
            </main>
        </Provider>
    )
}
