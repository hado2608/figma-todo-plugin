interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface StickerData {
  header: string;
  deadline: string | null;
  todos: Todo[];
}

const PLUGIN_DATA_KEY = 'getitdone';
const STICKER_MARKER = 'getitdone-sticker';

// Colors
const PURPLE = { r: 0.486, g: 0.227, b: 0.929 }; // #7C3AED
const WHITE = { r: 1, g: 1, b: 1 };
const NEAR_BLACK = { r: 0.102, g: 0.102, b: 0.102 }; // #1A1A1A
const LAVENDER = { r: 0.847, g: 0.706, b: 0.996 }; // #D8B4FE

figma.showUI(__html__, { width: 340, height: 480, title: 'getitdone' });

// On open: check if a sticker is already selected
const selected = figma.currentPage.selection[0];
if (selected && selected.getPluginData(STICKER_MARKER) === 'true') {
  const raw = selected.getPluginData(PLUGIN_DATA_KEY);
  if (raw) {
    figma.ui.postMessage({ type: 'load-sticker', data: JSON.parse(raw), nodeId: selected.id });
  }
}

figma.on('selectionchange', () => {
  const node = figma.currentPage.selection[0];
  if (node && node.getPluginData(STICKER_MARKER) === 'true') {
    const raw = node.getPluginData(PLUGIN_DATA_KEY);
    figma.ui.postMessage({ type: 'load-sticker', data: JSON.parse(raw), nodeId: node.id });
  } else {
    figma.ui.postMessage({ type: 'deselect' });
  }
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-sticker') {
    const data: StickerData = { header: 'Header', deadline: null, todos: [] };
    const sticker = await buildSticker(data);
    sticker.x = figma.viewport.center.x - sticker.width / 2;
    sticker.y = figma.viewport.center.y - sticker.height / 2;
    figma.currentPage.appendChild(sticker);
    figma.currentPage.selection = [sticker];
    figma.viewport.scrollAndZoomIntoView([sticker]);
    figma.ui.postMessage({ type: 'load-sticker', data, nodeId: sticker.id });
  }

  if (msg.type === 'update-sticker') {
    const node = figma.getNodeById(msg.nodeId) as FrameNode | null;
    if (!node) return;
    const data: StickerData = msg.data;
    node.setPluginData(PLUGIN_DATA_KEY, JSON.stringify(data));
    await rebuildSticker(node, data);
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

async function loadFont(weight: 'Regular' | 'Bold' | 'Italic') {
  const family = 'Inter';
  const style = weight === 'Italic' ? 'Italic' : weight;
  await figma.loadFontAsync({ family, style });
}

async function buildSticker(data: StickerData): Promise<FrameNode> {
  await loadFont('Regular');
  await loadFont('Bold');
  await loadFont('Italic');

  // Outer wrapper (vertical auto-layout, no fill — holds label + card)
  const wrapper = figma.createFrame();
  wrapper.name = 'to-do';
  wrapper.layoutMode = 'VERTICAL';
  wrapper.itemSpacing = 6;
  wrapper.paddingTop = 0;
  wrapper.paddingBottom = 0;
  wrapper.paddingLeft = 0;
  wrapper.paddingRight = 0;
  wrapper.fills = [];
  wrapper.clipsContent = false;
  wrapper.setPluginData(STICKER_MARKER, 'true');
  wrapper.setPluginData(PLUGIN_DATA_KEY, JSON.stringify(data));
  wrapper.counterAxisSizingMode = 'FIXED';
  wrapper.resize(400, 100); // will grow with content

  // Card frame (vertical auto-layout)
  const card = figma.createFrame();
  card.name = 'card';
  card.layoutMode = 'VERTICAL';
  card.itemSpacing = 0;
  card.paddingTop = 0;
  card.paddingBottom = 0;
  card.paddingLeft = 0;
  card.paddingRight = 0;
  card.fills = [];
  card.clipsContent = true;
  card.counterAxisSizingMode = 'FIXED';
  card.primaryAxisSizingMode = 'AUTO';
  card.resize(400, 100);
  wrapper.appendChild(card);

  // Header section
  const header = buildHeaderSection(data);
  card.appendChild(header);

  // Body section
  const body = buildBodySection(data);
  card.appendChild(body);

  wrapper.primaryAxisSizingMode = 'AUTO';
  wrapper.counterAxisSizingMode = 'AUTO';

  return wrapper;
}

function buildHeaderSection(data: StickerData): FrameNode {
  const header = figma.createFrame();
  header.name = 'header';
  header.layoutMode = 'VERTICAL';
  header.itemSpacing = 8;
  header.paddingTop = 24;
  header.paddingBottom = 24;
  header.paddingLeft = 24;
  header.paddingRight = 24;
  header.fills = [{ type: 'SOLID', color: PURPLE }];
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'FIXED';
  header.layoutAlign = 'STRETCH';

  // Title row: header text + calendar icon placeholder
  const titleRow = figma.createFrame();
  titleRow.name = 'title-row';
  titleRow.layoutMode = 'HORIZONTAL';
  titleRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  titleRow.counterAxisAlignItems = 'CENTER';
  titleRow.fills = [];
  titleRow.primaryAxisSizingMode = 'FIXED';
  titleRow.counterAxisSizingMode = 'AUTO';
  titleRow.layoutAlign = 'STRETCH';

  const titleText = figma.createText();
  titleText.name = 'title';
  titleText.characters = data.header || 'Header';
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fontSize = 16;
  titleText.fills = [{ type: 'SOLID', color: WHITE }];
  titleText.layoutGrow = 1;
  titleRow.appendChild(titleText);

  // Calendar icon (text emoji as placeholder)
  const calIcon = figma.createText();
  calIcon.name = 'calendar-icon';
  calIcon.characters = '📅';
  calIcon.fontName = { family: 'Inter', style: 'Regular' };
  calIcon.fontSize = 16;
  calIcon.fills = [{ type: 'SOLID', color: WHITE }];
  titleRow.appendChild(calIcon);

  header.appendChild(titleRow);

  // Deadline row (only if deadline is set)
  if (data.deadline) {
    const deadlineText = figma.createText();
    deadlineText.name = 'deadline';
    deadlineText.characters = formatDeadline(data.deadline);
    deadlineText.fontName = { family: 'Inter', style: 'Italic' };
    deadlineText.fontSize = 16;
    deadlineText.fills = [{ type: 'SOLID', color: LAVENDER }];
    header.appendChild(deadlineText);
  }

  return header;
}

function buildBodySection(data: StickerData): FrameNode {
  const body = figma.createFrame();
  body.name = 'body';
  body.layoutMode = 'VERTICAL';
  body.itemSpacing = 4;
  body.paddingTop = 16;
  body.paddingBottom = 24;
  body.paddingLeft = 16;
  body.paddingRight = 16;
  body.fills = [{ type: 'SOLID', color: WHITE }];
  body.primaryAxisSizingMode = 'AUTO';
  body.counterAxisSizingMode = 'FIXED';
  body.layoutAlign = 'STRETCH';

  if (data.todos.length === 0) {
    const placeholder = figma.createText();
    placeholder.name = 'placeholder';
    placeholder.fontName = { family: 'Inter', style: 'Regular' };
    placeholder.characters = 'No to-dos yet.';
    placeholder.fontSize = 16;
    placeholder.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7 } }];
    body.appendChild(placeholder);
    return body;
  }

  for (const todo of data.todos) {
    const line = figma.createText();
    line.name = `todo-${todo.id}`;
    line.fontName = { family: 'Inter', style: 'Regular' };
    line.characters = (todo.done ? '\u25A0' : '\u25A1') + '  ' + todo.text;
    line.fontSize = 16;
    line.lineHeight = { value: 24, unit: 'PIXELS' };
    line.fills = [{ type: 'SOLID', color: NEAR_BLACK }];
    line.textDecoration = todo.done ? 'STRIKETHROUGH' : 'NONE';
    line.textAutoResize = 'HEIGHT';
    line.layoutAlign = 'STRETCH';
    body.appendChild(line);
  }

  return body;
}

async function rebuildSticker(wrapper: FrameNode, data: StickerData): Promise<void> {
  await loadFont('Regular');
  await loadFont('Bold');
  await loadFont('Italic');

  const card = wrapper.findOne(n => n.name === 'card') as FrameNode | null;
  if (!card) return;

  // Rebuild header
  const oldHeader = card.findOne(n => n.name === 'header');
  if (oldHeader) oldHeader.remove();
  const newHeader = buildHeaderSection(data);
  card.insertChild(0, newHeader);

  // Rebuild body
  const oldBody = card.findOne(n => n.name === 'body');
  if (oldBody) oldBody.remove();
  const newBody = buildBodySection(data);
  card.appendChild(newBody);
}

function formatDeadline(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return 'by ' + date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
