(function(){
  const API_FUNCTIONS = new Set([
    'SetSpeed','Rotate','RotateTo','Lift','LiftTo','GetAngle','GetHeight','IsSafe',
    'ResetCar','SetDriveSpeed','SetTurnSpeed','DriveForward','StopCar','TurnLeft','TurnRight','TurnTo','GetPosX','GetPosY','GetHeading','IsWallAhead','IsGoalReached'
  ]);
  const MATH_FUNCTIONS = {
    'Math.Abs': Math.abs,
    'Math.Max': Math.max,
    'Math.Min': Math.min,
    'Math.Sign': Math.sign
  };
  const LOOP_LIMIT = 4096;
  const MAX_CALL_DEPTH = 32;

  function stripComments(code){
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  }

  function tokenize(code){
    const tokens = [];
    const patterns = {
      number: /^(?:\d+\.\d+|\d+\.\d*|\d*\.\d+|\d+)/,
      identifier: /^[A-Za-z_][A-Za-z0-9_]*/
    };
    const compoundOps = ['<=','>=','==','!=','&&','||','++','--'];
    const punctuators = new Set(['{','}','(',')',';',',']);
    const singleOps = new Set(['+','-','*','/','%','<','>','=','!','&','|']);
    let i = 0;
    while (i < code.length){
      const char = code[i];
      if (/\s/.test(char)){ i++; continue; }
      let matched = false;
      for (const op of compoundOps){
        if (code.startsWith(op, i)){
          tokens.push({type:'operator', value:op});
          i += op.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      if (punctuators.has(char)){
        tokens.push({type: char, value: char});
        i++;
        continue;
      }
      if (char === '.'){
        tokens.push({type:'.', value:'.'});
        i++;
        continue;
      }
      if (singleOps.has(char)){
        tokens.push({type:'operator', value:char});
        i++;
        continue;
      }
      const rest = code.slice(i);
      const numberMatch = rest.match(patterns.number);
      if (numberMatch){
        tokens.push({type:'number', value:numberMatch[0]});
        i += numberMatch[0].length;
        continue;
      }
      const idMatch = rest.match(patterns.identifier);
      if (idMatch){
        const value = idMatch[0];
        if (['public','static','void','int','double','bool','true','false','if','else','while','for','return'].includes(value)){
          tokens.push({type:'keyword', value});
        } else {
          tokens.push({type:'identifier', value});
        }
        i += value.length;
        continue;
      }
      throw new Error('Ugyldigt token ved: ' + rest.slice(0, 12));
    }
    tokens.push({type:'eof', value:null});
    return tokens;
  }

  class Parser {
    constructor(tokens){
      this.tokens = tokens;
      this.pos = 0;
    }
    peek(){ return this.tokens[this.pos]; }
    consume(){ return this.tokens[this.pos++]; }
    expect(type, value){
      const token = this.peek();
      if (!token || token.type !== type || (value && token.value !== value)){
        throw new Error(`Forventede ${value || type} men fandt ${token ? token.value : 'slut'}`);
      }
      this.pos++;
      return token;
    }
    match(type, value){
      const token = this.peek();
      if (token && token.type === type && (!value || token.value === value)){
        this.pos++;
        return true;
      }
      return false;
    }
    parseProgram(){
      const statements = [];
      while (this.peek().type !== 'eof'){
        statements.push(this.parseStatement());
      }
      return {type:'block', body:statements};
    }
    parseStatement(){
      const token = this.peek();
      if (token.type === 'keyword'){
        switch(token.value){
          case 'int':
          case 'double':
          case 'bool':
            return this.parseVariableDeclaration();
          case 'if':
            return this.parseIf();
          case 'while':
            return this.parseWhile();
          case 'for':
            return this.parseFor();
          case 'return':
            this.consume();
            if (!this.match(';')){
              this.parseExpression();
              this.expect(';');
            }
            return {type:'return'};
          default:
            throw new Error('Ikke tilladt keyword: ' + token.value);
        }
      }
      if (token.type === '{'){
        return this.parseBlock();
      }
      const expr = this.parseExpression();
      this.expect(';');
      return {type:'expr', expression:expr};
    }
    parseBlock(){
      this.expect('{');
      const body = [];
      while (!this.match('}')){
        if (this.peek().type === 'eof') throw new Error('Manglende }');
        body.push(this.parseStatement());
      }
      return {type:'block', body};
    }
    parseVariableDeclaration(){
      const typeToken = this.consume();
      const id = this.expect('identifier');
      let init = null;
      if (this.match('operator','=')){
        init = this.parseExpression();
      }
      this.expect(';');
      return {type:'var', varType:typeToken.value, name:id.value, init};
    }
    parseIf(){
      this.consume();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const consequent = this.parseStatement();
      let alternate = null;
      if (this.match('keyword','else')){
        alternate = this.parseStatement();
      }
      return {type:'if', test, consequent, alternate};
    }
    parseWhile(){
      this.consume();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const body = this.parseStatement();
      return {type:'while', test, body};
    }
    parseFor(){
      this.consume();
      this.expect('(');
      let init = null;
      if (!this.match(';')){
        if (this.peek().type === 'keyword' && ['int','double','bool'].includes(this.peek().value)){
          init = this.parseVariableDeclaration();
        } else {
          init = this.parseExpression();
          this.expect(';');
        }
      }
      let test = null;
      if (!this.match(';')){
        test = this.parseExpression();
        this.expect(';');
      }
      let update = null;
      if (!this.match(')')){
        update = this.parseExpression();
        this.expect(')');
      }
      const body = this.parseStatement();
      return {type:'for', init, test, update, body};
    }
    parseExpression(){
      return this.parseAssignment();
    }
    parseAssignment(){
      const left = this.parseLogicalOr();
      if (this.match('operator','=')){
        if (left.type !== 'identifier'){
          throw new Error('Kun variabler kan tildeles.');
        }
        const right = this.parseAssignment();
        return {type:'assign', name:left.name, value:right};
      }
      return left;
    }
    parseLogicalOr(){
      let expr = this.parseLogicalAnd();
      while (this.match('operator','||')){
        expr = {type:'binary', operator:'||', left:expr, right:this.parseLogicalAnd()};
      }
      return expr;
    }
    parseLogicalAnd(){
      let expr = this.parseEquality();
      while (this.match('operator','&&')){
        expr = {type:'binary', operator:'&&', left:expr, right:this.parseEquality()};
      }
      return expr;
    }
    parseEquality(){
      let expr = this.parseComparison();
      while (true){
        if (this.match('operator','==')){
          expr = {type:'binary', operator:'==', left:expr, right:this.parseComparison()};
        } else if (this.match('operator','!=')){
          expr = {type:'binary', operator:'!=', left:expr, right:this.parseComparison()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseComparison(){
      let expr = this.parseTerm();
      while (true){
        if (this.match('operator','<')){
          expr = {type:'binary', operator:'<', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','>')){
          expr = {type:'binary', operator:'>', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','<=')){
          expr = {type:'binary', operator:'<=', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','>=')){
          expr = {type:'binary', operator:'>=', left:expr, right:this.parseTerm()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseTerm(){
      let expr = this.parseFactor();
      while (true){
        if (this.match('operator','+')){
          expr = {type:'binary', operator:'+', left:expr, right:this.parseFactor()};
        } else if (this.match('operator','-')){
          expr = {type:'binary', operator:'-', left:expr, right:this.parseFactor()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseFactor(){
      let expr = this.parseUnary();
      while (true){
        if (this.match('operator','*')){
          expr = {type:'binary', operator:'*', left:expr, right:this.parseUnary()};
        } else if (this.match('operator','/')){
          expr = {type:'binary', operator:'/', left:expr, right:this.parseUnary()};
        } else if (this.match('operator','%')){
          expr = {type:'binary', operator:'%', left:expr, right:this.parseUnary()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseUnary(){
      if (this.match('operator','!')){
        return {type:'unary', operator:'!', argument:this.parseUnary()};
      }
      if (this.match('operator','-')){
        return {type:'unary', operator:'neg', argument:this.parseUnary()};
      }
      return this.parsePrimary();
    }
    parsePrimary(){
      const token = this.consume();
      if (token.type === 'number'){
        return {type:'number', value: parseFloat(token.value)};
      }
      if (token.type === 'keyword' && (token.value === 'true' || token.value === 'false')){
        return {type:'boolean', value: token.value === 'true'};
      }
      if (token.type === '('){
        const expr = this.parseExpression();
        this.expect(')');
        return expr;
      }
      if (token.type === 'identifier'){
        let name = token.value;
        while (this.match('.')){
          const next = this.expect('identifier');
          name += '.' + next.value;
        }
        if (this.match('(')){
          const args = [];
          if (!this.match(')')){
            do {
              args.push(this.parseExpression());
            } while (this.match(','));
            this.expect(')');
          }
          if (!API_FUNCTIONS.has(name) && !Object.prototype.hasOwnProperty.call(MATH_FUNCTIONS, name)){
            return {type:'userCall', name, args};
          }
          return {type:'call', name, args};
        }
        return {type:'identifier', name};
      }
      throw new Error('Uventet token: ' + token.value);
    }
  }

  class Environment {
    constructor(parent){
      this.parent = parent || null;
      this.values = Object.create(null);
    }
    define(name, value){
      this.values[name] = value;
    }
    assign(name, value){
      if (Object.prototype.hasOwnProperty.call(this.values, name)){
        this.values[name] = value;
        return;
      }
      if (this.parent){
        this.parent.assign(name, value);
        return;
      }
      throw new Error('Ukendt variabel: ' + name);
    }
    get(name){
      if (Object.prototype.hasOwnProperty.call(this.values, name)){
        return this.values[name];
      }
      if (this.parent){
        return this.parent.get(name);
      }
      throw new Error('Ukendt variabel: ' + name);
    }
  }

  function evaluate(expr, env, ctx){
    switch(expr.type){
      case 'number': return expr.value;
      case 'boolean': return expr.value;
      case 'identifier': return env.get(expr.name);
      case 'assign': {
        const value = evaluate(expr.value, env, ctx);
        env.assign(expr.name, value);
        return value;
      }
      case 'unary': {
        const val = evaluate(expr.argument, env, ctx);
        if (expr.operator === '!') return !val;
        if (expr.operator === 'neg') return -val;
        throw new Error('Ukendt unær operator');
      }
      case 'binary': {
        const left = evaluate(expr.left, env, ctx);
        const right = evaluate(expr.right, env, ctx);
        switch(expr.operator){
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right === 0 ? 0 : left / right;
          case '%': return left % right;
          case '<': return left < right;
          case '>': return left > right;
          case '<=': return left <= right;
          case '>=': return left >= right;
          case '==': return left === right;
          case '!=': return left !== right;
          case '&&': return Boolean(left) && Boolean(right);
          case '||': return Boolean(left) || Boolean(right);
          default: throw new Error('Ukendt operator ' + expr.operator);
        }
      }
      case 'call': {
        const fn = ctx.api[expr.name] || (ctx.math && ctx.math[expr.name]);
        if (!fn) throw new Error('Ikke tilladt API: ' + expr.name);
        const args = expr.args.map(arg => evaluate(arg, env, ctx));
        return fn.apply(null, args);
      }
      case 'userCall': {
        const userFn = ctx.functions && ctx.functions[expr.name];
        if (!userFn) throw new Error('Ukendt funktionskald: ' + expr.name);
        const args = expr.args.map(arg => evaluate(arg, env, ctx));
        return invokeUserFunction(userFn, args, ctx);
      }
      default:
        throw new Error('Uventet udtrykstype: ' + expr.type);
    }
  }

  function execute(node, env, ctx){
    switch(node.type){
      case 'block':
        return executeBlock(node, env, ctx, false);
      case 'var': {
        const value = node.init ? evaluate(node.init, env, ctx) : defaultValue(node.varType);
        env.define(node.name, value);
        return null;
      }
      case 'expr':
        evaluate(node.expression, env, ctx);
        return null;
      case 'if': {
        if (truthy(evaluate(node.test, env, ctx))){
          return execute(node.consequent, env, ctx);
        } else if (node.alternate){
          return execute(node.alternate, env, ctx);
        }
        return null;
      }
      case 'while': {
        let guard = LOOP_LIMIT;
        while (truthy(evaluate(node.test, env, ctx))){
          if (--guard < 0) throw new Error('While-løkke overskred grænse.');
          const result = execute(node.body, env, ctx);
          if (isReturnResult(result)) return result;
        }
        return null;
      }
      case 'for': {
        const scope = new Environment(env);
        if (node.init){
          if (node.init.type === 'var'){
            execute(node.init, scope, ctx);
          } else {
            evaluate(node.init, scope, ctx);
          }
        }
        let guard = LOOP_LIMIT;
        while (true){
          if (node.test && !truthy(evaluate(node.test, scope, ctx))) break;
          const result = execute(node.body, scope, ctx);
          if (isReturnResult(result)) return result;
          if (--guard < 0) throw new Error('For-løkke overskred grænse.');
          if (node.update){ evaluate(node.update, scope, ctx); }
          if (!node.test) break;
        }
        return null;
      }
      case 'return':
        return {type:'return'};
      default:
        throw new Error('Ukendt statement: ' + node.type);
    }
  }

  function executeBlock(node, env, ctx, keepScope){
    const scope = keepScope ? env : new Environment(env);
    for (const stmt of node.body){
      const result = execute(stmt, scope, ctx);
      if (isReturnResult(result)) return result;
    }
    return null;
  }

  function isReturnResult(result){
    return result && result.type === 'return';
  }

  function invokeUserFunction(fnDef, args, ctx){
    if (args.length !== fnDef.params.length){
      throw new Error(`Forkert antal argumenter til ${fnDef.name}`);
    }
    const depth = (ctx.callDepth || 0) + 1;
    if (depth > MAX_CALL_DEPTH){
      throw new Error('Funktionskald for dyb (rekursion forbudt).');
    }
    const baseEnv = ctx.globals || new Environment();
    const fnEnv = new Environment(baseEnv);
    fnDef.params.forEach((param, index) => {
      fnEnv.define(param.name, args[index]);
    });
    const innerCtx = Object.assign({}, ctx, {callDepth: depth});
    const result = executeBlock(fnDef.body, fnEnv, innerCtx, true);
    if (isReturnResult(result) && result.value !== undefined){
      return result.value;
    }
    return null;
  }

  function defaultValue(type){
    switch(type){
      case 'int':
      case 'double': return 0;
      case 'bool': return false;
      default: return null;
    }
  }

  function truthy(value){
    return Boolean(value);
  }

  function parseStudentCode(code){
    const cleaned = stripComments(code);
    const {code: withoutGlobals, globals} = extractGlobalConstants(cleaned);
    const {code: withoutExtras, functions: extraFunctions} = extractAdditionalFunctions(withoutGlobals);

    const setupSection = extractFunctionBody(withoutExtras, /public\s+static\s+void\s+Setup\s*\(\s*\)\s*\{/i);
    const tickSection = extractFunctionBody(withoutExtras, /public\s+static\s+void\s+Tick\s*\(\s*int\s+\w+\s*\)\s*\{/i);
    if (!setupSection) throw new Error('Kunne ikke finde Setup().');
    if (!tickSection) throw new Error('Kunne ikke finde Tick(int dt).');

    const globalInject = globals.map(g => `${g.varType} ${g.name} = ${g.value};`).join('\n');
    const prefix = globalInject ? globalInject + '\n' : '';

    const setupTokens = tokenize(prefix + setupSection.body);
    const tickTokens = tokenize(prefix + tickSection.body);
    const setupAst = new Parser(setupTokens).parseProgram();
    const tickAst = new Parser(tickTokens).parseProgram();

    const functions = {};
    extraFunctions.forEach(fn => {
      const tokens = tokenize(prefix + fn.body);
      const ast = new Parser(tokens).parseProgram();
      functions[fn.name] = {name: fn.name, params: fn.params, body: ast};
    });

    return {setup: setupAst, tick: tickAst, globals, functions};
  }

  function extractGlobalConstants(code){
    const globals = [];
    const pattern = /(const|static\s+readonly)\s+(int|double|bool)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^;]+);/gi;
    const cleaned = code.replace(pattern, (_, __, type, name, value) => {
      const varType = String(type).toLowerCase();
      globals.push({varType, name, value: value.trim()});
      return '';
    });
    return {code: cleaned, globals};
  }

  function extractFunctionBody(code, signatureRegex){
    const match = signatureRegex.exec(code);
    if (!match) return null;
    const bodyStart = match.index + match[0].length;
    const captured = captureBlock(code, bodyStart);
    return {body: captured.body, end: captured.end};
  }

  function extractAdditionalFunctions(code){
    const regex = /(public\s+)?static\s+void\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{/gi;
    const functions = [];
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(code))){
      const name = match[2];
      if (/^Setup$/i.test(name) || /^Tick$/i.test(name)){
        continue;
      }
      const params = parseParameters(match[3]);
      const start = match.index;
      const bodyInfo = captureBlock(code, regex.lastIndex);
      functions.push({name, params, body: bodyInfo.body});
      result += code.slice(lastIndex, start);
      lastIndex = bodyInfo.end;
      regex.lastIndex = bodyInfo.end;
    }
    result += code.slice(lastIndex);
    return {code: result, functions};
  }

  function captureBlock(code, startIndex){
    let depth = 1;
    let index = startIndex;
    while (index < code.length){
      const char = code[index++];
      if (char === '{') depth++;
      else if (char === '}'){
        depth--;
        if (depth === 0){
          return {body: code.slice(startIndex, index - 1), end: index};
        }
      }
    }
    throw new Error('Manglede afsluttende } for funktion.');
  }

  function parseParameters(paramText){
    const trimmed = paramText.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map(part => {
      const match = part.trim().match(/^(int|double|bool)\s+([A-Za-z_][A-Za-z0-9_]*)$/);
      if (!match) throw new Error('Ukendt parameterdeklaration: ' + part.trim());
      return {type: match[1], name: match[2]};
    });
  }

  function simulate(parsed, task){
    const mode = (task && task.mode) || 'crane';
    if (mode === 'car'){
      return simulateCar(parsed, task || {});
    }
    return simulateCrane(parsed, task || {});
  }

  function simulateCrane(parsed, task){
    const dt = 16;
    const maxTime = task.maxDurationMs || 12000;
    const timeline = [];
    const commandLog = [];
    const state = {
      angle: 0,
      height: 0,
      rotationSpeed: 15,
      liftSpeed: 0.3,
      targetAngle: 0,
      targetHeight: 0,
      safety: 'green',
      redDuration: 0,
      time: 0
    };

    const api = createCraneApi(state, commandLog);
    const globalEnv = new Environment();
    globalEnv.define('dt', dt);
    const ctxBase = {api, math: MATH_FUNCTIONS, functions: parsed.functions || {}, globals: globalEnv, callDepth: 0};
    try {
      executeBlock(parsed.setup, globalEnv, ctxBase, true);
    } catch (err){
      throw new Error('Setup-fejl: ' + err.message);
    }

    for (let t = 0; t <= maxTime; t += dt){
      state.time = t;
      const tickEnv = new Environment(globalEnv);
      tickEnv.define('dt', dt);
      try {
        execute(parsed.tick, tickEnv, ctxBase);
      } catch (err){
        throw new Error('Tick-fejl ved ' + t + ' ms: ' + err.message);
      }
      stepCrane(state, dt);
      timeline.push({t, mode:'crane', angle: state.angle, height: state.height, safe: state.safety});
    }

    return {timeline, commandLog, message:'OK', mode:'crane'};
  }

  function createCraneApi(state, log){
    return {
      SetSpeed(value){
        const speed = clampNumber(value, -720, 720);
        const absSpeed = Math.abs(speed);
        state.rotationSpeed = absSpeed;
        state.liftSpeed = absSpeed > 0 ? Math.max(0.05, absSpeed / 40) : 0;
        log.push({time: state.time, op:'SetSpeed', value: state.rotationSpeed});
      },
      Rotate(value){
        const target = state.angle + value;
        state.targetAngle = normalizeAngle(target);
        log.push({time: state.time, op:'Rotate', value});
      },
      RotateTo(value){
        state.targetAngle = normalizeAngle(value);
        log.push({time: state.time, op:'RotateTo', value});
      },
      Lift(value){
        state.targetHeight = clampNumber(state.height + value, 0, 10);
        log.push({time: state.time, op:'Lift', value});
      },
      LiftTo(value){
        state.targetHeight = clampNumber(value, 0, 10);
        log.push({time: state.time, op:'LiftTo', value});
      },
      GetAngle(){
        return state.angle;
      },
      GetHeight(){
        return state.height;
      },
      IsSafe(){
        return state.safety !== 'red';
      }
    };
  }

  function stepCrane(state, dt){
    const dtSec = dt / 1000;
    const angleDiff = shortestAngleDiff(state.angle, state.targetAngle);
    const maxStep = state.rotationSpeed * dtSec;
    const angleStep = clampNumber(angleDiff, -maxStep, maxStep);
    state.angle = normalizeAngle(state.angle + angleStep);

    const heightDiff = state.targetHeight - state.height;
    const liftStep = clampNumber(heightDiff, -state.liftSpeed * dtSec, state.liftSpeed * dtSec);
    state.height = clampNumber(state.height + liftStep, 0, 10);

    const rotationRate = dtSec > 0 ? Math.abs(angleStep) / dtSec : 0;
    const liftRate = dtSec > 0 ? Math.abs(liftStep) / dtSec : 0;
    let safety = 'green';
    if (rotationRate > 35 || liftRate > 0.9) safety = 'yellow';
    if (rotationRate > 55 || liftRate > 1.2) safety = 'red';
    if (safety === 'red'){
      state.redDuration += dt;
    } else {
      state.redDuration = Math.max(0, state.redDuration - dt);
    }
    state.safety = safety;
  }

  function simulateCar(parsed, task){
    const dt = 16;
    const maxTime = task.maxDurationMs || 20000;
    const timeline = [];
    const commandLog = [];
    const maze = buildMaze(task.maze || []);
    const start = task.start || {x:0, y:0, heading:0};
    const goal = task.goal || {x:0, y:0};
    const checkpoints = Array.isArray(task.checkpoints) ? task.checkpoints : [];

    const state = {
      time: 0,
      x: (start.x || 0) + 0.5,
      y: (start.y || 0) + 0.5,
      heading: normalizeAngle(start.heading || 0),
      targetHeading: normalizeAngle(start.heading || 0),
      turnSpeed: 180,
      driveSpeed: 1.5,
      driveRemaining: 0,
      driveDirection: 1,
      safe: 'green',
      collided: false,
      goalReached: false,
      goalReachedTime: null,
      checkpointsVisited: new Set(),
      checkpointOrder: [],
      maze,
      start,
      goal,
      checkpoints
    };

    const api = createCarApi(state, task, commandLog);
    const globalEnv = new Environment();
    globalEnv.define('dt', dt);
    const ctxBase = {api, math: MATH_FUNCTIONS, functions: parsed.functions || {}, globals: globalEnv, callDepth: 0};
    api.ResetCar();
    try {
      executeBlock(parsed.setup, globalEnv, ctxBase, true);
    } catch (err){
      throw new Error('Setup-fejl: ' + err.message);
    }

    for (let t = 0; t <= maxTime; t += dt){
      state.time = t;
      const tickEnv = new Environment(globalEnv);
      tickEnv.define('dt', dt);
      try {
        execute(parsed.tick, tickEnv, ctxBase);
      } catch (err){
        throw new Error('Tick-fejl ved ' + t + ' ms: ' + err.message);
      }
      stepCar(state, dt, task);
      timeline.push({
        t,
        mode:'car',
        x: state.x,
        y: state.y,
        heading: state.heading,
        safe: state.safe,
        goal: state.goalReached,
        checkpoints: state.checkpointsVisited.size,
        checkpointOrder: state.checkpointOrder.slice(),
        collided: state.collided
      });
    }

    return {timeline, commandLog, message:'OK', mode:'car'};
  }

  function createCarApi(state, task, log){
    const maxDriveSpeed = typeof task.maxDriveSpeed === 'number' ? Math.max(0.2, Math.abs(task.maxDriveSpeed)) : 3;
    const maxTurnSpeed = typeof task.maxTurnSpeed === 'number' ? Math.max(30, Math.abs(task.maxTurnSpeed)) : 360;

    function reset(){
      state.x = (state.start.x || 0) + 0.5;
      state.y = (state.start.y || 0) + 0.5;
      state.heading = normalizeAngle(state.start.heading || 0);
      state.targetHeading = state.heading;
      state.turnSpeed = 180;
      state.driveSpeed = 1.5;
      state.driveRemaining = 0;
      state.driveDirection = 1;
      state.safe = 'green';
      state.collided = false;
      state.goalReached = false;
      state.goalReachedTime = null;
      state.checkpointsVisited.clear();
      state.checkpointOrder = [];
      log.push({time: state.time, op:'ResetCar'});
    }

    return {
      ResetCar(){ reset(); },
      SetDriveSpeed(value){
        const speed = clampNumber(value, 0, maxDriveSpeed);
        state.driveSpeed = speed;
        log.push({time: state.time, op:'SetDriveSpeed', value:speed});
      },
      SetTurnSpeed(value){
        const speed = clampNumber(value, 0, maxTurnSpeed);
        state.turnSpeed = speed;
        log.push({time: state.time, op:'SetTurnSpeed', value:speed});
      },
      DriveForward(distance){
        const dist = clampNumber(distance, -50, 50);
        state.driveRemaining = Math.abs(dist);
        state.driveDirection = dist >= 0 ? 1 : -1;
        log.push({time: state.time, op:'DriveForward', value:dist});
      },
      StopCar(){
        state.driveRemaining = 0;
        log.push({time: state.time, op:'StopCar'});
      },
      TurnLeft(){
        state.targetHeading = normalizeAngle(state.heading - 90);
        log.push({time: state.time, op:'TurnLeft'});
      },
      TurnRight(){
        state.targetHeading = normalizeAngle(state.heading + 90);
        log.push({time: state.time, op:'TurnRight'});
      },
      TurnTo(value){
        const target = clampNumber(value, -720, 720);
        state.targetHeading = normalizeAngle(target);
        log.push({time: state.time, op:'TurnTo', value: state.targetHeading});
      },
      GetPosX(){ return state.x; },
      GetPosY(){ return state.y; },
      GetHeading(){ return state.heading; },
      IsWallAhead(distance){
        const dist = Math.max(0, distance);
        return detectWallAhead(state, dist);
      },
      IsGoalReached(){ return state.goalReached; }
    };
  }

  function stepCar(state, dt, task){
    const dtSec = dt / 1000;
    const turnStep = clampNumber(shortestAngleDiff(state.heading, state.targetHeading), -state.turnSpeed * dtSec, state.turnSpeed * dtSec);
    state.heading = normalizeAngle(state.heading + turnStep);

    if (state.driveRemaining > 0 && state.driveSpeed > 0 && !state.collided){
      const step = Math.min(state.driveRemaining, state.driveSpeed * dtSec);
      const distance = step * state.driveDirection;
      const rad = state.heading * Math.PI / 180;
      const newX = state.x + Math.cos(rad) * distance;
      const newY = state.y + Math.sin(rad) * distance;
      if (pathIsClear(state.x, state.y, newX, newY, state.maze)){
        state.x = newX;
        state.y = newY;
        state.driveRemaining -= step;
      } else {
        state.collided = true;
        state.driveRemaining = 0;
      }
    } else {
      state.driveRemaining = 0;
    }

    const warning = detectWallAhead(state, 0.2);
    if (state.collided){
      state.safe = 'red';
    } else if (warning){
      state.safe = 'yellow';
    } else {
      state.safe = 'green';
    }

    updateCheckpoints(state);
    const goalCenter = {x: (state.goal.x || 0) + 0.5, y: (state.goal.y || 0) + 0.5};
    const distToGoal = Math.hypot(state.x - goalCenter.x, state.y - goalCenter.y);
    if (!state.goalReached && distToGoal <= 0.2){
      state.goalReached = true;
      state.goalReachedTime = state.time;
    }
  }

  function updateCheckpoints(state){
    const cellX = Math.floor(state.x);
    const cellY = Math.floor(state.y);
    const index = state.checkpoints.findIndex(cp => cp.x === cellX && cp.y === cellY);
    if (index >= 0 && !state.checkpointsVisited.has(index)){
      state.checkpointsVisited.add(index);
      state.checkpointOrder.push(index);
    }
  }

  function detectWallAhead(state, distance){
    return !pathIsClear(state.x, state.y, state.x + Math.cos(state.heading * Math.PI / 180) * distance, state.y + Math.sin(state.heading * Math.PI / 180) * distance, state.maze);
  }

  function pathIsClear(x1, y1, x2, y2, maze){
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 0.1));
    for (let i = 1; i <= steps; i++){
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (!maze.isWalkable(x, y)){
        return false;
      }
    }
    return true;
  }

  function buildMaze(rows){
    const height = rows.length;
    const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const grid = rows.map(row => row.padEnd(width, '#').split(''));
    function isWalkable(x, y){
      const col = Math.floor(x);
      const row = Math.floor(y);
      if (row < 0 || col < 0 || row >= height || col >= width) return false;
      const cell = grid[row][col];
      return cell !== '#';
    }
    return {height, width, grid, isWalkable};
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

  function clampNumber(value, min, max){
    if (typeof value !== 'number' || Number.isNaN(value)) return min;
    if (max < min) [min, max] = [max, min];
    return Math.min(Math.max(value, min), max);
  }

  window.Sim = {
    parseStudentCode,
    simulate
  };
})();
