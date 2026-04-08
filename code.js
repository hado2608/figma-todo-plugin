"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // code.tsx
  var { widget } = figma;
  var { AutoLayout, Text, Rectangle, Input, useSyncedState } = widget;
  var PURPLE = "#7C3AED";
  var WHITE = "#FFFFFF";
  var DARK = "#1A1A1A";
  var LAVENDER = "#D8B4FE";
  var GRAY = "#BBBBBB";
  var GRAY_RGB = { r: 0.6, g: 0.6, b: 0.6, a: 1 };
  function TodoWidget() {
    const [header, setHeader] = useSyncedState("header", "Header");
    const [todos, setTodos] = useSyncedState("todos", []);
    const [deadline, setDeadline] = useSyncedState("deadline", null);
    function toggleTodo(id) {
      setTodos(todos.map((t) => t.id === id ? __spreadProps(__spreadValues({}, t), { done: !t.done }) : t));
    }
    function addTodo(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTodos([...todos, { id: String(Date.now()), text: trimmed, done: false }]);
    }
    function deleteTodo(id) {
      setTodos(todos.filter((t) => t.id !== id));
    }
    function openDatePicker() {
      return new Promise((resolve) => {
        figma.showUI(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 10px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
    height: 56px;
    background: #fff;
  }
  input[type="date"] {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  input[type="date"]:focus { border-color: #7C3AED; }
  .btn {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    white-space: nowrap;
  }
  .set  { background: #7C3AED; color: #fff; }
  .clear { background: #f0f0f0; color: #555; }
</style>
</head>
<body>
  <input type="date" id="date-input" />
  <button class="btn set"   id="set-btn">Set</button>
  <button class="btn clear" id="clear-btn">Clear</button>
  <script>
    window.onmessage = function(e) {
      var msg = e.data.pluginMessage;
      if (msg && msg.type === 'set-date' && msg.date) {
        document.getElementById('date-input').value = msg.date;
      }
    };
    document.getElementById('set-btn').addEventListener('click', function() {
      var val = document.getElementById('date-input').value;
      parent.postMessage({ pluginMessage: { type: 'date-selected', date: val || null } }, '*');
    });
    document.getElementById('clear-btn').addEventListener('click', function() {
      parent.postMessage({ pluginMessage: { type: 'date-selected', date: null } }, '*');
    });
  <\/script>
</body>
</html>
`, { width: 280, height: 56, title: "Set deadline" });
        if (deadline) figma.ui.postMessage({ type: "set-date", date: deadline });
        figma.ui.on("message", (msg) => {
          if (msg.type === "date-selected") {
            setDeadline(msg.date || null);
            figma.closePlugin();
            resolve();
          }
        });
      });
    }
    return /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        name: "to-do",
        direction: "vertical",
        width: 320
      },
      /* @__PURE__ */ figma.widget.h(
        AutoLayout,
        {
          direction: "vertical",
          fill: PURPLE,
          padding: 16,
          spacing: 6,
          width: "fill-parent"
        },
        /* @__PURE__ */ figma.widget.h(
          AutoLayout,
          {
            direction: "horizontal",
            width: "fill-parent",
            verticalAlignItems: "center",
            spacing: 8
          },
          /* @__PURE__ */ figma.widget.h(
            Input,
            {
              value: header,
              onTextEditEnd: (e) => setHeader(e.characters || "Header"),
              placeholder: "Header",
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 16,
              fill: WHITE,
              width: "fill-parent"
            }
          ),
          /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, onClick: openDatePicker }, "\u{1F4C5}")
        ),
        deadline ? /* @__PURE__ */ figma.widget.h(
          Text,
          {
            fontFamily: "Inter",
            italic: true,
            fontSize: 13,
            fill: LAVENDER
          },
          formatDeadline(deadline)
        ) : null
      ),
      /* @__PURE__ */ figma.widget.h(
        AutoLayout,
        {
          direction: "vertical",
          fill: WHITE,
          padding: { top: 14, bottom: 20, left: 14, right: 14 },
          spacing: 10,
          width: "fill-parent"
        },
        todos.length === 0 ? /* @__PURE__ */ figma.widget.h(Text, { fontFamily: "Inter", fontSize: 13, fill: GRAY_RGB }, "No to-dos yet.") : null,
        todos.map((todo) => /* @__PURE__ */ figma.widget.h(
          AutoLayout,
          {
            key: todo.id,
            direction: "horizontal",
            spacing: 10,
            width: "fill-parent",
            verticalAlignItems: "center"
          },
          /* @__PURE__ */ figma.widget.h(
            Rectangle,
            {
              width: 10,
              height: 10,
              stroke: DARK,
              strokeWidth: 1.5,
              fill: todo.done ? DARK : WHITE,
              onClick: () => toggleTodo(todo.id)
            }
          ),
          /* @__PURE__ */ figma.widget.h(
            Text,
            {
              fontFamily: "Inter",
              fontSize: 13,
              fill: todo.done ? GRAY_RGB : DARK,
              textDecoration: todo.done ? "strikethrough" : "none",
              width: "fill-parent",
              onClick: () => toggleTodo(todo.id)
            },
            todo.text
          ),
          /* @__PURE__ */ figma.widget.h(
            Text,
            {
              fontSize: 14,
              fill: GRAY_RGB,
              onClick: () => deleteTodo(todo.id)
            },
            "\xD7"
          )
        )),
        /* @__PURE__ */ figma.widget.h(
          AutoLayout,
          {
            direction: "horizontal",
            spacing: 10,
            width: "fill-parent",
            verticalAlignItems: "center"
          },
          /* @__PURE__ */ figma.widget.h(
            Rectangle,
            {
              width: 10,
              height: 10,
              stroke: GRAY,
              strokeWidth: 1.5,
              fill: WHITE
            }
          ),
          /* @__PURE__ */ figma.widget.h(
            Input,
            {
              value: "",
              onTextEditEnd: (e) => {
                if (e.key !== "ESC") addTodo(e.characters);
              },
              placeholder: "Add a to-do\u2026",
              fontFamily: "Inter",
              fontSize: 13,
              fill: GRAY,
              width: "fill-parent"
            }
          )
        )
      )
    );
  }
  function formatDeadline(iso) {
    const date = /* @__PURE__ */ new Date(iso + "T00:00:00");
    return "by " + date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }
  widget.register(TodoWidget);
})();
