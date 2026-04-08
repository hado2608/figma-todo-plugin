const { widget } = figma;
const { AutoLayout, Text, Rectangle, Input, useSyncedState } = widget;

declare const __html__: string;

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const PURPLE   = '#7C3AED';
const WHITE    = '#FFFFFF';
const DARK     = '#1A1A1A';
const LAVENDER = '#D8B4FE';
const GRAY     = '#BBBBBB';
const GRAY_RGB = { r: 0.6, g: 0.6, b: 0.6, a: 1 };

function TodoWidget() {
  const [header, setHeader]     = useSyncedState<string>('header', 'Header');
  const [todos, setTodos]       = useSyncedState<Todo[]>('todos', []);
  const [deadline, setDeadline] = useSyncedState<string | null>('deadline', null);

  function toggleTodo(id: string) {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos([...todos, { id: String(Date.now()), text: trimmed, done: false }]);
  }

  function openDatePicker() {
    return new Promise<void>(resolve => {
      figma.showUI(__html__, { width: 280, height: 56, title: 'Set deadline' });
      if (deadline) figma.ui.postMessage({ type: 'set-date', date: deadline });
      figma.ui.on('message', (msg: { type: string; date: string | null }) => {
        if (msg.type === 'date-selected') {
          setDeadline(msg.date || null);
          figma.closePlugin();
          resolve();
        }
      });
    });
  }

  return (
    <AutoLayout
      name="to-do"
      direction="vertical"
      width={320}
    >

      {/* ── Purple header ── */}
      <AutoLayout
        direction="vertical"
        fill={PURPLE}
        padding={16}
        spacing={6}
        width="fill-parent"
      >
        <AutoLayout
          direction="horizontal"
          width="fill-parent"
          verticalAlignItems="center"
          spacing={8}
        >
          <Input
            value={header}
            onTextEditEnd={e => setHeader(e.characters || 'Header')}
            placeholder="Header"
            fontFamily="Inter"
            fontWeight={700}
            fontSize={16}
            fill={WHITE}
            width="fill-parent"
          />
          <Text fontSize={14} onClick={openDatePicker}>📅</Text>
        </AutoLayout>

        {deadline ? (
          <Text
            fontFamily="Inter"
            italic={true}
            fontSize={13}
            fill={LAVENDER}
          >
            {formatDeadline(deadline)}
          </Text>
        ) : null}
      </AutoLayout>

      {/* ── White body ── */}
      <AutoLayout
        direction="vertical"
        fill={WHITE}
        padding={{ top: 14, bottom: 20, left: 14, right: 14 }}
        spacing={10}
        width="fill-parent"
      >
        {todos.length === 0 ? (
          <Text fontFamily="Inter" fontSize={13} fill={GRAY_RGB}>
            No to-dos yet.
          </Text>
        ) : null}

        {todos.map(todo => (
          <AutoLayout
            key={todo.id}
            direction="horizontal"
            spacing={10}
            width="fill-parent"
            verticalAlignItems="center"
          >
            <Rectangle
              width={10}
              height={10}
              stroke={DARK}
              strokeWidth={1.5}
              fill={todo.done ? DARK : WHITE}
              onClick={() => toggleTodo(todo.id)}
            />
            <Text
              fontFamily="Inter"
              fontSize={13}
              fill={todo.done ? GRAY_RGB : DARK}
              textDecoration={todo.done ? 'strikethrough' : 'none'}
              width="fill-parent"
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.text}
            </Text>
          </AutoLayout>
        ))}

        {/* Add-todo row */}
        <AutoLayout
          direction="horizontal"
          spacing={10}
          width="fill-parent"
          verticalAlignItems="center"
        >
          <Rectangle
            width={10}
            height={10}
            stroke={GRAY}
            strokeWidth={1.5}
            fill={WHITE}
          />
          <Input
            value=""
            onTextEditEnd={e => {
              if (e.key !== 'ESC') addTodo(e.characters);
            }}
            placeholder="Add a to-do…"
            fontFamily="Inter"
            fontSize={13}
            fill={GRAY}
            width="fill-parent"
          />
        </AutoLayout>
      </AutoLayout>

    </AutoLayout>
  );
}

function formatDeadline(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return 'by ' + date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

widget.register(TodoWidget);
