"use client";
import { useState, useEffect } from "react";
import { getServerData } from "./data";
import DashboardItem from "../../../../components/dashboard/items";

import Head from "next/head";

const Dashboard = () => {
  const [username, setUsername] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [title, setTitle] = useState(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [calendarFile, setCalendarFile] = useState(null);
  const [calendarClassification, setCalendarClassification] =
    useState("PERSONAL");
  const [calendarClassVisibility, setCalendarClassVisibility] =
    useState("PUBLIC");
  const [error, setError] = useState(null);
  const [selectedCalendars, setSelectedCalendars] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("token") || !localStorage.getItem("username")) {
      window.location.href = "/";
      return;
    }
    setUsername(localStorage.getItem("username"));
    loadCalendars();
  }, []);

  useEffect(() => {
    const dynamicLinks = document.querySelectorAll(".dynamic-link");
    dynamicLinks.forEach((link) => {
      link.href = link.href.replace("username", username);
    });

    document.querySelector("#username").value = username;

    const fileInput = document.querySelector("#file");
    const pathUrl = document.querySelector("#pathUrl");

    fileInput.addEventListener("change", () => {
      if (fileInput.value) {
        pathUrl.disabled = true;
      } else {
        pathUrl.disabled = false;
      }
    });

    pathUrl.addEventListener("change", () => {
      if (pathUrl.value) {
        fileInput.disabled = true;
      } else {
        fileInput.disabled = false;
      }
    });
  }, [username]);

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      setSelectedCalendars((prevState) => [...prevState, e.target.value]);
    } else {
      setSelectedCalendars((prevState) =>
        prevState.filter((id) => id !== e.target.value)
      );
    }
  };

  const loadCalendars = () => {
    getServerData({
      params: { username: localStorage.getItem("username") },
    }).then((data) => {
      if (data.data?.calendars.length === 0) {
        return;
      }
      setCalendars(data.data.calendars);
      setTitle(data.data.title);
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();

    const errorDiv = document.querySelector("#error");
    !username && setError("Username is required");
    !calendarTitle && setError("Calendar title is required");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("nameCalendarInput", calendarTitle);
    formData.append("calendarUrl", calendarUrl);
    formData.append("classification", calendarClassification);
    formData.append("class", calendarClassVisibility);

    // Ajout du fichier au formData
    const fileInput = document.querySelector("#file");
    if (fileInput.files[0]) {
      formData.append("file", fileInput.files[0]);
    }

    selectedCalendars.forEach((calendar, index) => {
      formData.append(`calendars[${index}]`, calendar);
    });

    fetch(`http://localhost:3000/api/v1/calendar`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        loadCalendars();
        //window.location.href = `/users/${username}/calendars/${data.calendar.id}`;
      })
      .catch((err) => {
        console.error(err);
        errorDiv.textContent = err.message || "Something went wrong!";
      });
  };

  const createNewCalendar = async () => {
    await fetch(`http://localhost:3000/users/${username}/calendars`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        loadCalendars();
        showErrorMessage(data.message, "success");
      })
      .catch((err) => {
        console.error(err);
        showErrorMessage(err.error || "Something went wrong!");
      });
  };

  const showErrorMessage = (message, type = "error") => {
    let divError = document.getElementById("error");

    setTimeout(() => {
      divError.textContent = "";
      divError.style.display = "none";
    }, 10000);

    if (type === "error") {
      divError.style.background = "#FFCCCC";
    } else {
      divError.style.background = "green";
    }
    divError.style.display = "block";
    divError.textContent = message;
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <div>
        <div id="error"></div>
        <button
          type="button"
          onClick={() => (window.location.href = "/logout")}
        >
          Logout
        </button>
        <br />
        <button
          type="button"
          onClick={() =>
            (window.location.href = `/users/${username}/calendars`)
          }
          id="showMyCalendar"
        >
          See my calendars
        </button>
        <br />
        <button type="button" onClick={() => createNewCalendar()}>
          Create empty calendar
        </button>
        <br />

        <form
          method="post"
          encType="multipart/form-data"
          onSubmit={(e) => submitForm(e)}
        >
          <input type="text" name="username" id="username" hidden />
          <br />
          <h2>Create a new Calendar</h2>
          <label>Upload calendar : </label>
          <input
            type="file"
            name="file"
            id="file"
            onChange={(e) => setCalendarFile(e.target.value)}
          />
          <br />
          <label htmlFor="pathUrl">Or by URL</label>
          <input
            type="text"
            name="calendarUrl"
            id="pathUrl"
            placeholder="https://exemple.com/calendar.ics"
            onChange={(e) => setCalendarUrl(e.target.value)}
          />
          <br />
          <label>Calendar classification : </label>
          <select
            name="classification"
            onChange={(e) => setCalendarClassification(e.target.value)}
          >
            <option value="PERSONAL">Personal</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="OTHER">Other</option>
          </select>
          <br />
          <label>Calendar Privacy : </label>
          <select
            name="class_visiblity"
            onChange={(e) => setCalendarClassVisibility(e.target.value)}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <br />
          <label>Calendar name : </label>
          <input
            type="text"
            name="name"
            id="name"
            onChange={(e) => setCalendarTitle(e.target.value)}
          />
          <br />
          <br />
          <h2>Select your calendars :</h2>
          {calendars && calendars.length === 0 ? (
            <p>Don't have calendars available</p>
          ) : (
            <>
              <h3>Personal team</h3>
              {calendars.length > 0 &&
                calendars
                  .sort((a, b) => {
                    if (a.type < b.type) {
                      return -1;
                    }
                    if (a.type > b.type) {
                      return 1;
                    }
                    return 0;
                  })
                  .map((calendar) => {
                    switch (calendar.classification) {
                      case "PERSONAL":
                      case "PROFESSIONAL":
                      case "OTHER":
                        return (
                          <DashboardItem
                            key={calendar.id}
                            data={calendar}
                            username={username}
                            setSelectedCalendars={handleCheckboxChange}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
            </>
          )}
          <input type="submit" value="Submit" />
        </form>
      </div>
    </>
  );
};

export default Dashboard;
