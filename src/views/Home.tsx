import React, { useState, useEffect } from "react";
import SideNotes from "../components/notes/SideNotes";
import { TreeNote } from "../utils/types/notes";
import { AppCtxt } from "../Context";
import { base64Decode } from "../utils/functions";
import MdEditorContainer from "../components/editors/MdEditorContainer";
import { configure, GlobalHotKeys } from "react-hotkeys";

configure({
  ignoreTags: [],
});

const keyMap = {
  MD_PREVIEW: "Control+p",
  MD_SAVE: "Control+s",
  MOVE_UP: ["up"],
  EDIT_MODE: ["e"],
};

export default function Home() {
  const [currNote, setCurrNote] = useState({} as any);
  const [contentChangedCounter, setContentChangedCounter] = useState(0);
  const { setSidenotes, togglePreview, saveNote } = React.useContext(AppCtxt);
  const [eTag, setETag] = useState("" as any);

  const handlers = {
    MD_PREVIEW: (e: KeyboardEvent | undefined) => {
      // Just Send events to child // OR fire only event and toggle from outside
      togglePreview();
    },
    MD_SAVE: (e: KeyboardEvent | undefined) => {
      // Just Send events to child
      console.log("save logic");
      saveNote(); // Just trigger function
    },
    EDIT_MODE: (e: KeyboardEvent | undefined) => {
      console.log("in edit mode ");
    },
    MOVE_UP: (e: KeyboardEvent | undefined) => {
      // You could prevent key e.preventDefault();
      console.log("in move up");
    },
  };

  // State context Stupidity
  useEffect(() => {
    async function fetchNotes() {
      console.log("fetchNotes");
      const headersObj = new Headers({
        Authorization: `Token ${process.env.REACT_APP_GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
        "If-None-Match": eTag,
      });
      const data = await fetch(
        `https://api.github.com/repos/fireb1003/noterepo-repo/contents`,
        {
          headers: headersObj,
        }
      );
      if (data.status === 200) {
        const notes = (await data.json()) as TreeNote[];
        setSidenotes(notes);
        setETag(data.headers.get("ETag"));
      }
    }
    fetchNotes();
  }, [contentChangedCounter, eTag, setSidenotes]);

  async function selectNote(singleNote: TreeNote) {
    const headersObj = new Headers({
      Authorization: `Token ${process.env.REACT_APP_GITHUB_TOKEN}`,
      Accept: "application/json",
      "If-None-Match": "",
    });
    const response = await fetch(singleNote.url, {
      headers: headersObj,
    });

    let json = await response.json();
    console.log(json);
    singleNote.content = base64Decode(json.content);
    singleNote.sha = json.sha;
    setCurrNote(singleNote);
  }

  return (
    <div className="flex">
      <div className="w-1/5 bg-gray-100 text-left ">
        <SideNotes
          onSelectNote={selectNote}
          onContentChanges={() =>
            setContentChangedCounter(1 + contentChangedCounter)
          }
        />
      </div>
      <div className="w-4/5 text-left p-2">
        {/**
        <DraftEditor
          note={currNote}
          onDelete={() => setContentChangedCounter(1 + contentChangedCounter)}
          onSave={async () => {
            // Refresh Side Tree Notes i don't know why
            setContentChangedCounter(1 + contentChangedCounter);
            // selectNote(currNote);
          }}
        />
         */}
        <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
        <MdEditorContainer
          note={currNote}
          onChange={() => setContentChangedCounter(1 + contentChangedCounter)}
        />
      </div>
    </div>
  );
}
