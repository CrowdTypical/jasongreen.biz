function initHorizontalScroll() {
  const outer = document.getElementById('horizontal-scroll-outer');
  const track = document.getElementById('horizontal-track');
  const handle = document.getElementById('scroll-handle');
  const progressBar = document.getElementById('scroll-progress-bar');
  const segmentFills = Array.from(
    document.querySelectorAll<HTMLElement>('.segment-fill')
  );

  if (!outer || !track || !progressBar) return;

  const panels = track.querySelectorAll('.work-panel');
  const panelCount = panels.length;

  // Compute actual page-top offset (offsetTop only gives offset
  // relative to the nearest positioned ancestor, not the document).
  let outerPageTop = 0;
  function computeLayout() {
    outerPageTop = outer!.getBoundingClientRect().top + window.scrollY;
  }

  function spawnConfetti(trackEl: HTMLElement) {
    const colors = [
      '#10b981',
      '#6ee7b7',
      '#34d399',
      '#fbbf24',
      '#a78bfa',
      '#f472b6',
    ];
    for (let c = 0; c < 6; c++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${colors[c]};
        z-index: 11;
        pointer-events: none;
        box-shadow: 0 0 6px ${colors[c]};
        animation: confetti-${c} 800ms ease-out forwards;
      `;
      trackEl.appendChild(dot);
      setTimeout(() => dot.remove(), 850);
    }
  }

  function onScroll() {
    // How far we've scrolled into the outer container
    const scrolled = window.scrollY - outerPageTop;
    // Total scrollable distance (outer height minus one viewport)
    const maxScroll = outer!.offsetHeight - window.innerHeight;

    if (maxScroll <= 0) return;

    // Progress from 0 to 1
    const rawProgress = Math.max(0, Math.min(1, scrolled / maxScroll));

    // Translate the track: move from 0 to -(panelCount - 1) * 100vw
    const maxTranslate = (panelCount - 1) * window.innerWidth;
    const translateX = rawProgress * maxTranslate;

    track!.style.transform = `translateX(-${translateX}px)`;

    // Fill individual segments: each segment represents 1/segmentCount of progress
    const segmentCount = segmentFills.length;
    let latestComplete = -1;

    // First pass: determine fill widths and which segments are complete
    segmentFills.forEach((fill, i) => {
      const segStart = i / segmentCount;
      const segEnd = (i + 1) / segmentCount;
      const isFull = rawProgress >= segEnd;

      if (isFull) {
        fill.style.width = '100%';
        fill.classList.add('segment-complete');
        latestComplete = i;
      } else if (rawProgress <= segStart) {
        fill.style.width = '0%';
        if (fill.classList.contains('segment-complete')) {
          fill.classList.remove('segment-complete');
        }
      } else {
        fill.style.width = `${((rawProgress - segStart) / (segEnd - segStart)) * 100}%`;
        if (fill.classList.contains('segment-complete')) {
          fill.classList.remove('segment-complete');
        }
      }
    });

    // Second pass: only the latest completed segment gets the checkmark
    segmentFills.forEach((fill, i) => {
      const segTrack = fill.parentElement;
      if (!segTrack) return;
      const isLatest = i === latestComplete;
      const hadCheck = segTrack.classList.contains('segment-track-complete');

      if (isLatest && !hadCheck) {
        // Newly earned checkmark — show it + confetti
        segTrack.classList.remove('segment-track-leaving');
        segTrack.classList.add('segment-track-complete');
        spawnConfetti(segTrack);
      } else if (isLatest && hadCheck) {
        // Already showing, keep it
      } else if (!isLatest && hadCheck) {
        // No longer the latest — fade out
        segTrack.classList.remove('segment-track-complete');
        segTrack.classList.add('segment-track-leaving');
        setTimeout(
          () => segTrack.classList.remove('segment-track-leaving'),
          300
        );
      }
    });

    if (handle) {
      handle.style.left = `calc(${rawProgress * 100}% - 10px)`;
      handle.style.setProperty('--handle-angle', `${rawProgress * 720}deg`);

      if (rawProgress >= 1) {
        handle.classList.add('handle-complete');
      } else {
        handle.classList.remove('handle-complete');
      }
    }

    // Show/hide progress bar — only visible once scrolling has begun
    const wrapper = document.getElementById('scroll-progress-wrapper');
    if (wrapper) {
      if (rawProgress > 0) {
        wrapper.classList.remove(
          'opacity-0',
          'translate-y-full',
          'pointer-events-none'
        );
        wrapper.classList.add('opacity-100', 'translate-y-0');
      } else {
        wrapper.classList.add(
          'opacity-0',
          'translate-y-full',
          'pointer-events-none'
        );
        wrapper.classList.remove('opacity-100', 'translate-y-0');
      }
    }
  }

  // --- Drag-to-scrub on the progress bar ---
  let isDragging = false;

  function scrubToX(clientX: number, smooth = false) {
    if (!progressBar) return;
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    const maxScroll = outer!.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: outerPageTop + ratio * maxScroll,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }

  if (progressBar) {
    // Segment click — snap to that panel
    segmentFills.forEach((fill) => {
      const segmentTrack = fill.parentElement;
      if (!segmentTrack) return;
      segmentTrack.addEventListener('click', (e) => {
        e.stopPropagation();
        const panelIndex = Number(fill.dataset.segment);
        const maxScroll = outer.offsetHeight - window.innerHeight;
        const targetProgress =
          panelCount <= 1 ? 0 : panelIndex / (panelCount - 1);
        window.scrollTo({
          top: outerPageTop + targetProgress * maxScroll,
          behavior: 'smooth',
        });
      });
    });

    progressBar.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isDragging = true;
      progressBar.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
      scrubToX(e.clientX, true);
    });
    progressBar.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      // Only respond to horizontal movement — clamp to bar bounds
      const barRect = progressBar.getBoundingClientRect();
      const clampedX = Math.max(
        barRect.left,
        Math.min(barRect.right, e.clientX)
      );
      scrubToX(clampedX);
    });
    function stopDrag() {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = '';
      }
    }
    progressBar.addEventListener('pointerup', stopDrag);
    progressBar.addEventListener('pointercancel', stopDrag);
    document.addEventListener('pointerup', stopDrag);
  }

  computeLayout();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      computeLayout();
      onScroll();
    },
    { passive: true }
  );
  onScroll();
}

// Run on load
document.addEventListener('DOMContentLoaded', initHorizontalScroll);
// Also run immediately in case DOMContentLoaded already fired (Astro client nav)
if (document.readyState !== 'loading') {
  initHorizontalScroll();
}
