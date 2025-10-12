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
    const target = spec.target || 0;
    const maxDeg = spec.maxDeg ?? 5;
    const max = timeline.reduce((m, sample) => Math.max(m, Math.abs(sample.angle - target)), 0);
    const pass = max <= maxDeg;
    return {pass, detail: `Maks afvigelse ${max.toFixed(2)}° (grænse ${maxDeg}°).`};
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

  window.TestRunner = {
    runTests
  };
})();
