import React from "react";

export default function DeleteButton({ text, onClick }) {
  return <button onClick={() => onClick()}> {text} </button>;
}
