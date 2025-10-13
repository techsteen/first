(function(){
  let animationId = null;
  let timeline = [];
  let startTimestamp = 0;
  let duration = 0;
  let onUpdate = null;
  let onStop = null;
  let isRunning = false;
  let scenarioMode = 'crane';
  let scenarioTask = null;

  function start(newTimeline, updateCb, stopCb, options){
    stop('replace');
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    timeline = Array.isArray(newTimeline) ? newTimeline.slice() : [];
    if (timeline.length === 0){
      clearCanvas(canvas);
      return;
    }
    duration = timeline[timeline.length - 1].t || 0;
    onUpdate = updateCb || function(){};
    onStop = stopCb || function(){};
    scenarioMode = options?.mode || inferMode(timeline);
    scenarioTask = options?.task || null;
    startTimestamp = performance.now();
    isRunning = true;
    animationId = requestAnimationFrame(frame);
  }

  function stop(reason){
    const wasRunning = isRunning;
    isRunning = false;
    if (animationId){
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (!wasRunning && reason !== 'replace'){
      return;
    }
    if (reason !== 'replace' && typeof onStop === 'function'){
      onStop(reason || 'user');
    }
  }

  function frame(timestamp){
    if (!animationId) return;
    const canvas = document.getElementById('simCanvas');
    if (!canvas){
      stop('error');
      return;
    }
    const ctx = canvas.getContext('2d');
    const elapsed = timestamp - startTimestamp;
    const ms = Math.min(duration, elapsed);
    const sample = sampleTimeline(ms);
    drawScene(ctx, canvas, sample);
    if (typeof onUpdate === 'function') onUpdate(sample);
    if (elapsed >= duration){
      stop('completed');
      return;
    }
    animationId = requestAnimationFrame(frame);
  }

  function sampleTimeline(ms){
    if (!timeline.length){
      return defaultSample();
    }
    if (timeline.length === 1){
      return Object.assign({}, timeline[0]);
    }
    for (let i = 0; i < timeline.length - 1; i++){
      const a = timeline[i];
      const b = timeline[i + 1];
      if (ms >= a.t && ms <= b.t){
        const ratio = (ms - a.t) / Math.max(1, (b.t - a.t));
        if (scenarioMode === 'car'){
          return {
            t: ms,
            mode: 'car',
            x: lerp(a.x, b.x, ratio),
            y: lerp(a.y, b.y, ratio),
            heading: lerpAngle(a.heading, b.heading, ratio),
            safe: ratio > 0.5 ? b.safe : a.safe,
            goal: a.goal || b.goal,
            checkpoints: Math.max(a.checkpoints || 0, b.checkpoints || 0),
            checkpointOrder: (ratio > 0.5 ? b.checkpointOrder : a.checkpointOrder) || [],
            collided: a.collided || b.collided
          };
        }
        return {
          t: ms,
          mode: 'crane',
          angle: lerp(a.angle, b.angle, ratio),
          height: lerp(a.height, b.height, ratio),
          safe: ratio > 0.5 ? b.safe : a.safe
        };
      }
    }
    return Object.assign({}, timeline[timeline.length - 1]);
  }

  function drawScene(ctx, canvas, sample){
    if (scenarioMode === 'car'){
      drawCarScene(ctx, canvas, sample, scenarioTask);
    } else {
      drawCraneScene(ctx, canvas, sample);
    }
  }

  function drawCraneScene(ctx, canvas, sample){
    const angle = sample?.angle || 0;
    const height = sample?.height || 0;
    const safe = sample?.safe || 'green';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b1726';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const baseY = canvas.height * 0.68;
    const pivotY = baseY - 60;

    ctx.fillStyle = '#22364f';
    ctx.fillRect(centerX - 80, baseY, 160, 38);
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(centerX - 26, baseY - 48, 52, 48);

    drawAngleGauge(ctx, centerX, pivotY, angle);

    const armLength = 220;
    const angleRad = (angle - 90) * Math.PI / 180;
    const pivotX = centerX;
    const tipX = pivotX + Math.cos(angleRad) * armLength;
    const tipY = pivotY + Math.sin(angleRad) * armLength;

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    const hookX = tipX;
    const hookY = tipY + Math.abs(height) * 35;

    drawHeightScale(ctx, pivotX, tipX, tipY, 35);

    ctx.strokeStyle = '#f4f5f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    ctx.fillStyle = safe === 'green' ? '#5bff8a' : safe === 'yellow' ? '#ffe66d' : '#ff6b6b';
    ctx.fillRect(hookX - 12, hookY, 24, 18);
  }

  function drawAngleGauge(ctx, pivotX, pivotY, currentAngle){
    const radius = 130;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.strokeStyle = 'rgba(255, 230, 109, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, 0, false);
    ctx.stroke();

    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 1.2;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffe66d';
    for (let deg = 0; deg <= 180; deg += 10){
      const rad = (deg - 90) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const outerX = cos * radius;
      const outerY = sin * radius;
      const innerLen = (deg % 30 === 0) ? 18 : 10;
      const innerX = cos * (radius - innerLen);
      const innerY = sin * (radius - innerLen);
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
      if (deg % 30 === 0){
        const labelRadius = radius + 14;
        ctx.fillText(`${deg}°`, cos * labelRadius - 10, sin * labelRadius + 4);
      }
    }

    const currentRad = (currentAngle - 90) * Math.PI / 180;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(currentRad) * (radius - 24), Math.sin(currentRad) * (radius - 24));
    ctx.lineTo(Math.cos(currentRad) * (radius + 8), Math.sin(currentRad) * (radius + 8));
    ctx.stroke();
    ctx.restore();
  }

  function drawHeightScale(ctx, pivotX, tipX, tipY, scale){
    const side = tipX >= pivotX ? 1 : -1;
    const offset = 24;
    const startX = tipX + side * offset;
    const startY = tipY;
    const maxMeters = 10;
    const heightPx = maxMeters * scale;
    const endY = startY + heightPx;

    ctx.save();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, endY);
    ctx.stroke();

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = side > 0 ? 'left' : 'right';
    for (let i = 0; i <= maxMeters * 4; i++){
      const y = startY + i * (scale * 0.25);
      const isMeter = i % 4 === 0;
      const tickLen = isMeter ? 12 : 7;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + side * tickLen, y);
      ctx.stroke();
      if (isMeter){
        const label = `${(i / 4).toFixed(0)} m`;
        const labelX = startX + side * (tickLen + 4);
        ctx.fillText(label, labelX, y + 4);
      }
    }
    ctx.restore();
  }

  function drawCarScene(ctx, canvas, sample, task){
    const mazeRows = Array.isArray(task?.maze) ? task.maze : [];
    const rows = mazeRows.length;
    const cols = mazeRows.reduce((max, row) => Math.max(max, row.length), 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#09121f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!rows || !cols || !sample){
      return;
    }

    const cellSize = Math.min((canvas.width * 0.9) / cols, (canvas.height * 0.85) / rows);
    const offsetX = (canvas.width - cellSize * cols) / 2;
    const offsetY = (canvas.height - cellSize * rows) / 2.2;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let y = 0; y < rows; y++){
      const row = mazeRows[y].padEnd(cols, '#');
      for (let x = 0; x < cols; x++){
        const cell = row[x];
        if (cell === '#'){
          ctx.fillStyle = '#1a2738';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#102033';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
        if (cell === 'S'){
          drawBadge(ctx, x, y, cellSize, '#4ecdc4', 'S');
        }
        if (cell === 'G'){
          drawBadge(ctx, x, y, cellSize, '#ffe66d', 'G');
        }
        if (cell === 'C'){
          drawBadge(ctx, x, y, cellSize, '#ff6b6b', 'C');
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++){
      const lineX = x * cellSize;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, rows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++){
      const lineY = y * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(cols * cellSize, lineY);
      ctx.stroke();
    }

    const labelFont = Math.max(11, cellSize * 0.22);
    const axisOffset = Math.max(12, cellSize * 0.2);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `bold ${labelFont}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = 0; x < cols; x++){
      const value = (x + 0.5).toFixed(1);
      ctx.fillText(value, x * cellSize + cellSize / 2, rows * cellSize + axisOffset);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < rows; y++){
      const value = (y + 0.5).toFixed(1);
      ctx.fillText(value, -axisOffset * 0.35, y * cellSize + cellSize / 2);
    }
    ctx.restore();

    const carX = (sample.x || 0) * cellSize;
    const carY = (sample.y || 0) * cellSize;
    const heading = (sample.heading || 0) * Math.PI / 180;
    const carLength = cellSize * 0.6;
    const carWidth = cellSize * 0.32;

    ctx.translate(carX, carY);
    ctx.rotate(heading);
    ctx.fillStyle = sample.collided ? '#ff6b6b' : '#4ecdc4';
    ctx.strokeStyle = '#0b1726';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-carLength/2, -carWidth/2, carLength, carWidth);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(carLength/2 - 4, 0);
    ctx.lineTo(carLength/2 + 10, 0);
    ctx.stroke();

    ctx.restore();
  }

  function drawBadge(ctx, gridX, gridY, cellSize, color, label){
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(gridX * cellSize + 2, gridY * cellSize + 2, cellSize - 4, cellSize - 4);
    ctx.fillStyle = color;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, gridX * cellSize + cellSize / 2, gridY * cellSize + cellSize / 2);
  }

  function clearCanvas(canvas){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function lerp(a, b, t){
    return (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;
  }

  function lerpAngle(a, b, t){
    const diff = shortestAngleDiff(a ?? 0, b ?? 0);
    return normalizeAngle((a ?? 0) + diff * t);
  }

  function shortestAngleDiff(from, to){
    let diff = normalizeAngle(to) - normalizeAngle(from);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  function normalizeAngle(angle){
    let a = angle % 360;
    if (a < 0) a += 360;
    return a;
  }

  function inferMode(list){
    const sample = list[0] || {};
    return sample.mode === 'car' || sample.x !== undefined ? 'car' : 'crane';
  }

  function defaultSample(){
    if (scenarioMode === 'car'){
      return {t:0, mode:'car', x:0, y:0, heading:0, safe:'green', checkpoints:0, collided:false};
    }
    return {t:0, mode:'crane', angle:0, height:0, safe:'green'};
  }

  window.Animator = {
    start,
    stop
  };
})();
