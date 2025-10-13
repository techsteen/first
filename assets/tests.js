(function(){
  function runTests(timeline, taskSpec){
    if (!Array.isArray(taskSpec?.tests)) return [];
    const results = [];
    for (const test of taskSpec.tests){
      let result;
      switch(test.type){
        case 'AngleReached':
          result = angleReached(timeline, test);
          break;
        case 'Overshoot':
          result = overshoot(timeline, test);
          break;
        case 'SteadyState':
          result = steadyState(timeline, test);
          break;
        case 'LiftReached':
          result = liftReached(timeline, test);
          break;
        case 'SafetyNeverRed':
          result = safetyNeverRed(timeline, test);
          break;
        case 'CarReachedGoal':
          result = carReachedGoal(timeline, test, taskSpec);
          break;
        case 'CarCheckpoint':
          result = carCheckpoint(timeline, test, taskSpec);
          break;
        case 'CarNoCollision':
          result = carNoCollision(timeline, test);
          break;
        default:
          result = {name: test.name, pass: false, detail: 'Ukendt testtype.'};
      }
      results.push({...result, name: test.name});
    }
    return results;
  }

  function angleReached(timeline, spec){
    const target = spec.target || 0;
    const tol = spec.tol ?? 1;
    const within = spec.withinMs ?? 5000;
    const reached = timeline.find(sample => sample.t <= within && Math.abs(sample.angle - target) <= tol);
    return {
      pass: Boolean(reached),
      detail: reached ? `Ramte ${reached.angle.toFixed(2)}° ved ${reached.t} ms.` : 'Målet blev ikke nået i tide.'
    };
  }

  function overshoot(timeline, spec){
    if (!timeline.length){
      return {pass:false, detail:'Ingen data til overshoot-måling.'};
    }
    const target = spec.target ?? 0;
    const maxDeg = spec.maxDeg ?? 5;
    const hitTol = spec.hitTolerance ?? 2;
    const startAngle = timeline[0]?.angle ?? target;
    const expectingIncrease = startAngle <= target;

    let firstHitIndex = timeline.findIndex(sample => Math.abs(sample.angle - target) <= hitTol);
    if (firstHitIndex === -1){
      return {pass:false, detail:'Målet blev ikke ramt, så overshoot kan ikke vurderes.'};
    }

    let overshootAmount = 0;
    for (let i = firstHitIndex; i < timeline.length; i++){
      const sample = timeline[i];
      const diff = sample.angle - target;
      if (expectingIncrease){
        if (diff > overshootAmount){
          overshootAmount = diff;
        }
      } else {
        const below = target - sample.angle;
        if (below > overshootAmount){
          overshootAmount = below;
        }
      }
    }

    const pass = overshootAmount <= maxDeg + 1e-6;
    const overshootText = overshootAmount.toFixed(2);
    return {
      pass,
      detail: pass
        ? `Overshoot ${overshootText}° (grænse ${maxDeg}°).`
        : `Overshoot ${overshootText}° overskrider grænsen på ${maxDeg}°.`
    };
  }

  function steadyState(timeline, spec){
    const metric = spec.metric || 'angle';
    const duration = spec.durationMs ?? 800;
    const maxError = spec.maxError ?? 0.5;
    const target = spec.target ?? (metric === 'angle' ? timeline[timeline.length-1]?.angle : timeline[timeline.length-1]?.height);
    let pass = false;
    let detail = 'Kunne ikke bekræfte steady state.';
    for (let i = 0; i < timeline.length; i++){
      const start = timeline[i];
      if (!start) continue;
      const endTime = start.t + duration;
      const window = timeline.filter(sample => sample.t >= start.t && sample.t <= endTime);
      if (window.length === 0) continue;
      const ok = window.every(sample => Math.abs(sample[metric] - target) <= maxError);
      if (ok){
        pass = true;
        detail = `Holdt ${metric} inden for ±${maxError} fra ${start.t}ms til ${endTime}ms.`;
        break;
      }
    }
    return {pass, detail};
  }

  function liftReached(timeline, spec){
    const target = spec.target ?? 0;
    const tol = spec.tol ?? 0.05;
    const steadyMs = spec.steadyMs ?? 800;
    const reached = timeline.find(sample => Math.abs(sample.height - target) <= tol);
    if (!reached){
      return {pass:false, detail:'Højden nåede ikke målet.'};
    }
    const startTime = reached.t;
    const window = timeline.filter(sample => sample.t >= startTime && sample.t <= startTime + steadyMs);
    const stable = window.every(sample => Math.abs(sample.height - target) <= tol);
    return {
      pass: stable,
      detail: stable ? `Højde stabil ved ${target}m.` : 'Højde var ikke stabil længe nok.'
    };
  }

  function safetyNeverRed(timeline, spec){
    const maxRedMs = spec.maxRedMs ?? 200;
    let redAccum = 0;
    for (let i = 1; i < timeline.length; i++){
      const prev = timeline[i-1];
      const cur = timeline[i];
      const dt = cur.t - prev.t;
      if (prev.safe === 'red' || cur.safe === 'red'){
        redAccum += dt;
        if (redAccum > maxRedMs){
          return {pass:false, detail:`Sikkerhed var rød i ${redAccum} ms.`};
        }
      }
    }
    return {pass:true, detail:`Rød i ${redAccum} ms (grænse ${maxRedMs}).`};
  }

  function carReachedGoal(timeline, spec, task){
    if (!timeline.length){
      return {pass:false, detail:'Ingen bevægelse registreret.'};
    }
    const tol = spec.tol ?? 0.2;
    const within = spec.withinMs ?? (task?.maxDurationMs || 20000);
    const goal = task?.goal || {x:0, y:0};
    const goalX = (goal.x || 0) + 0.5;
    const goalY = (goal.y || 0) + 0.5;
    const reached = timeline.find(sample => sample.t <= within && distance(sample.x, sample.y, goalX, goalY) <= tol);
    const pass = Boolean(reached);
    return {
      pass,
      detail: pass ? `Målet nået ved ${reached.t} ms med afstand ${distance(reached.x, reached.y, goalX, goalY).toFixed(2)}.` : 'Målet blev ikke nået i tide.'
    };
  }

  function carCheckpoint(timeline, spec, task){
    const index = spec.index ?? 0;
    const checkpoints = task?.checkpoints || [];
    if (!checkpoints[index]){
      return {pass:false, detail:'Checkpoint findes ikke i opgaven.'};
    }
    const metSample = timeline.find(sample => Array.isArray(sample.checkpointOrder) && sample.checkpointOrder.includes(index));
    if (!metSample){
      return {pass:false, detail:`Checkpoint ${index + 1} blev ikke registreret.`};
    }
    const orderOk = metSample.checkpointOrder.every((value, idx) => value === idx);
    return {
      pass: orderOk,
      detail: orderOk ? `Checkpoint ${index + 1} registreret ved ${metSample.t} ms.` : 'Checkpoints blev ikke taget i korrekt rækkefølge.'
    };
  }

  function carNoCollision(timeline, spec){
    const collided = timeline.some(sample => sample.collided);
    return {
      pass: !collided,
      detail: collided ? 'Bilen ramte væggen.' : 'Ingen kollision registreret.'
    };
  }

  function distance(x1, y1, x2, y2){
    return Math.hypot((x1 ?? 0) - (x2 ?? 0), (y1 ?? 0) - (y2 ?? 0));
  }

  window.TestRunner = {
    runTests
  };
})();
