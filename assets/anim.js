(function(){
  let animationId = null;
  let timeline = [];
  let startTimestamp = 0;
  let duration = 0;
  let onUpdate = null;
  let onStop = null;
  let isRunning = false;

  function start(newTimeline, updateCb, stopCb){
    stop('replace');
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    timeline = Array.isArray(newTimeline) ? newTimeline.slice() : [];
    if (timeline.length === 0){
      clearCanvas(canvas);
      return;
    }
    duration = timeline[timeline.length - 1].t;
    onUpdate = updateCb || function(){};
    onStop = stopCb || function(){};
    startTimestamp = performance.now();
    isRunning = timeline.length > 0;
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
    if (timeline.length === 0){
      return {t:0, angle:0, height:0, safe:'green'};
    }
    const target = ms;
    for (let i = 0; i < timeline.length - 1; i++){
      const a = timeline[i];
      const b = timeline[i+1];
      if (target >= a.t && target <= b.t){
        const ratio = (target - a.t) / Math.max(1, (b.t - a.t));
        return {
          t: target,
          angle: lerp(a.angle, b.angle, ratio),
          height: lerp(a.height, b.height, ratio),
          safe: ratio > 0.5 ? b.safe : a.safe
        };
      }
    }
    return timeline[timeline.length - 1];
  }

  function drawScene(ctx, canvas, sample){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b1726';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const baseY = canvas.height * 0.68;

    // draw base
    ctx.fillStyle = '#22364f';
    ctx.fillRect(centerX - 80, baseY, 160, 40);
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(centerX - 30, baseY - 50, 60, 50);

    const armLength = 220;
    const angleRad = (sample.angle - 90) * Math.PI / 180;
    const pivotX = centerX;
    const pivotY = baseY - 60;

    drawAngleGauge(ctx, pivotX, pivotY, sample.angle);

    const tipX = pivotX + Math.cos(angleRad) * armLength;
    const tipY = pivotY + Math.sin(angleRad) * armLength;

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    const hookX = tipX;
    const hookY = tipY + Math.abs(sample.height) * 35;

    drawHeightScale(ctx, pivotX, tipX, tipY, 35);

    ctx.strokeStyle = '#f4f5f7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    ctx.fillStyle = sample.safe === 'green' ? '#5bff8a' : sample.safe === 'yellow' ? '#ffe66d' : '#ff6b6b';
    ctx.fillRect(hookX - 12, hookY, 24, 18);
  }

  function clearCanvas(canvas){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function lerp(a, b, t){
    return a + (b - a) * t;
  }

  function drawAngleGauge(ctx, pivotX, pivotY, currentAngle){
    const radius = 130;
    const inner = radius - 18;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.strokeStyle = 'rgba(255, 230, 109, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, 0, false);
    ctx.stroke();

    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 1.5;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffe66d';
    for (let deg = 0; deg <= 180; deg += 10){
      const rad = (deg - 90) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const outerX = cos * radius;
      const outerY = sin * radius;
      const innerLen = (deg % 30 === 0) ? 22 : 14;
      const innerX = cos * (radius - innerLen);
      const innerY = sin * (radius - innerLen);
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();

      if (deg % 30 === 0){
        const labelRadius = radius + 16;
        ctx.fillText(`${deg}°`, cos * labelRadius - 12, sin * labelRadius + 4);
      }
    }

    // indicator for current angle
    const currentRad = (currentAngle - 90) * Math.PI / 180;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(currentRad) * (inner - 8), Math.sin(currentRad) * (inner - 8));
    ctx.lineTo(Math.cos(currentRad) * (radius + 6), Math.sin(currentRad) * (radius + 6));
    ctx.stroke();
    ctx.restore();
  }

  function drawHeightScale(ctx, pivotX, tipX, tipY, scale){
    const side = tipX >= pivotX ? 1 : -1;
    const offset = 26;
    const startX = tipX + side * offset;
    const startY = tipY;
    const maxMeters = 10;
    const heightPx = maxMeters * scale;
    const endY = startY + heightPx;

    ctx.save();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, endY);
    ctx.stroke();

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6b6b';
    ctx.textAlign = side > 0 ? 'left' : 'right';
    for (let i = 0; i <= maxMeters * 4; i++){
      const y = startY + i * (scale * 0.25);
      const isMeter = i % 4 === 0;
      const tickLen = isMeter ? 14 : 8;
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

  window.Animator = {
    start,
    stop
  };
})();
