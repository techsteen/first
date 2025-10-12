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
    const baseY = canvas.height - 60;

    // draw base
    ctx.fillStyle = '#22364f';
    ctx.fillRect(centerX - 80, baseY, 160, 40);
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(centerX - 30, baseY - 40, 60, 40);

    const armLength = 220;
    const angleRad = (sample.angle - 90) * Math.PI / 180;
    const pivotX = centerX;
    const pivotY = baseY - 40;

    const tipX = pivotX + Math.cos(angleRad) * armLength;
    const tipY = pivotY + Math.sin(angleRad) * armLength;

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    const hookX = tipX;
    const hookY = tipY + Math.abs(sample.height) * 40;

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

  window.Animator = {
    start,
    stop
  };
})();
