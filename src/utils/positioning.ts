interface Position {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export function calculateDropdownPosition(
  triggerElement: HTMLElement,
  dropdownElement: HTMLElement,
  spacing: number = 4
): Position {
  const triggerRect = triggerElement.getBoundingClientRect();
  const dropdownRect = dropdownElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Calculate available space in different directions
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const spaceRight = viewportWidth - triggerRect.right;
  const spaceLeft = triggerRect.left;

  const position: Position = {};

  // Determine vertical position
  if (spaceBelow >= dropdownRect.height || spaceBelow >= spaceAbove) {
    // Position below
    position.top = `${triggerRect.bottom + spacing}px`;
  } else {
    // Position above
    position.bottom = `${viewportHeight - triggerRect.top + spacing}px`;
  }

  // Determine horizontal position
  if (spaceRight >= dropdownRect.width) {
    // Align with left edge
    position.left = `${triggerRect.left}px`;
  } else if (spaceLeft >= dropdownRect.width) {
    // Align with right edge
    position.right = `${viewportWidth - triggerRect.right}px`;
  } else {
    // Center align if possible, otherwise align with left edge
    position.left = `${Math.max(spacing, Math.min(
      triggerRect.left,
      viewportWidth - dropdownRect.width - spacing
    ))}px`;
  }

  return position;
}
