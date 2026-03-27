import { useCallback, useRef } from 'react';

let draggedPatientId: string | null = null;
let dragGhost: HTMLElement | null = null;

export function getDraggedPatientId() {
  return draggedPatientId;
}

export function useTouchDrag(patientId: string) {
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    // Start drag after 10px of movement
    if (!isDragging.current && (dx > 10 || dy > 10)) {
      isDragging.current = true;
      draggedPatientId = patientId;

      // Create ghost element
      const el = e.currentTarget as HTMLElement;
      dragGhost = el.cloneNode(true) as HTMLElement;
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.position = 'fixed';
      dragGhost.style.pointerEvents = 'none';
      dragGhost.style.zIndex = '9999';
      dragGhost.style.opacity = '0.8';
      dragGhost.style.width = el.offsetWidth + 'px';
      document.body.appendChild(dragGhost);

      el.classList.add('dragging');
    }

    if (isDragging.current && dragGhost) {
      e.preventDefault();
      dragGhost.style.left = (touch.clientX - 40) + 'px';
      dragGhost.style.top = (touch.clientY - 40) + 'px';

      // Highlight seat under finger
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      document.querySelectorAll('.seat.touch-over').forEach(el => el.classList.remove('touch-over'));
      const seat = elemBelow?.closest('.seat');
      if (seat) {
        seat.classList.add('touch-over');
      }
    }
  }, [patientId]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('dragging');

    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }

    document.querySelectorAll('.seat.touch-over').forEach(el => el.classList.remove('touch-over'));

    if (isDragging.current) {
      const touch = e.changedTouches[0];
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const seatEl = elemBelow?.closest('.seat');
      if (seatEl) {
        const seatId = seatEl.getAttribute('data-seat-id');
        if (seatId) {
          seatEl.dispatchEvent(new CustomEvent('touchdrop', {
            bubbles: true,
            detail: { patientId },
          }));
        }
      }
    }

    isDragging.current = false;
    draggedPatientId = null;
  }, [patientId]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
